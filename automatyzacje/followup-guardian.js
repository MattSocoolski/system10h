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
  gmailGetAccessToken, gmailCreateDraft, gmailListDrafts, gmailSearchMessages, extractEmail,
  loadState, saveState, escapeHtml,
  isForeignLead, wrapEmailHTML
} from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

loadEnv();

// --- Config ---
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
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
const INCLUDE_DUE_TODAY = process.argv.includes('--include-due-today');

// --- Guard: check if lead is paused/parking/frozen (Bug 2 fix) ---
function isLeadPaused(lead) {
  if (lead.status === 'Baza') return true;
  const notes = (lead.notes || '').toUpperCase();
  if (/PAUZA|PARKING|ZAMROŻONY|ZAMROZONY/.test(notes)) return true;
  return false;
}

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

FORMAT: Write in HTML. Use <p> for paragraphs, <strong> for emphasis, <ul><li> for lists. Do NOT add <html>/<body> tags — only the inner content. Do NOT include a signature — it will be added automatically.

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
• VALUE ADD: Link the price calculator: "I've set up a price calculator for your country: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html" — use <a href="..."> tag
• NEVER invent details about the lead — write based on data only
• Closing: proactive, offer next step
• Do NOT add a signature at the end — it is appended automatically
• Write ONLY the email body in HTML (no To:/Subject: headers, no signature)`;

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

FORMAT: Pisz w HTML. Używaj <p> dla akapitów, <strong> dla pogrubień, <ul><li> dla list. NIE dodawaj tagów <html>/<body> — tylko wewnętrzną treść. NIE dodawaj stopki/podpisu — zostanie dodana automatycznie.

STYL MATEUSZA (OBOWIĄZKOWY):
${ghostB2B}

PRZYKŁADY JAK MATEUSZ PISZE (NAŚLADUJ):
Przykład 1 (FU do leada PL):
"Dzień dobry! Pisałem kilka dni temu ws. podobrazi 40x50 na warsztaty. Przygotowałem interaktywny kalkulator cen — zerknijcie, ile wychodzi na Wasze potrzeby: [link]. Mamy 8 000 szt na stanie, wysyłka 24h. Daj znać czy temat żyje."

Przykład 2 (FU wartościowy):
"Dzień dobry! Wracam do tematu podobrazi. Przy 120 szt cena to 10,31 zł netto all-in z dostawą. Przy 320 szt spada do 9,00. Mogę przygotować wycenę od ręki — wystarczy znać ilość i rozmiar."

OFERTA (source of truth — TYLKO te ceny):
${ofertaCondensed}

ZASADY (ŻELAZNE):
• Max 3-5 zdań — krótko, konkretnie
• ZAWSZE pisz w 1. osobie: "Przygotowałem", "Mogę" — NIGDY "zdecydowaliśmy", "przygotowaliśmy", "jesteśmy"
• Ton: bezpośredni, ciepły, Good Cop — NIGDY corpo-mowa
• KONKRET: podaj cenę, ilość na stanie, link do kalkulatora — nie pisz ogólników
• VALUE ADD: kalkulator cen: "Zerknij na kalkulator: https://artnapi.pl/B2B-Price-Calculator-cabout-pol-31.html" — użyj <a href="...">
• ZAKAZ: "Chciałem wrócić do naszej rozmowy", "Czy temat jest wciąż aktualny?", "Zdecydowaliśmy się", "Pozwolę sobie"
• Zamknięcie: proaktywne ("Mogę przygotować wycenę od ręki", "Daj znać")
• NIE wymyślaj historii — pisz na podstawie danych
• NIE dodawaj stopki/podpisu — jest automatyczna
• Pisz TYLKO treść maila w HTML (bez nagłówków, bez podpisu)`;

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
  const active = allLeads.filter(l => {
    if (!ACTIVE_STATUSES.includes(l.status) || !l.due) return false;
    if (isLeadPaused(l)) {
      console.log(`[FU-GUARD v2] Skipping ${l.name || l.company} — paused/parking`);
      return false;
    }
    return true;
  });

  // Categorize by urgency
  const tomorrow = active.filter(l => daysDiff(l.due, now) === 1);

  const overdue3 = active
    .filter(l => { const d = daysDiff(now, l.due); return d >= 3 && d < 14; })
    .sort((a, b) => a.due - b.due);

  const overdue14 = active
    .filter(l => daysDiff(now, l.due) >= 14)
    .sort((a, b) => a.due - b.due);

  // Leads due today or 1-2 days overdue (only when triggered from morning chain)
  const dueToday = INCLUDE_DUE_TODAY ? active
    .filter(l => { const d = daysDiff(now, l.due); return d >= 0 && d < 3; })
    .sort((a, b) => a.due - b.due) : [];

  if (tomorrow.length === 0 && overdue3.length === 0 && overdue14.length === 0 && dueToday.length === 0) {
    console.log('[FU-GUARD v2] Nothing to report — all clean');
    return;
  }

  // --- AUTO-DRAFT: shared context for all draft generation ---
  let draftsCreated = 0;
  const draftResults = [];

  // Determine which lead pools need drafts
  const overdue3Candidates = (!ALERT_ONLY && overdue3.length > 0)
    ? overdue3.filter(l => l.email && !state.draftedRecent[l.id] && l.tag !== 'PAUSED')
    : [];

  const dueTodayCandidates = (!ALERT_ONLY && dueToday.length > 0)
    ? dueToday.filter(l => l.email && !state.draftedRecent[l.id] && l.tag !== 'PAUSED')
    : [];

  const totalCandidates = overdue3Candidates.length + dueTodayCandidates.length;

  // Load shared context once if any drafts to generate
  let ghostB2B = '', ghostB2BEN = '', ofertaCondensed = '';
  let accessToken;
  let existingDraftEmails = new Set();

  if (totalCandidates > 0) {
    console.log(`[FU-GUARD v2] ${totalCandidates} draft candidates (${overdue3Candidates.length} overdue, ${dueTodayCandidates.length} due-today)`);

    // Load context files (once)
    const ghostStyl = readFileSync(join(ROOT, 'dane', 'ghost_styl.md'), 'utf-8');
    const b2bMatch = ghostStyl.match(/## B2B SPRZEDAŻ[\s\S]*?(?=\n## B2B ENGLISH|\n## WSPÓLNE|$)/);
    ghostB2B = b2bMatch ? b2bMatch[0] : '';
    const b2bENMatch = ghostStyl.match(/## B2B ENGLISH[\s\S]*?(?=\n## WSPÓLNE|$)/);
    ghostB2BEN = b2bENMatch ? b2bENMatch[0] : '';

    const oferta = readFileSync(join(ROOT, 'dane', 'artnapi', 'oferta.md'), 'utf-8');
    ofertaCondensed = oferta.slice(0, 2500);

    if (!DRY_RUN) {
      accessToken = await gmailGetAccessToken();
    }

    // Bug 1 fix: fetch existing Gmail drafts and build set of recipient emails
    if (!DRY_RUN && accessToken) {
      try {
        const existingDrafts = await gmailListDrafts(accessToken, 50);
        for (const draft of existingDrafts) {
          if (draft.to) {
            existingDraftEmails.add(extractEmail(draft.to));
          }
        }
        console.log(`[FU-GUARD v2] Found ${existingDraftEmails.size} existing draft recipients in Gmail`);
      } catch (err) {
        console.error(`[FU-GUARD v2] Warning: could not list Gmail drafts: ${err.message}`);
      }
    }
  }

  // SENT check helper: returns true if we emailed this address in last 7 days
  async function wasSentRecently(email) {
    if (DRY_RUN || !accessToken) return false;
    try {
      const results = await gmailSearchMessages(accessToken, `from:${MY_EMAIL} to:${email} newer_than:7d`, 1);
      return results.length > 0;
    } catch (err) {
      console.error(`[FU-GUARD v2] Warning: SENT check failed for ${email}: ${err.message}`);
      return false; // fail-open: don't block on API error
    }
  }

  // Draft generation helper (shared by overdue3 and dueToday)
  async function generateDraft(lead, category) {
    if (existingDraftEmails.has(lead.email.toLowerCase())) {
      console.log(`[FU-GUARD v2] Draft already exists for ${lead.email}, skipping (${category})`);
      return;
    }

    if (await wasSentRecently(lead.email)) {
      console.log(`[FU-GUARD v2] Already sent to ${lead.email} in last 7d, skipping (${category})`);
      return;
    }

    const daysOver = daysDiff(now, lead.due);
    const { systemPrompt, userPrompt } = buildFollowUpPrompt(lead, daysOver, ghostB2B, ghostB2BEN, ofertaCondensed);

    try {
      const draftBodyRaw = await callClaude(systemPrompt, userPrompt);
      const isEN = isForeignLead(lead);
      const draftBody = wrapEmailHTML(draftBodyRaw, isEN);
      const subject = generateSubject(lead);

      if (DRY_RUN) {
        console.log(`[DRY-RUN] Would create draft for ${lead.name} (${lead.email}) [${category}]:`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body: ${draftBodyRaw.slice(0, 100)}...`);
      } else {
        await gmailCreateDraft(accessToken, lead.email, subject, draftBody, null, { html: true });
        console.log(`[FU-GUARD v2] Draft created (HTML, ${category}): ${lead.name} (${lead.email})`);
      }

      draftsCreated++;
      // Only persist to state in live mode — dry-run must not pollute state
      if (!DRY_RUN) {
        state.draftedRecent[lead.id] = todayStr;
      }

      draftResults.push({
        name: lead.name || lead.company,
        email: lead.email,
        days: daysOver,
        value: lead.value,
        status: 'OK',
        category
      });
    } catch (err) {
      console.error(`[FU-GUARD v2] Draft error for ${lead.name} (${category}): ${err.message}`);
      draftResults.push({
        name: lead.name || lead.company,
        email: lead.email,
        days: daysOver,
        value: lead.value,
        status: `FAIL: ${err.message.slice(0, 60)}`,
        category
      });
    }
  }

  // --- AUTO-DRAFT: Process overdue 3-14d leads ---
  for (const lead of overdue3Candidates.slice(0, MAX_DRAFTS_PER_RUN)) {
    await generateDraft(lead, 'overdue');
  }

  // --- AUTO-DRAFT: Process due-today / 0-2 days overdue (morning chain mode) ---
  if (dueTodayCandidates.length > 0) {
    const remainingCap = MAX_DRAFTS_PER_RUN - draftsCreated;
    for (const lead of dueTodayCandidates.slice(0, remainingCap)) {
      await generateDraft(lead, 'due-today');
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

  // Due today / 0-2 days overdue without drafts (morning chain mode)
  if (dueToday.length > 0) {
    const dueTodayNoDraft = dueToday.filter(l =>
      !draftResults.some(r => r.name === (l.name || l.company))
    );
    if (dueTodayNoDraft.length > 0) {
      s.push('');
      s.push('<b>NA DZIS (0-2 dni, bez draftu):</b>');
      for (const l of dueTodayNoDraft.slice(0, 8)) {
        const days = daysDiff(now, l.due);
        const val = l.value ? `, ${l.value} PLN` : '';
        const reason = !l.email ? ' (brak email)' : l.tag === 'PAUSED' ? ' (PAUSED)' : '';
        s.push(`  ${escapeHtml(l.name || l.company)} — ${days} dni${val}${reason}`);
      }
      if (dueTodayNoDraft.length > 8) s.push(`  ...i ${dueTodayNoDraft.length - 8} wiecej`);
    }
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
  const totalActionable = totalOverdue + dueToday.length;
  s.push(`\nPipeline: ${active.length} aktywnych, ${totalActionable} wymaga akcji`);
  if (draftsCreated > 0) s.push(`${draftsCreated} draftow w Gmail — sprawdz i wyslij`);

  if (overdue14.length > 0) {
    s.push(`${overdue14.length} leadow >14 dni — wyslij break-up albo wstrzymaj`);
  }

  await sendTelegram(s.join('\n'));
  console.log(`[FU-GUARD v2] Sent — ${tomorrow.length} tomorrow, ${overdue3.length} overdue 3-14d (${draftsCreated} drafts), ${overdue14.length} overdue >14d, ${dueToday.length} due-today`);

  // Save state (only in live mode — dry-run must not modify state)
  if (!DRY_RUN) {
    state.lastRun = now.toISOString();
    saveState('followup-guardian', state);
  }
}

run().catch(err => {
  console.error('[FU-GUARD v2] ERROR:', err.message);
  sendTelegram(`<b>FU-GUARD ERROR</b>\n${escapeHtml(err.message)}`).catch(() => {});
  process.exit(1);
});
