#!/usr/bin/env node
// FOLLOW-UP GUARDIAN v2 — Auto-Draft Mode (Notion CRM edition)
// Źródło: Notion CRM (API 2025-09-03)
// Skanuje pipeline pod kątem follow-upów → Claude Haiku generuje drafty → Gmail + Telegram
// Cron: 0 17 * * 1-5
//
// Tryby:
//   node followup-guardian.js              → auto-draft mode (domyślny)
//   node followup-guardian.js --alert-only → tylko Telegram alert (stary tryb)
//   node followup-guardian.js --dry-run    → symulacja (loguje, nie tworzy draftów)

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadEnv, sendTelegram, queryCRM, parseNotionLead, today, formatDate, daysDiff,
  gmailGetAccessToken, gmailCreateDraft, loadState, saveState, escapeHtml,
  isForeignLead
} from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

loadEnv();

// --- Config ---
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const MAX_DRAFTS_PER_RUN = 5; // Safety cap — max 5 drafts per run
const MY_EMAIL = 'mateusz.sokolski@artnapi.pl';

const ACTIVE_STATUSES = [
  'Pierwszy kontakt',
  'Kwalifikacja potrzeby',
  'Wysłana próbka',
  'Dogrywanie'
];

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

// --- Build follow-up prompt (EN — for foreign leads) ---
function buildFollowUpPromptEN(lead, daysOverdue, ghostB2BEN, ofertaCondensed) {
  const systemPrompt = `You are the ghostwriter of Mateusz Sokolski, key account manager at artnapi.pl.
You are writing a follow-up to a lead who hasn't responded to previous contact.

IMPORTANT: Write the ENTIRE email in English. Do NOT use any Polish.

STYLE:
${ghostB2BEN}

PRODUCT OFFER (summary):
${ofertaCondensed}

FOLLOW-UP RULES:
• Max 3-5 sentences — short, not pushy
• Tone: warm, direct, Good Cop — NEVER pressure
• Approach: add value or ask a question, don't rush
• If 3-7 days: gentle reminder ("I wanted to follow up on our conversation")
• If 8-14 days: value + question ("I've prepared something for you / is this still on your radar?")
• VALUE ADD: Link the price calculator: "I've set up a price calculator for your country: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html"
• NEVER invent details about the lead — write based on data only
• Closing: proactive, offer next step
• End with: Best regards,\n\nMateusz Sokolski\nkey account manager at artnapi.pl\nmail: mateusz.sokolski@artnapi.pl\nphone: +48 534 852 707\nB2B price calculator: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html
• Write ONLY the email body (no To:/Subject: headers)`;

  const leadContext = [
    `Name: ${lead.name || 'unknown'}`,
    `Company: ${lead.company || 'unknown'}`,
    `CRM Status: ${lead.status}`,
    `Segment: ${lead.segment || 'unknown'}`,
    `Country: ${lead.country || 'unknown'}`,
    `Value: ${lead.value ? lead.value + ' PLN' : 'unknown'}`,
    `Priority: ${lead.priority || 'unknown'}`,
    lead.lastContact ? `Last contact: ${lead.lastContact.toISOString().split('T')[0]}` : 'Last contact: no data',
    `Notes: ${lead.notes || 'none'}`,
    `Contact person: ${lead.contact || 'unknown'}`,
    `Tag: ${lead.tag || 'none'}`
  ].join('\n');

  const userPrompt = `Write a follow-up email to this lead. It's been ${daysOverdue} days since the follow-up was due.

LEAD:
${leadContext}

Write a short, warm follow-up in Mateusz's style. Don't invent stories — write based on data only. Write entirely in English.`;

  return { systemPrompt, userPrompt };
}

// --- Build follow-up prompt (PL) ---
function buildFollowUpPrompt(lead, daysOverdue, ghostB2B, ghostB2BEN, ofertaCondensed) {
  if (isForeignLead(lead)) {
    return buildFollowUpPromptEN(lead, daysOverdue, ghostB2BEN, ofertaCondensed);
  }
  const systemPrompt = `Jesteś ghostwriterem Mateusza Sokólskiego, key account managera w artnapi.pl.
Piszesz follow-up do leada który nie odpowiedział na poprzedni kontakt.

STYL:
${ghostB2B}

OFERTA (skrót):
${ofertaCondensed}

ZASADY FOLLOW-UP:
• Max 3-5 zdań — krótko, nie nachalnie
• Ton: ciepły, bezpośredni, Good Cop — NIGDY nie ciśnij
• Podejście: daj wartość lub zadaj pytanie, nie ponaglaj
• Jeśli 3-7 dni: delikatny przypominacz ("chciałem wrócić do naszej rozmowy")
• Jeśli 8-14 dni: wartość + pytanie ("przygotowałem dla Was / czy temat jest aktualny?")
• VALUE ADD: Jeśli lead nie zna cen → podlinkuj kalkulator: "Przygotowaliśmy interaktywny kalkulator cen: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html"
• Jeśli lead CEE → pisz po angielsku, link: "I've prepared a price calculator for your country: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html"
• NIGDY nie wymyślaj szczegółów z życia leada — pisz na podstawie danych
• Zamknięcie: proaktywne, oferuj następny krok
• Kończ: Pozdrawiam serdecznie,\n\nSokólski Mateusz\nkey account manager w artnapi.pl\nmail: mateusz.sokolski@artnapi.pl\ntelefon: +48 534 852 707\nkalkulator B2B: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html
• Pisz TYLKO treść maila (bez nagłówków To:/Subject:)`;

  const leadContext = [
    `Nazwa: ${lead.name || 'brak'}`,
    `Firma: ${lead.company || 'brak'}`,
    `Status CRM: ${lead.status}`,
    `Segment: ${lead.segment || 'brak'}`,
    `Kraj: ${lead.country || 'PL'}`,
    `Wartość: ${lead.value ? lead.value + ' PLN' : 'nieznana'}`,
    `Priorytet: ${lead.priority || 'brak'}`,
    lead.lastContact ? `Ostatni kontakt: ${lead.lastContact.toISOString().split('T')[0]}` : 'Ostatni kontakt: brak danych',
    `Notatki: ${lead.notes || 'brak'}`,
    `Osoba: ${lead.contact || 'brak'}`,
    `Tag: ${lead.tag || 'brak'}`
  ].join('\n');

  const userPrompt = `Napisz follow-up do tego leada. Minęło ${daysOverdue} dni od terminu follow-up.

LEAD:
${leadContext}

Napisz krótki, ciepły follow-up w stylu Mateusza. Nie wymyślaj historii — pisz na podstawie danych.`;

  return { systemPrompt, userPrompt };
}

// --- Generate subject line ---
function generateSubject(lead) {
  const name = lead.company || lead.name || (isForeignLead(lead) ? 'contact' : 'kontakt');
  return `Follow-up — ${name}`;
}

// --- Main ---
async function run() {
  const now = today();
  const todayStr = formatDate(now);
  const mode = ALERT_ONLY ? 'ALERT' : DRY_RUN ? 'DRY-RUN' : 'AUTO-DRAFT';

  console.log(`[FU-GUARD v2] Started at ${new Date().toISOString()} — mode: ${mode}`);

  // Load state (track drafted leads — 7-day memory to prevent duplicate drafts)
  const state = loadState('followup-guardian') || { lastRun: null, draftedRecent: {}, draftedToday: [] };

  // Migrate old format (draftedToday array → draftedRecent map with expiry)
  if (!state.draftedRecent) state.draftedRecent = {};

  // Clean entries older than 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  for (const [id, date] of Object.entries(state.draftedRecent)) {
    if (date < sevenDaysAgo) delete state.draftedRecent[id];
  }

  const pages = await queryCRM();
  const allLeads = pages.map(parseNotionLead);
  const active = allLeads.filter(l => ACTIVE_STATUSES.includes(l.status) && l.due);

  // Categorize by urgency
  const tomorrow = active.filter(l => daysDiff(l.due, now) === 1);

  const overdue3 = active
    .filter(l => { const d = daysDiff(now, l.due); return d >= 3 && d < 14; })
    .sort((a, b) => a.due - b.due);

  const overdue14 = active
    .filter(l => daysDiff(now, l.due) >= 14)
    .sort((a, b) => a.due - b.due);

  if (tomorrow.length === 0 && overdue3.length === 0 && overdue14.length === 0) {
    console.log('[FU-GUARD v2] Nothing to report — all clean');
    return;
  }

  // --- AUTO-DRAFT: Generate follow-up emails for overdue 3-14d leads ---
  let draftsCreated = 0;
  const draftResults = [];

  if (!ALERT_ONLY && overdue3.length > 0) {
    // Filter: only leads with email, not drafted in last 7 days, not PAUSED tag
    const draftCandidates = overdue3.filter(l =>
      l.email &&
      !state.draftedRecent[l.id] &&
      l.tag !== 'PAUSED'
    ).slice(0, MAX_DRAFTS_PER_RUN);

    if (draftCandidates.length > 0) {
      console.log(`[FU-GUARD v2] Generating drafts for ${draftCandidates.length} leads...`);

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

      for (const lead of draftCandidates) {
        const daysOver = daysDiff(now, lead.due);
        const { systemPrompt, userPrompt } = buildFollowUpPrompt(lead, daysOver, ghostB2B, ghostB2BEN, ofertaCondensed);

        try {
          const draftBody = await callClaude(systemPrompt, userPrompt);
          const subject = generateSubject(lead);

          if (DRY_RUN) {
            console.log(`[DRY-RUN] Would create draft for ${lead.name} (${lead.email}):`);
            console.log(`  Subject: ${subject}`);
            console.log(`  Body: ${draftBody.slice(0, 100)}...`);
          } else {
            await gmailCreateDraft(accessToken, lead.email, subject, draftBody);
            console.log(`[FU-GUARD v2] Draft created: ${lead.name} (${lead.email})`);
          }

          draftsCreated++;
          state.draftedRecent[lead.id] = todayStr;

          draftResults.push({
            name: lead.name || lead.company,
            email: lead.email,
            days: daysOver,
            value: lead.value,
            status: 'OK'
          });
        } catch (err) {
          console.error(`[FU-GUARD v2] Draft error for ${lead.name}: ${err.message}`);
          draftResults.push({
            name: lead.name || lead.company,
            email: lead.email,
            days: daysOver,
            value: lead.value,
            status: `FAIL: ${err.message.slice(0, 60)}`
          });
        }
      }
    }
  }

  // --- Build Telegram message ---
  const s = [];
  s.push(`<b>FOLLOW-UP ${todayStr}</b>${!ALERT_ONLY ? ' (auto-draft)' : ''}`);

  // Draft results
  if (draftResults.length > 0) {
    s.push('');
    s.push(`<b>DRAFTY (${draftsCreated} ${DRY_RUN ? 'symulacja' : 'w Gmail'}):</b>`);
    for (const r of draftResults) {
      const val = r.value ? `, ${r.value} PLN` : '';
      const icon = r.status === 'OK' ? '✉️' : '⚠️';
      s.push(`  ${icon} ${escapeHtml(r.name)} — ${r.days} dni${val}`);
      if (r.status !== 'OK') s.push(`  ${escapeHtml(r.status)}`);
    }
  }

  if (overdue14.length > 0) {
    s.push('');
    s.push('<b>WAZNE — ponad 14 dni bez kontaktu:</b>');
    for (const l of overdue14.slice(0, 5)) {
      const days = daysDiff(now, l.due);
      const val = l.value ? `, ${l.value} PLN` : '';
      const lastC = l.lastContact ? `, ost. ${formatDate(l.lastContact)}` : '';
      s.push(`  <b>${escapeHtml(l.name || l.company)}</b> — ${days} dni${val}${lastC}`);
      s.push(`  Decyzja: break-up mail albo wstrzymaj`);
    }
    if (overdue14.length > 5) s.push(`  ...i ${overdue14.length - 5} wiecej`);
  }

  // Overdue 3-14 without drafts (no email or already drafted)
  const overdue3NoDraft = overdue3.filter(l =>
    !draftResults.some(r => r.name === (l.name || l.company))
  );

  if (overdue3NoDraft.length > 0) {
    s.push('');
    s.push('<b>ZALEGLE 3-14 DNI (bez draftu):</b>');
    for (const l of overdue3NoDraft.slice(0, 8)) {
      const days = daysDiff(now, l.due);
      const val = l.value ? `, ${l.value} PLN` : '';
      const reason = !l.email ? ' (brak email)' : l.tag === 'PAUSED' ? ' (PAUSED)' : '';
      s.push(`  ${escapeHtml(l.name || l.company)} — ${days} dni${val}${reason}`);
    }
    if (overdue3NoDraft.length > 8) s.push(`  ...i ${overdue3NoDraft.length - 8} wiecej`);
  }

  if (tomorrow.length > 0) {
    s.push('');
    s.push('<b>JUTRO — przygotuj:</b>');
    for (const l of tomorrow.slice(0, 5)) {
      const val = l.value ? ` (${l.value} PLN)` : '';
      s.push(`  ${escapeHtml(l.name || l.company)}${val}`);
    }
  }

  const totalOverdue = overdue3.length + overdue14.length;
  s.push(`\nPipeline: ${active.length} aktywnych, ${totalOverdue} wymaga akcji`);
  if (draftsCreated > 0) s.push(`${draftsCreated} draftow w Gmail — sprawdz i wyslij`);

  if (overdue14.length > 0) {
    s.push(`${overdue14.length} leadow >14 dni — wyslij break-up albo wstrzymaj`);
  }

  await sendTelegram(s.join('\n'));
  console.log(`[FU-GUARD v2] Sent — ${tomorrow.length} tomorrow, ${overdue3.length} overdue 3-14d (${draftsCreated} drafts), ${overdue14.length} overdue >14d`);

  // Save state
  state.lastRun = now.toISOString();
  saveState('followup-guardian', state);
}

run().catch(err => {
  console.error('[FU-GUARD v2] ERROR:', err.message);
  sendTelegram(`<b>FU-GUARD ERROR</b>\n${escapeHtml(err.message)}`).catch(() => {});
  process.exit(1);
});
