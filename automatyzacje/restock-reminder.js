#!/usr/bin/env node
// RESTOCK REMINDER v1 — Auto-Draft Mode (Notion CRM edition)
// Cel: Przypomina klientom AM/REPEAT o uzupełnieniu zapasów
// Źródło: Notion CRM (API 2025-09-03) — klienci ze statusem Klient/AM + tag REPEAT
// Logika: ostatni_kontakt + cykl_dni < today → generuj draft restock reminder
// Cron: 0 9 * * 1 (poniedziałki 9:00)
//
// Tryby:
//   node restock-reminder.js              → auto-draft mode (domyślny)
//   node restock-reminder.js --alert-only → tylko Telegram alert (bez draftów)
//   node restock-reminder.js --dry-run    → symulacja (loguje, nie tworzy draftów)

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadEnv, sendTelegram, queryCRM, parseNotionLead, today, formatDate, daysDiff,
  gmailGetAccessToken, gmailCreateDraft, loadState, saveState, escapeHtml,
  isForeignLead, wrapEmailHTML
} from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

loadEnv();

// --- Config ---
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const MAX_DRAFTS_PER_RUN = 5; // Safety cap — max 5 drafts per run
const MY_EMAIL = 'mateusz.sokolski@artnapi.pl';

const AM_STATUSES = ['Klient/AM', 'Zamknięta-Wygrana'];

// --- CLI args ---
const ALERT_ONLY = process.argv.includes('--alert-only');
const DRY_RUN = process.argv.includes('--dry-run');

// --- Claude API ---
async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// --- Parse extra CRM fields not in parseNotionLead ---
function parseRestockFields(page) {
  const p = page.properties;
  const getNumber = (prop) => prop?.number ?? null;
  return {
    cyklDni: getNumber(p['cykl_dni'])
  };
}

// --- Build restock prompt (EN — for foreign leads) ---
function buildRestockPromptEN(lead, daysOverdue, cyklDni, ghostB2BEN, ofertaCondensed) {
  const systemPrompt = `You are the ghostwriter of Mateusz Sokolski, key account manager at artnapi.pl.
You are writing a restock reminder to an EXISTING client who has already purchased.

IMPORTANT: Write the ENTIRE email in English. Do NOT use any Polish.

FORMAT: Write in HTML. Use <p> for paragraphs, <strong> for emphasis, <ul><li> for lists. Do NOT add <html>/<body> tags — only the inner content. Do NOT include a signature — it will be added automatically.

STYLE:
${ghostB2BEN}

PRODUCT OFFER (summary):
${ofertaCondensed}

RESTOCK REMINDER RULES:
• This is NOT a sales follow-up — it's a warm message to an existing client
• Max 3-5 sentences — short, warm, proactive
• Tone: "checking on your stock", "time to reorder?", "warehouse is full, ready to ship"
• NEVER be pushy — this is a happy client, nurture the relationship
• Approach: caring key account manager, not a salesperson
• Link the B2B calculator using <a href="...">: "Current pricing and calculator: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html"
• NEVER invent details about the client — write based on data only
• Closing: proactive, suggest a concrete next step (e.g. prepare an offer, send samples of new products)
• Do NOT add a signature at the end — it is appended automatically
• Write ONLY the email body in HTML (no To:/Subject: headers, no signature)`;

  const leadContext = [
    `Name: ${lead.name || 'unknown'}`,
    `Company: ${lead.company || 'unknown'}`,
    `Contact person: ${lead.contact || 'unknown'}`,
    `Country: ${lead.country || 'unknown'}`,
    `Segment: ${lead.segment || 'unknown'}`,
    `Order cycle: every ${cyklDni} days`,
    lead.lastContact ? `Last contact: ${lead.lastContact.toISOString().split('T')[0]}` : 'Last contact: no data',
    `Days since last contact: ${daysOverdue}`,
    `Notes: ${lead.notes || 'none'}`
  ].join('\n');

  const userPrompt = `Write a short restock reminder to this client.
It's been ${daysOverdue} days since last contact (order cycle: every ${cyklDni} days).

CLIENT:
${leadContext}

Write a warm, caring restock reminder in Mateusz's style. Don't invent stories — write based on data only. Write entirely in English.`;

  return { systemPrompt, userPrompt };
}

// --- Build restock reminder prompt (PL) ---
function buildRestockPrompt(lead, daysOverdue, cyklDni, ghostB2B, ghostB2BEN, ofertaCondensed) {
  if (isForeignLead(lead)) {
    return buildRestockPromptEN(lead, daysOverdue, cyklDni, ghostB2BEN, ofertaCondensed);
  }
  const systemPrompt = `Jesteś ghostwriterem Mateusza Sokólskiego, key account managera w artnapi.pl.
Piszesz przypomnienie o uzupełnieniu zapasów do ISTNIEJĄCEGO klienta który już kupił.

FORMAT: Pisz w HTML. Używaj <p> dla akapitów, <strong> dla pogrubień, <ul><li> dla list. NIE dodawaj tagów <html>/<body> — tylko wewnętrzną treść. NIE dodawaj stopki/podpisu — zostanie dodana automatycznie.

STYL:
${ghostB2B}

OFERTA (skrót):
${ofertaCondensed}

ZASADY RESTOCK REMINDER:
• To NIE jest follow-up sprzedażowy — to ciepła wiadomość do obecnego klienta
• Max 3-5 zdań — krótko, serdecznie, proaktywnie
• Ton: "sprawdzam jak z zapasem", "czas na uzupełnienie?", "magazyn pełny, wysyłka od ręki"
• NIGDY nie bądź nachalny — to jest happy client, dbamy o relację
• Podejście: opiekuńczy key account manager, nie handlowiec
• Podlinkuj kalkulator B2B używając tagu <a href="...">: "Aktualny cennik i kalkulator: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html"
• Jeśli lead CEE (kraj != PL) → pisz po angielsku
• NIGDY nie wymyślaj szczegółów z życia klienta — pisz na podstawie danych
• Zamknięcie: proaktywne, zaproponuj konkretny następny krok (np. przygotowanie oferty, wysyłka próbek nowych produktów)
• NIE dodawaj stopki/podpisu na końcu — jest dodawana automatycznie
• Pisz TYLKO treść maila w HTML (bez nagłówków To:/Subject:, bez podpisu)`;

  const leadContext = [
    `Nazwa: ${lead.name || 'brak'}`,
    `Firma: ${lead.company || 'brak'}`,
    `Osoba kontaktowa: ${lead.contact || 'brak'}`,
    `Kraj: ${lead.country || 'PL'}`,
    `Segment: ${lead.segment || 'brak'}`,
    `Cykl zamówieniowy: co ${cyklDni} dni`,
    lead.lastContact ? `Ostatni kontakt: ${lead.lastContact.toISOString().split('T')[0]}` : 'Ostatni kontakt: brak danych',
    `Dni od ostatniego kontaktu: ${daysOverdue}`,
    `Notatki: ${lead.notes || 'brak'}`
  ].join('\n');

  const userPrompt = `Napisz krótkie przypomnienie o uzupełnieniu zapasów do tego klienta.
Minęło ${daysOverdue} dni od ostatniego kontaktu (cykl zamówieniowy: co ${cyklDni} dni).

KLIENT:
${leadContext}

Napisz ciepły, opiekuńczy restock reminder w stylu Mateusza. Nie wymyślaj historii — pisz na podstawie danych.`;

  return { systemPrompt, userPrompt };
}

// --- Generate subject line ---
function generateSubject(lead) {
  const name = lead.company || lead.name || (isForeignLead(lead) ? 'contact' : 'kontakt');
  if (isForeignLead(lead)) {
    return `Restock reminder — ${name}`;
  }
  return `Uzupełnienie zapasów — ${name}`;
}

// --- Main ---
async function run() {
  const now = today();
  const todayStr = formatDate(now);
  const mode = ALERT_ONLY ? 'ALERT' : DRY_RUN ? 'DRY-RUN' : 'AUTO-DRAFT';

  console.log(`[RESTOCK v1] Started at ${new Date().toISOString()} — mode: ${mode}`);

  // Load state (track drafted leads to prevent duplicates)
  const state = loadState('restock-reminder') || { lastRun: null, draftedThisWeek: [], draftedWeek: null };

  // Reset weekly counter if new week (ISO week number)
  const weekKey = getISOWeek(now);
  if (state.draftedWeek !== weekKey) {
    state.draftedThisWeek = [];
    state.draftedWeek = weekKey;
  }

  // Fetch all CRM leads
  const pages = await queryCRM();

  // Parse leads + extra restock fields, filter for AM clients with REPEAT tag
  const restockCandidates = [];
  for (const page of pages) {
    const lead = parseNotionLead(page);
    const { cyklDni } = parseRestockFields(page);

    // Filter: AM status + REPEAT tag + has cykl_dni + has lastContact + has email
    if (!AM_STATUSES.includes(lead.status)) continue;
    if (lead.tag !== 'REPEAT') continue;
    if (!cyklDni || cyklDni <= 0) continue;
    if (!lead.lastContact) continue;
    if (!lead.email) continue;

    // Check if overdue: lastContact + cyklDni < today
    const nextRestockDate = new Date(lead.lastContact);
    nextRestockDate.setDate(nextRestockDate.getDate() + cyklDni);

    if (nextRestockDate >= now) continue; // Not yet due

    const daysOverdue = daysDiff(now, nextRestockDate);

    restockCandidates.push({ lead, cyklDni, daysOverdue, nextRestockDate });
  }

  // Sort by most overdue first
  restockCandidates.sort((a, b) => b.daysOverdue - a.daysOverdue);

  console.log(`[RESTOCK v1] Found ${restockCandidates.length} overdue restock clients`);

  if (restockCandidates.length === 0) {
    console.log('[RESTOCK v1] Nothing to report — all clients stocked up');
    return;
  }

  // --- AUTO-DRAFT: Generate restock reminders ---
  let draftsCreated = 0;
  const draftResults = [];

  if (!ALERT_ONLY) {
    // Filter: not already drafted this week
    const draftEligible = restockCandidates
      .filter(c => !state.draftedThisWeek.includes(c.lead.id))
      .slice(0, MAX_DRAFTS_PER_RUN);

    if (draftEligible.length > 0) {
      console.log(`[RESTOCK v1] Generating drafts for ${draftEligible.length} clients...`);

      // Load context files (once)
      const ghostStyl = readFileSync(join(ROOT, 'dane', 'ghost_styl.md'), 'utf-8');
      const b2bMatch = ghostStyl.match(/## B2B SPRZEDAŻ[\s\S]*?(?=\n## B2B ENGLISH|\n## WSPÓLNE|$)/);
      const ghostB2B = b2bMatch ? b2bMatch[0] : '';
      const b2bENMatch = ghostStyl.match(/## B2B ENGLISH[\s\S]*?(?=\n## WSPÓLNE|$)/);
      const ghostB2BEN = b2bENMatch ? b2bENMatch[0] : '';

      const oferta = readFileSync(join(ROOT, 'dane', 'artnapi', 'oferta.md'), 'utf-8');
      const ofertaCondensed = oferta.slice(0, 2500);

      let accessToken;
      if (!DRY_RUN) {
        accessToken = await gmailGetAccessToken();
      }

      for (const { lead, cyklDni, daysOverdue } of draftEligible) {
        const { systemPrompt, userPrompt } = buildRestockPrompt(lead, daysOverdue, cyklDni, ghostB2B, ghostB2BEN, ofertaCondensed);

        try {
          const draftBodyRaw = await callClaude(systemPrompt, userPrompt);
          const isEN = isForeignLead(lead);
          const draftBody = wrapEmailHTML(draftBodyRaw, isEN);
          const subject = generateSubject(lead);

          if (DRY_RUN) {
            console.log(`[DRY-RUN] Would create draft for ${lead.name || lead.company} (${lead.email}):`);
            console.log(`  Subject: ${subject}`);
            console.log(`  Cykl: co ${cyklDni} dni, overdue ${daysOverdue} dni`);
            console.log(`  Body: ${draftBodyRaw.slice(0, 100)}...`);
          } else {
            await gmailCreateDraft(accessToken, lead.email, subject, draftBody, null, { html: true });
            console.log(`[RESTOCK v1] Draft created (HTML): ${lead.name || lead.company} (${lead.email})`);
          }

          draftsCreated++;
          state.draftedThisWeek.push(lead.id);

          draftResults.push({
            name: lead.name || lead.company,
            email: lead.email,
            cyklDni,
            daysOverdue,
            status: 'OK'
          });
        } catch (err) {
          console.error(`[RESTOCK v1] Draft error for ${lead.name || lead.company}: ${err.message}`);
          draftResults.push({
            name: lead.name || lead.company,
            email: lead.email,
            cyklDni,
            daysOverdue,
            status: `FAIL: ${err.message.slice(0, 60)}`
          });
        }
      }
    }
  }

  // --- Build Telegram message ---
  const s = [];
  s.push(`<b>RESTOCK REMINDER ${todayStr}</b>${!ALERT_ONLY ? ' (auto-draft)' : ''}`);

  // Draft results
  if (draftResults.length > 0) {
    s.push('');
    s.push(`<b>DRAFTY (${draftsCreated} ${DRY_RUN ? 'symulacja' : 'w Gmail'}):</b>`);
    for (const r of draftResults) {
      const icon = r.status === 'OK' ? '✉️' : '⚠️';
      s.push(`  ${icon} ${escapeHtml(r.name)} — cykl ${r.cyklDni}d, overdue ${r.daysOverdue}d`);
      if (r.status !== 'OK') s.push(`  ${escapeHtml(r.status)}`);
    }
  }

  // All overdue (including those without drafts — already drafted this week or over cap)
  const noDraft = restockCandidates.filter(c =>
    !draftResults.some(r => r.name === (c.lead.name || c.lead.company))
  );

  if (noDraft.length > 0) {
    s.push('');
    s.push('<b>OVERDUE BEZ DRAFTU (juz drafted lub limit):</b>');
    for (const { lead, cyklDni, daysOverdue } of noDraft.slice(0, 8)) {
      const reason = state.draftedThisWeek.includes(lead.id) ? ' (drafted)' : ' (limit)';
      s.push(`  ${escapeHtml(lead.name || lead.company)} — cykl ${cyklDni}d, overdue ${daysOverdue}d${reason}`);
    }
    if (noDraft.length > 8) s.push(`  ...i ${noDraft.length - 8} wiecej`);
  }

  s.push(`\nKlienci AM/REPEAT: ${restockCandidates.length} overdue`);
  if (draftsCreated > 0) s.push(`${draftsCreated} draftow w Gmail — sprawdz i wyslij`);

  await sendTelegram(s.join('\n'));
  console.log(`[RESTOCK v1] Sent — ${restockCandidates.length} overdue, ${draftsCreated} drafts created`);

  // Save state
  state.lastRun = now.toISOString();
  saveState('restock-reminder', state);
}

// --- Helpers ---
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

run().catch(err => {
  console.error('[RESTOCK v1] ERROR:', err.message);
  sendTelegram(`<b>RESTOCK REMINDER ERROR</b>\n${escapeHtml(err.message)}`).catch(() => {});
  process.exit(1);
});
