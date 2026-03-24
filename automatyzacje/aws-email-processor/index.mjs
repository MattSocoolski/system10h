// index.mjs — Lambda handler for ArtNapi Email Processor
//
// Triggers:
//   1. API Gateway POST /webhook (Gmail Push Notification via Pub/Sub)
//   2. EventBridge fallback (every 15 min)
//
// Flow per email:
//   1. Gmail: fetch new inbox messages
//   2. DynamoDB: dedup (skip already-processed)
//   3. Draft Quality Guard: check if already replied in thread
//   4. Context: S3 (oferta.md, ghost_styl.md) + Notion CRM + Gmail thread
//   5. Bedrock: classify (DECISION → Telegram alert | STANDARD → generate draft)
//   6. Guardrails: price validation + commitment check
//   7. Delivery: Gmail draft + Notion CRM update + Telegram confirmation
//
// Error handling: per-email try/catch — one failure doesn't kill the batch.

import { getSecrets } from './secrets.mjs';
import {
  gmailGetAccessToken,
  gmailSearchMessages,
  gmailGetMessage,
  getThreadMessages,
  gmailListDrafts,
  gmailGetDraft,
  gmailCreateDraft,
} from './gmail.mjs';
import { queryCRM, buildEmailIndex, updateNotionLead } from './notion.mjs';
import { classifyEmail, generateDraft, init as initAI } from './bedrock.mjs';
import { sendTelegram } from './telegram.mjs';
import { loadS3File, checkStaleness } from './s3.mjs';
import {
  isProcessed,
  markProcessed,
  checkFrequencyCap,
  incrementFrequencyCounter,
  checkBudgetCap,
  incrementBudgetCounter,
  updateHeartbeat,
  writeAuditRecord,
} from './dynamo.mjs';
import {
  extractEmail,
  isForeignLead,
  addBusinessDays,
  validatePricesInDraft,
  validateNoCommitments,
  wrapEmailHTML,
  safeLog,
  maskEmail,
} from './utils.mjs';
import { loadTenantConfig, getDefaultTenantId } from './tenant-config.mjs';

const MY_EMAIL = process.env.MY_EMAIL || 'mateusz.sokolski@artnapi.pl';

export async function handler(event) {
  const startTime = Date.now();
  const now = new Date();

  // --- Determine trigger source ---
  const isWebhook = !!(event.body || event.requestContext);
  const isFallback = event.source === 'eventbridge-fallback';

  // Webhook validation (API Gateway security)
  // Layer 1: Pub/Sub subscription path validation (structure check)
  // Layer 2: Pub/Sub Bearer token verification (if WEBHOOK_AUTH_TOKEN env var set)
  // Layer 3: DynamoDB dedup + Gmail API reads (webhook only triggers, payload ignored)
  if (isWebhook && event.body) {
    // Bearer token check — shared secret between Pub/Sub subscription and Lambda
    const authToken = process.env.WEBHOOK_AUTH_TOKEN;
    if (authToken) {
      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      if (authHeader !== `Bearer ${authToken}`) {
        console.warn('[Handler] REJECTED: Invalid or missing webhook auth token');
        return { statusCode: 403, body: 'Forbidden: invalid auth' };
      }
    }
    try {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

      // Validate subscription path (strict format)
      const subscription = body?.subscription || '';
      const validSubscription = /^projects\/[a-z][a-z0-9-]*\/subscriptions\/artnapi-gmail-push$/.test(subscription);
      if (!validSubscription) {
        console.warn('[Handler] REJECTED: Invalid Pub/Sub subscription path', subscription);
        return { statusCode: 403, body: 'Forbidden' };
      }

      // Validate message envelope exists
      if (!body.message || typeof body.message !== 'object') {
        console.warn('[Handler] REJECTED: Missing or invalid message field in Pub/Sub envelope');
        return { statusCode: 400, body: 'Bad Request: missing message' };
      }
    } catch {
      // Malformed body — reject
      console.warn('[Handler] REJECTED: Malformed webhook body');
      return { statusCode: 400, body: 'Bad Request' };
    }
  }

  let secrets;
  let tenantConfig;
  try {
    // --- STEP 1: Load secrets + tenant config ---
    secrets = await getSecrets();
    initAI(secrets.ANTHROPIC_API_KEY);

    // Load tenant config (backward compatible — falls back to env vars if tenant unknown)
    try {
      tenantConfig = loadTenantConfig(getDefaultTenantId());
      console.log(`[Handler] Tenant config loaded: ${tenantConfig.tenantId}`);
    } catch (err) {
      console.warn('[Handler] Tenant config not available, using env var defaults:', err.message);
      tenantConfig = null;
    }
  } catch (err) {
    console.error('[Handler] FATAL: Failed to load secrets:', err.message);
    // Can't send Telegram without secrets — just log and bail
    return { statusCode: 500, body: 'Secrets load failed' };
  }

  try {
    // Update heartbeat if webhook trigger
    if (isWebhook) {
      await updateHeartbeat();
    }

    // --- STEP 2: Gmail — fetch new messages ---
    let accessToken;
    try {
      accessToken = await gmailGetAccessToken(secrets);
    } catch (err) {
      if (err.message.includes('GMAIL_AUTH')) {
        const tgOpts = tenantConfig?.telegramChatId ? { chatId: tenantConfig.telegramChatId } : {};
        await sendTelegram(secrets, `GMAIL AUTH FAILED: ${(err.message || '').slice(0, 200)}\nOdnow token: node automatyzacje/gmail-auth.js na Mac, potem update Secrets Manager.`, tgOpts);
      }
      throw err;
    }

    // Query: inbox messages from others in last hour (webhook) or 15 min (fallback)
    const timeWindow = isFallback ? '20m' : '1h';
    const myEmail = tenantConfig?.email || MY_EMAIL;
    const query = `to:${myEmail} is:inbox newer_than:${timeWindow} -from:${myEmail} -category:promotions -category:social -category:updates`;
    const messages = await gmailSearchMessages(accessToken, query, 10);

    if (messages.length === 0) {
      console.log('[Handler] No new emails');
      return { statusCode: 200, body: 'No new emails' };
    }

    safeLog('[Handler] Found messages', { count: messages.length });

    // --- STEP 3: DynamoDB dedup ---
    const newMessages = [];
    for (const msg of messages) {
      const already = await isProcessed(msg.id);
      if (!already) newMessages.push(msg);
    }

    if (newMessages.length === 0) {
      console.log('[Handler] All messages already processed');
      return { statusCode: 200, body: 'All already processed' };
    }

    safeLog('[Handler] New messages to process', { count: newMessages.length });

    // --- STEP 4: Budget cap check (before any Bedrock calls) ---
    const budget = await checkBudgetCap();
    if (!budget.allowed) {
      const tgOpts = tenantConfig?.telegramChatId ? { chatId: tenantConfig.telegramChatId } : {};
      await sendTelegram(secrets,
        `BUDGET CAP: Lambda przetworzyala ${budget.callsToday} maili dzis (limit: ${budget.cap}). Dalsze maile na jutro.`, tgOpts);
      return { statusCode: 200, body: `Budget cap reached: ${budget.callsToday}/${budget.cap}` };
    }

    // --- STEP 5: Load context (CRM + S3 knowledge base) ---
    // These are loaded once per invocation, shared across all emails
    const s3Prefix = tenantConfig?.s3Prefix || '';
    const notionDatasourceId = tenantConfig?.notionDatasourceId || undefined;
    const [crmLeads, oferta, ghostStyl] = await Promise.all([
      queryCRM(secrets.NOTION_API_KEY, null, { datasourceId: notionDatasourceId }).catch(err => {
        console.error('[Handler] Notion CRM query failed:', (err.message || '').slice(0, 200));
        return []; // Continue without CRM — draft still valuable
      }),
      loadS3File(`${s3Prefix}oferta.md`),
      loadS3File(`${s3Prefix}ghost_styl.md`),
    ]);

    const emailToLead = buildEmailIndex(crmLeads);

    // Check oferta.md staleness (Edge Case 2)
    const staleness = await checkStaleness(`${s3Prefix}oferta.md`, 48);
    if (staleness.stale) {
      const telegramOpts = tenantConfig?.telegramChatId ? { chatId: tenantConfig.telegramChatId } : {};
      await sendTelegram(secrets,
        `STALE DATA: oferta.md na S3 nie byl aktualizowany od ${staleness.ageHours}h. Sprawdz czy ceny sa aktualne.\nSync: aws s3 cp dane/artnapi/oferta.md s3://artnapi-email-processor-kb/${s3Prefix}oferta.md`,
        telegramOpts);
    }

    // Pre-fetch existing drafts for race condition check (Edge Case 1)
    let existingDrafts = [];
    try {
      const draftList = await gmailListDrafts(accessToken, 30);
      // Fetch threadIds for each draft
      existingDrafts = await Promise.all(
        draftList.map(d => gmailGetDraft(accessToken, d.id).catch(() => null))
      );
      existingDrafts = existingDrafts.filter(Boolean);
    } catch (err) {
      console.warn('[Handler] Failed to fetch existing drafts:', (err.message || '').slice(0, 200));
      // Non-critical — continue without race condition check
    }

    const existingDraftThreadIds = new Set(existingDrafts.map(d => d.threadId).filter(Boolean));

    // --- STEP 6: Process each new email ---
    let processedCount = 0;

    for (const msg of newMessages) {
      try {
        await processEmail({
          msg,
          accessToken,
          secrets,
          emailToLead,
          oferta,
          ghostStyl,
          existingDraftThreadIds,
          now,
          tenantConfig,
        });
        processedCount++;
      } catch (err) {
        console.error(`[Handler] Error processing message ${msg.id}:`, (err.message || '').slice(0, 200));
        const tgOpts = tenantConfig?.telegramChatId ? { chatId: tenantConfig.telegramChatId } : {};
        await sendTelegram(secrets, `EMAIL PROCESSOR ERROR: ${(err.message || '').slice(0, 200)}\nMessage ID: ${msg.id}`, tgOpts);
        // Mark as processed to avoid infinite retry loops
        await markProcessed(msg.id, 'unknown', 'ERROR').catch(() => {});
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Handler] Done: ${processedCount} processed in ${elapsed}ms`);

    return {
      statusCode: 200,
      body: `Processed ${processedCount} emails in ${elapsed}ms`,
    };

  } catch (err) {
    console.error('[Handler] FATAL:', (err.message || '').slice(0, 200));
    const tgOpts = tenantConfig?.telegramChatId ? { chatId: tenantConfig.telegramChatId } : {};
    await sendTelegram(secrets, `EMAIL PROCESSOR FATAL ERROR: ${(err.message || '').slice(0, 200)}`, tgOpts).catch(() => {});
    return { statusCode: 500, body: 'Internal error' };
  }
}

/**
 * Process a single email through the full pipeline.
 */
async function processEmail({ msg, accessToken, secrets, emailToLead, oferta, ghostStyl, existingDraftThreadIds, now, tenantConfig }) {
  const myEmail = tenantConfig?.email || MY_EMAIL;
  const telegramOpts = tenantConfig?.telegramChatId ? { chatId: tenantConfig.telegramChatId } : {};
  // Fetch full message details
  const detail = await gmailGetMessage(accessToken, msg.id, 'full');
  const senderEmail = extractEmail(detail.from);

  safeLog('[Process] Email', { id: msg.id, email: senderEmail, subject: detail.subject });

  // Helper to write audit record (best-effort, never throws)
  const audit = (params) => writeAuditRecord(params).catch(err => {
    console.error('[Process] Audit write failed:', (err.message || '').slice(0, 200));
  });

  // Skip own emails
  if (senderEmail === myEmail.toLowerCase()) {
    await markProcessed(msg.id, senderEmail, 'SKIPPED_OWN_EMAIL');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      action: 'SKIPPED_OWN_EMAIL', draftCreated: false,
    });
    return;
  }

  // --- A. DRAFT QUALITY GUARD: Check if already replied AFTER this email ---
  // Fetch thread messages early (also reused for draft generation later)
  const threadMessages = await getThreadMessages(accessToken, detail.threadId);
  const incomingTs = Number(detail.internalDate || 0);

  const repliedAfterIncoming = threadMessages.some(m => {
    const msgFrom = extractEmail(m.from);
    const msgTs = Number(m.internalDate || 0);
    return msgFrom === myEmail.toLowerCase() && msgTs > incomingTs;
  });

  if (repliedAfterIncoming) {
    safeLog('[Process] Already replied in thread after this email, skipping', { email: senderEmail });
    await sendTelegram(secrets,
      `Mail od ${maskEmail(senderEmail)}, ale juz odpowiedziano w watku. SKIP.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'SKIPPED_ALREADY_REPLIED');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      action: 'SKIPPED_ALREADY_REPLIED', draftCreated: false,
    });
    return;
  }

  // --- RACE CONDITION CHECK (Edge Case 1): Draft already exists in thread ---
  if (existingDraftThreadIds.has(detail.threadId)) {
    safeLog('[Process] Draft already exists in thread, skipping', { email: senderEmail, threadId: detail.threadId });
    await sendTelegram(secrets,
      `Draft juz istnieje w watku "${detail.subject}". SKIP.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'SKIPPED_EXISTING_DRAFT');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      action: 'SKIPPED_EXISTING_DRAFT', draftCreated: false,
    });
    return;
  }

  // --- FREQUENCY CAP (Edge Case 3): Spam loop prevention ---
  const freqCheck = await checkFrequencyCap(senderEmail);
  if (!freqCheck.allowed) {
    safeLog('[Process] Frequency cap hit', { email: senderEmail, reason: freqCheck.reason });
    await sendTelegram(secrets,
      `FREQUENCY CAP: ${maskEmail(senderEmail)} — ${freqCheck.reason}. Przejdz do Gmail lub @ceo.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'SKIPPED_FREQ_CAP');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      action: 'SKIPPED_FREQ_CAP', draftCreated: false,
    });
    return;
  }

  // --- BUDGET CHECK (per-email, in case batch approaches limit) ---
  const budgetMid = await checkBudgetCap();
  if (!budgetMid.allowed) {
    await sendTelegram(secrets,
      `BUDGET CAP osiagniety w trakcie batch (${budgetMid.callsToday}/${budgetMid.cap}). Reszta maili na jutro.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'SKIPPED_BUDGET_CAP');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      action: 'SKIPPED_BUDGET_CAP', draftCreated: false,
    });
    return;
  }

  // --- B. CONTEXT ---
  const lead = emailToLead[senderEmail] || null;
  // threadMessages already fetched in Draft Quality Guard (step A)

  // Track token usage across classify + draft calls
  let classifyTokens = null;
  let draftTokens = null;

  // --- C. CLASSIFICATION (Bedrock) ---
  let classification;
  try {
    classification = await classifyEmail(detail, lead, oferta, tenantConfig);
    classifyTokens = classification.usage || null;
    await incrementBudgetCounter(1);
  } catch (err) {
    console.error('[Process] Bedrock classify failed:', (err.message || '').slice(0, 200));
    await sendTelegram(secrets,
      `BEDROCK TIMEOUT: Nie udalo sie sklasyfikowac maila od ${maskEmail(senderEmail)}. Sprawdz recznie.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'ERROR_CLASSIFY');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      action: 'ERROR_CLASSIFY', draftCreated: false,
    });
    return;
  }

  safeLog('[Process] Classification', { email: senderEmail, type: classification.type, reason: classification.reason });

  if (classification.type === 'DECISION') {
    const alertMsg = [
      `WYMAGA DECYZJI: ${lead?.company || lead?.name || maskEmail(senderEmail)}`,
      `Temat: ${detail.subject}`,
      `Powod: ${classification.reason}`,
      `Snippet: ${(detail.snippet || '').slice(0, 200)}`,
      '',
      'Nie tworze draftu — przejdz do Gmail lub @ceo sesja.',
    ].join('\n');
    await sendTelegram(secrets, alertMsg, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'SKIPPED_DECISION');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      classification: { type: classification.type, reason: classification.reason },
      action: 'SKIPPED_DECISION', draftCreated: false,
      tokenUsage: { classifyTokens },
    });
    return;
  }

  // --- D. DRAFT GENERATION (Bedrock Claude Sonnet) ---
  let draftResult;
  const isEn = lead ? isForeignLead(lead, tenantConfig?.foreignTLDs) : false;

  try {
    draftResult = await generateDraft({
      ghostStyl,
      oferta,
      email: detail,
      thread: threadMessages,
      lead,
      isForeign: isEn,
      tenantConfig,
    });
    draftTokens = draftResult.usage || null;
    await incrementBudgetCounter(1);
  } catch (err) {
    console.error('[Process] Bedrock draft generation failed:', (err.message || '').slice(0, 200));
    await sendTelegram(secrets,
      `BEDROCK TIMEOUT: Nie udalo sie wygenerowac draftu dla ${lead?.company || maskEmail(senderEmail)}. Sprawdz recznie.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'ERROR_DRAFT_GEN');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      classification: { type: classification.type, reason: classification.reason },
      action: 'ERROR_DRAFT_GEN', draftCreated: false,
      tokenUsage: { classifyTokens },
    });
    return;
  }

  const draftBody = draftResult.text;

  // --- GUARDRAIL: Price validation ---
  const priceCheck = (tenantConfig?.guardrails?.priceValidation !== false)
    ? validatePricesInDraft(draftBody, oferta)
    : { valid: true };
  if (!priceCheck.valid) {
    await sendTelegram(secrets,
      `GUARDRAIL: Draft dla ${maskEmail(senderEmail)} zawieral bledna cene (${priceCheck.detail}). Draft NIE utworzony.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'SKIPPED_GUARDRAIL');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      classification: { type: classification.type, reason: classification.reason },
      guardrailResults: { priceCheck },
      action: 'SKIPPED_GUARDRAIL', draftCreated: false,
      tokenUsage: { classifyTokens, draftTokens },
    });
    return;
  }

  // --- GUARDRAIL: Commitment words check ---
  const commitCheck = validateNoCommitments(draftBody, tenantConfig?.guardrails);
  if (!commitCheck.valid) {
    await sendTelegram(secrets,
      `GUARDRAIL: Draft dla ${maskEmail(senderEmail)} zawieral zobowiazanie (${commitCheck.detail}). Draft NIE utworzony.`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'SKIPPED_GUARDRAIL');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      classification: { type: classification.type, reason: classification.reason },
      guardrailResults: { priceCheck, commitCheck },
      action: 'SKIPPED_GUARDRAIL', draftCreated: false,
      tokenUsage: { classifyTokens, draftTokens },
    });
    return;
  }

  // --- E. DELIVERY ---

  // Gmail: create draft as reply in thread
  const htmlBody = wrapEmailHTML(draftBody, isEn, tenantConfig);
  try {
    await gmailCreateDraft(
      accessToken,
      senderEmail,
      `Re: ${detail.subject}`,
      htmlBody,
      detail.threadId,
      { html: true }
    );
  } catch (err) {
    console.error('[Process] Gmail draft creation failed:', (err.message || '').slice(0, 200));
    await sendTelegram(secrets,
      `GMAIL ERROR: Nie udalo sie stworzyc draftu dla ${maskEmail(senderEmail)}: ${(err.message || '').slice(0, 200)}`, telegramOpts);
    await markProcessed(msg.id, senderEmail, 'ERROR_DRAFT_CREATE');
    await audit({
      messageId: msg.id, senderEmail, subject: detail.subject,
      classification: { type: classification.type, reason: classification.reason },
      guardrailResults: { priceCheck, commitCheck },
      action: 'ERROR_DRAFT_CREATE', draftCreated: false,
      tokenUsage: { classifyTokens, draftTokens },
    });
    return;
  }

  // Notion: update lead CRM (non-critical — draft is more important)
  if (lead) {
    try {
      const updateResult = await updateNotionLead(secrets.NOTION_API_KEY, lead, {
        lastContact: now.toISOString().slice(0, 10),
        due: addBusinessDays(now, 3).toISOString().slice(0, 10),
        note: `+ AWS auto-draft ${now.toISOString().slice(0, 10)} "${detail.subject}"`,
      });
      if (updateResult.skipped) {
        safeLog('[Process] Notion update skipped', { reason: updateResult.reason, email: senderEmail });
      }
    } catch (err) {
      console.error('[Process] Notion update failed:', (err.message || '').slice(0, 200));
      await sendTelegram(secrets,
        `NOTION DOWN: Draft utworzony, ale CRM nie zaktualizowany. Firma: ${lead.company || 'brak'}, Due: ${addBusinessDays(now, 3).toISOString().slice(0, 10)}. Zaktualizuj recznie.`, telegramOpts);
    }
  }

  // Update frequency counter
  await incrementFrequencyCounter(senderEmail);

  // Add the new draft's threadId to the set (prevent duplicate within same batch)
  existingDraftThreadIds.add(detail.threadId);

  // Telegram: confirmation
  await sendTelegram(secrets,
    `Draft gotowy: ${lead?.company || lead?.name || maskEmail(senderEmail)} — "${detail.subject}"`, telegramOpts);

  await markProcessed(msg.id, senderEmail, 'DRAFT_CREATED');

  // Audit: success path
  await audit({
    messageId: msg.id, senderEmail, subject: detail.subject,
    classification: { type: classification.type, reason: classification.reason },
    guardrailResults: { priceCheck, commitCheck },
    action: 'DRAFT_CREATED', draftCreated: true,
    tokenUsage: { classifyTokens, draftTokens },
  });

  safeLog('[Process] Draft created', { email: senderEmail, subject: detail.subject });
}
