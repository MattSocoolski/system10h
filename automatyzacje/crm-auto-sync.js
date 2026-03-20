#!/usr/bin/env node
// CRM AUTO-SYNC — Fix Gmail↔CRM mismatches automatically
// Runs as part of morning-chain.js (after morning-scan.js)
// Default: dry-run. Use --live to actually update CRM.
// Cron: via morning-chain.js (8:00 pn-pt)

import {
  loadEnv, sendTelegram, escapeHtml,
  queryCRM, parseNotionLead,
  today, formatDate, daysDiff,
  gmailGetAccessToken, gmailSearchMessages, gmailGetMessage,
  extractEmail,
  loadState, saveState,
  addBusinessDays, updateCRMLastContact, updateCRMDue, appendCRMNote,
  toLocalISO
} from './lib.js';

loadEnv();

// --- Config ---
const MAX_UPDATES = 10; // Safety cap per run
const MY_EMAIL = 'mateusz.sokolski@artnapi.pl';

const ACTIVE_STATUSES = [
  'Pierwszy kontakt',
  'Kwalifikacja potrzeby',
  'Wysłana próbka',
  'Dogrywanie',
  'Klient / Rozwoj (Account Management)'
];

// --- CLI args ---
const LIVE = process.argv.includes('--live');
const FORCE = process.argv.includes('--force');
const DRY_RUN = !LIVE;

// --- Guard: check if lead is paused/parking/frozen ---
function isLeadPaused(lead) {
  if (lead.status === 'Baza') return true;
  const notes = (lead.notes || '').toUpperCase();
  if (/PAUZA|PARKING|ZAMROŻONY|ZAMROZONY/.test(notes)) return true;
  return false;
}

// --- Main ---
async function run() {
  const now = today();
  const todayISO = toLocalISO(now);
  const mode = DRY_RUN ? 'DRY-RUN' : 'LIVE';

  console.log(`[CRM-SYNC] Started at ${new Date().toISOString()} — mode: ${mode}`);

  // --- Guard: prevent double-runs ---
  const state = loadState('crm-auto-sync') || { lastRun: null };
  if (!FORCE && state.lastRun === todayISO) {
    console.log(`[CRM-SYNC] Already ran today (${todayISO}). Use --force to override.`);
    return;
  }

  // --- 1. Gmail access token ---
  let accessToken;
  try {
    accessToken = await gmailGetAccessToken();
  } catch (err) {
    console.error(`[CRM-SYNC] Gmail OAuth failed: ${err.message}`);
    console.log('[CRM-SYNC] Aborting — cannot sync without Gmail data.');
    return;
  }

  // --- 2. Scan Gmail SENT (last 24h) ---
  let sentMessages = [];
  try {
    const sentResults = await gmailSearchMessages(
      accessToken,
      `from:${MY_EMAIL} newer_than:1d`,
      20
    );
    for (const m of sentResults) {
      const detail = await gmailGetMessage(accessToken, m.id);
      sentMessages.push(detail);
    }
    console.log(`[CRM-SYNC] Gmail SENT: ${sentMessages.length} messages`);
  } catch (err) {
    console.error(`[CRM-SYNC] Gmail SENT scan error: ${err.message}`);
  }

  // --- 3. Scan Gmail INBOX (last 24h) ---
  let inboxMessages = [];
  try {
    const inboxResults = await gmailSearchMessages(
      accessToken,
      `is:unread to:${MY_EMAIL} newer_than:1d`,
      20
    );
    for (const m of inboxResults) {
      const detail = await gmailGetMessage(accessToken, m.id);
      inboxMessages.push(detail);
    }
    console.log(`[CRM-SYNC] Gmail INBOX: ${inboxMessages.length} messages`);
  } catch (err) {
    console.error(`[CRM-SYNC] Gmail INBOX scan error: ${err.message}`);
  }

  // --- 4. Query CRM (active leads) ---
  const pages = await queryCRM();
  const allLeads = pages.map(parseNotionLead);
  console.log(`[CRM-SYNC] CRM: ${allLeads.length} total leads`);

  // Build email → lead map
  const crmEmailMap = new Map();
  for (const lead of allLeads) {
    if (lead.email) crmEmailMap.set(lead.email.toLowerCase(), lead);
  }

  // --- 5. Cross-check: find mismatches ---
  const mismatches = [];

  // 5a. SENT mismatches: we sent mail but CRM "ostatni kontakt" is stale
  for (const msg of sentMessages) {
    const toEmail = extractEmail(msg.to);
    const lead = crmEmailMap.get(toEmail);
    if (!lead) continue;
    if (!ACTIVE_STATUSES.includes(lead.status)) continue;
    if (isLeadPaused(lead)) continue;
    // Stale = last contact in CRM is >1 day old
    if (lead.lastContact && daysDiff(now, lead.lastContact) > 1) {
      mismatches.push({
        type: 'crm_stale_sent',
        lead,
        email: toEmail,
        detail: `Wysłano mail, CRM ostatni kontakt = ${formatDate(lead.lastContact)}`
      });
    } else if (!lead.lastContact) {
      mismatches.push({
        type: 'crm_stale_sent',
        lead,
        email: toEmail,
        detail: 'Wysłano mail, CRM ostatni kontakt = brak'
      });
    }
  }

  // 5b. INBOX mismatches: lead replied but CRM not updated
  for (const msg of inboxMessages) {
    const fromEmail = extractEmail(msg.from);
    const lead = crmEmailMap.get(fromEmail);
    if (!lead) continue;
    if (!ACTIVE_STATUSES.includes(lead.status)) continue;
    if (isLeadPaused(lead)) continue;
    // Avoid duplicate if already in mismatches from SENT
    if (mismatches.some(m => m.lead.id === lead.id)) continue;
    if (lead.lastContact && daysDiff(now, lead.lastContact) > 1) {
      mismatches.push({
        type: 'crm_stale_reply',
        lead,
        email: fromEmail,
        detail: `Lead odpowiedział, CRM ostatni kontakt = ${formatDate(lead.lastContact)}`
      });
    } else if (!lead.lastContact) {
      mismatches.push({
        type: 'crm_stale_reply',
        lead,
        email: fromEmail,
        detail: 'Lead odpowiedział, CRM ostatni kontakt = brak'
      });
    }
  }

  console.log(`[CRM-SYNC] Mismatches found: ${mismatches.length}`);

  if (mismatches.length === 0) {
    console.log('[CRM-SYNC] No mismatches — CRM is in sync.');
    state.lastRun = todayISO;
    saveState('crm-auto-sync', state);
    return;
  }

  // --- 6. Auto-fix mismatches (capped at MAX_UPDATES) ---
  const toFix = mismatches.slice(0, MAX_UPDATES);
  if (mismatches.length > MAX_UPDATES) {
    console.log(`[CRM-SYNC] Capped at ${MAX_UPDATES} updates (${mismatches.length} total mismatches)`);
  }

  const results = [];

  for (const m of toFix) {
    const leadName = m.lead.name || m.lead.company || m.email;
    const newDue = addBusinessDays(now, 3);
    const newDueISO = toLocalISO(newDue);

    if (m.type === 'crm_stale_sent') {
      console.log(`[CRM-SYNC] ${DRY_RUN ? 'WOULD FIX' : 'FIXING'}: ${leadName} — stale sent → Due=${newDueISO}, lastContact=${todayISO}`);

      if (!DRY_RUN) {
        try {
          await updateCRMLastContact(m.lead.id, todayISO);
          await updateCRMDue(m.lead.id, newDueISO);
          results.push({ name: leadName, type: m.type, status: 'OK', due: newDueISO });
        } catch (err) {
          console.error(`[CRM-SYNC] Error updating ${leadName}: ${err.message}`);
          results.push({ name: leadName, type: m.type, status: `FAIL: ${err.message.slice(0, 80)}` });
        }
      } else {
        results.push({ name: leadName, type: m.type, status: 'DRY-RUN', due: newDueISO });
      }
    } else if (m.type === 'crm_stale_reply') {
      const noteText = `Lead odpowiedział ${formatDate(now)} — sprawdź i odpowiedz`;
      console.log(`[CRM-SYNC] ${DRY_RUN ? 'WOULD FIX' : 'FIXING'}: ${leadName} — stale reply → lastContact=${todayISO}, note added`);

      if (!DRY_RUN) {
        try {
          await updateCRMLastContact(m.lead.id, todayISO);
          await appendCRMNote(m.lead.id, noteText, m.lead.notes);
          results.push({ name: leadName, type: m.type, status: 'OK' });
        } catch (err) {
          console.error(`[CRM-SYNC] Error updating ${leadName}: ${err.message}`);
          results.push({ name: leadName, type: m.type, status: `FAIL: ${err.message.slice(0, 80)}` });
        }
      } else {
        results.push({ name: leadName, type: m.type, status: 'DRY-RUN' });
      }
    }
  }

  // --- 7. Telegram summary ---
  const fixed = results.filter(r => r.status === 'OK').length;
  const failed = results.filter(r => r.status.startsWith('FAIL')).length;
  const dryCount = results.filter(r => r.status === 'DRY-RUN').length;

  const tg = [];
  tg.push(`<b>CRM SYNC ${formatDate(now)}</b> (${mode})`);
  tg.push('');

  if (DRY_RUN) {
    tg.push(`Znaleziono ${mismatches.length} mismatchów.`);
    tg.push(`Symulacja — ${dryCount} zmian do wykonania.`);
    tg.push('Uruchom z <code>--live</code> aby naprawić.');
  } else {
    tg.push(`Naprawiono: ${fixed} | Błędy: ${failed}`);
  }

  tg.push('');
  for (const r of results) {
    const icon = r.status === 'OK' ? '✅' : r.status === 'DRY-RUN' ? '🔍' : '❌';
    const typeLabel = r.type === 'crm_stale_sent' ? 'wysłano' : 'odpowiedź';
    const extra = r.due ? ` → Due ${r.due}` : '';
    tg.push(`${icon} ${escapeHtml(r.name)} (${typeLabel})${extra}`);
  }

  if (mismatches.length > MAX_UPDATES) {
    tg.push(`\n...i ${mismatches.length - MAX_UPDATES} więcej (limit ${MAX_UPDATES}/run)`);
  }

  await sendTelegram(tg.join('\n'));
  console.log('[CRM-SYNC] Telegram summary sent');

  // --- 8. Save state (only in live mode — dry-run must not modify state) ---
  if (!DRY_RUN) {
    state.lastRun = todayISO;
    state.lastResults = results;
    saveState('crm-auto-sync', state);
  }

  console.log(`[CRM-SYNC] Done — ${results.length} processed (${fixed} OK, ${failed} failed, ${dryCount} dry-run)`);
}

run().catch(err => {
  console.error(`[CRM-SYNC] FATAL: ${err.message}`);
  sendTelegram(`<b>CRM-SYNC ERROR</b>\n${escapeHtml(err.message)}`).catch(() => {});
  process.exit(1);
});
