#!/usr/bin/env node
// MORNING INTELLIGENCE SCAN
// Gmail (OAuth) + Notion CRM + cross-check → dane/artnapi/morning-feed.md
// Opcjonalnie: Telegram push (TELEGRAM_MORNING=true w .env)
// Schedule: pn-pt 8:00 + RunAtLoad (catch-up po boot/login)
// Uruchomienie reczne: node automatyzacje/morning-scan.js [--force]

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  loadEnv, sendTelegram,
  queryCRM, parseNotionLead,
  today, formatDate, daysDiff,
  gmailGetAccessToken, gmailSearchMessages, gmailGetMessage, gmailListDrafts,
  extractEmail, extractName
} from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FEED_PATH = join(ROOT, 'dane', 'artnapi', 'morning-feed.md');

loadEnv();

// --- GUARD: skip weekends + skip if today's feed already exists ---
const _now = new Date();
const dayOfWeek = _now.getDay(); // 0=Sun, 6=Sat
const forceRun = process.argv.includes('--force');

if (!forceRun && (dayOfWeek === 0 || dayOfWeek === 6)) {
  console.log(`[SCAN] Weekend (${dayOfWeek}) — skipping. Use --force to override.`);
  process.exit(0);
}

if (!forceRun && existsSync(FEED_PATH)) {
  const existing = readFileSync(FEED_PATH, 'utf-8');
  const todayISO = _now.toISOString().slice(0, 10);
  if (existing.startsWith(`# MORNING FEED ${todayISO}`)) {
    console.log(`[SCAN] Feed for ${todayISO} already exists — skipping. Use --force to override.`);
    process.exit(0);
  }
}

console.log(`[SCAN] Started at ${_now.toISOString()}`);

const ACTIVE_STATUSES = [
  'Pierwszy kontakt',
  'Kwalifikacja potrzeby',
  'Wysłana próbka',
  'Dogrywanie'
];

async function run() {
  const now = today();
  const todayStr = formatDate(now);
  const isoDate = now.toISOString().slice(0, 10);
  const dayNames = ['niedziela', 'poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota'];
  const dayName = dayNames[now.getDay()];

  // --- 1. GMAIL: get access token ---
  let accessToken;
  let gmailStatus = 'OK';
  try {
    accessToken = await gmailGetAccessToken();
  } catch (err) {
    console.error('[SCAN] Gmail OAuth failed:', err.message);
    accessToken = null;
    gmailStatus = 'NIEDOSTEPNY';
  }

  // --- 2. GMAIL INBOX SCAN (unread, last 24h) ---
  let inboxMessages = [];
  if (accessToken) {
    try {
      const inboxResults = await gmailSearchMessages(
        accessToken,
        'is:unread to:mateusz.sokolski@artnapi.pl newer_than:1d',
        20
      );
      for (const m of inboxResults) {
        const detail = await gmailGetMessage(accessToken, m.id);
        inboxMessages.push(detail);
      }
    } catch (err) {
      console.error('[SCAN] Gmail inbox error:', err.message);
    }
  }

  // --- 3. GMAIL SENT SCAN (last 24h) ---
  let sentMessages = [];
  if (accessToken) {
    try {
      const sentResults = await gmailSearchMessages(
        accessToken,
        'from:mateusz.sokolski@artnapi.pl newer_than:1d',
        20
      );
      for (const m of sentResults) {
        const detail = await gmailGetMessage(accessToken, m.id);
        sentMessages.push(detail);
      }
    } catch (err) {
      console.error('[SCAN] Gmail sent error:', err.message);
    }
  }

  // --- 4. GMAIL DRAFTS ---
  let drafts = [];
  if (accessToken) {
    try {
      drafts = await gmailListDrafts(accessToken, 10);
    } catch (err) {
      console.error('[SCAN] Gmail drafts error:', err.message);
    }
  }

  // --- 5. NOTION CRM SCAN ---
  const pages = await queryCRM();
  const allLeads = pages.map(parseNotionLead);
  const active = allLeads.filter(l => ACTIVE_STATUSES.includes(l.status));
  const am = allLeads.filter(l => l.status === 'Klient / Rozwoj (Account Management)');
  const won = allLeads.filter(l => l.status === 'Zamknieta - Wygrana');

  // Due date categories
  const withDue = active.filter(l => l.due);
  const overdue = withDue
    .filter(l => daysDiff(now, l.due) > 0)
    .sort((a, b) => a.due - b.due);
  const dueToday = withDue.filter(l => daysDiff(now, l.due) === 0);
  const dueTomorrow = withDue.filter(l => daysDiff(l.due, now) === 1);
  const noDue = active.filter(l => !l.due);
  const totalValue = active.reduce((sum, l) => sum + (l.value || 0), 0);
  const overdueValue = overdue.reduce((sum, l) => sum + (l.value || 0), 0);

  // Build CRM email->lead map for cross-check
  const crmEmailMap = new Map();
  for (const lead of allLeads) {
    if (lead.email) crmEmailMap.set(lead.email.toLowerCase(), lead);
  }

  // --- 6. CROSS-CHECK Gmail <-> CRM ---
  const mismatches = [];

  for (const msg of sentMessages) {
    const toEmail = extractEmail(msg.to);
    const lead = crmEmailMap.get(toEmail);
    if (!lead) continue;
    if (lead.lastContact && daysDiff(now, lead.lastContact) > 1) {
      mismatches.push({
        type: 'crm_stale_sent',
        lead: lead.name || lead.company,
        email: toEmail,
        detail: `Wyslano mail, ale CRM "ostatni kontakt" = ${formatDate(lead.lastContact)}`
      });
    }
  }

  for (const msg of inboxMessages) {
    const fromEmail = extractEmail(msg.from);
    const lead = crmEmailMap.get(fromEmail);
    if (!lead) continue;
    if (lead.lastContact && daysDiff(now, lead.lastContact) > 1) {
      mismatches.push({
        type: 'crm_stale_reply',
        lead: lead.name || lead.company,
        email: fromEmail,
        detail: `Lead odpowiedzial, ale CRM bez update`
      });
    }
  }

  const sentToEmails = new Set(sentMessages.map(m => extractEmail(m.to)));
  for (const draft of drafts) {
    const draftTo = extractEmail(draft.to || '');
    if (draftTo && sentToEmails.has(draftTo)) {
      mismatches.push({
        type: 'draft_redundant',
        lead: draftTo,
        email: draftTo,
        detail: `Draft istnieje, ale mail juz wyslany`
      });
    }
  }

  // --- 7. BUILD STRUCTURED MD FEED ---
  const md = [];

  md.push(`# MORNING FEED ${isoDate} (${dayName})`);
  md.push('');
  md.push(`> Wygenerowano: ${new Date().toISOString()}`);
  md.push(`> Gmail: ${gmailStatus} | CRM: ${allLeads.length} leadow | Aktywnych: ${active.length}`);
  md.push('');

  // --- INBOX ---
  md.push('## INBOX — nowe wiadomosci');
  md.push('');
  if (inboxMessages.length > 0) {
    md.push('| Od | Temat | CRM Lead? |');
    md.push('|----|-------|-----------|');
    for (const msg of inboxMessages) {
      const fromName = extractName(msg.from);
      const fromEmail = extractEmail(msg.from);
      const subject = truncate(msg.subject, 60);
      const crmLead = crmEmailMap.get(fromEmail);
      const crmTag = crmLead ? `TAK (${crmLead.status})` : 'NIE';
      md.push(`| ${fromName} | ${subject} | ${crmTag} |`);
    }
  } else {
    md.push(gmailStatus === 'OK' ? 'Brak nowych wiadomosci.' : 'Gmail niedostepny.');
  }
  md.push('');

  // --- SENT ---
  md.push('## SENT — wyslane (24h)');
  md.push('');
  if (sentMessages.length > 0) {
    md.push('| Do | Temat |');
    md.push('|----|-------|');
    for (const msg of sentMessages) {
      const toName = extractName(msg.to);
      const subject = truncate(msg.subject, 60);
      md.push(`| ${toName} | ${subject} |`);
    }
  } else {
    md.push(gmailStatus === 'OK' ? 'Brak wyslanych.' : 'Gmail niedostepny.');
  }
  md.push('');

  // --- DRAFTS ---
  md.push('## DRAFTY — czekaja w Gmail');
  md.push('');
  if (drafts.length > 0) {
    md.push('| Do | Temat |');
    md.push('|----|-------|');
    for (const d of drafts) {
      const to = d.to ? extractName(d.to) : '?';
      const subject = truncate(d.subject || '(bez tematu)', 60);
      md.push(`| ${to} | ${subject} |`);
    }
  } else {
    md.push(gmailStatus === 'OK' ? 'Brak draftow.' : 'Gmail niedostepny.');
  }
  md.push('');

  // --- MISMATCHES ---
  if (mismatches.length > 0) {
    md.push('## MISMATCHE — Gmail vs CRM');
    md.push('');
    md.push('| Lead | Problem | Akcja |');
    md.push('|------|---------|-------|');
    for (const m of mismatches) {
      const action = m.type === 'crm_stale_sent' ? 'Zaktualizuj CRM (Due + ostatni kontakt)'
        : m.type === 'crm_stale_reply' ? 'Zaktualizuj CRM + odpowiedz'
        : 'Usun draft lub sprawdz';
      md.push(`| ${m.lead} | ${m.detail} | ${action} |`);
    }
    md.push('');
  }

  // --- OVERDUE ---
  md.push('## OVERDUE — zaleglosci');
  md.push('');
  if (overdue.length > 0) {
    md.push(`Razem: ${overdue.length} leadow, ~${overdueValue.toLocaleString('pl-PL')} PLN zagrozone`);
    md.push('');
    md.push('| Lead | Firma | Dni po terminie | Wartosc | Status | Ostatni kontakt | Email |');
    md.push('|------|-------|-----------------|---------|--------|-----------------|-------|');
    for (const l of overdue) {
      const days = daysDiff(now, l.due);
      const val = l.value ? `${l.value.toLocaleString('pl-PL')} PLN` : '-';
      const lastC = l.lastContact ? formatDate(l.lastContact) : '-';
      const email = l.email || '-';
      md.push(`| ${l.name || '-'} | ${l.company || '-'} | ${days} | ${val} | ${l.status} | ${lastC} | ${email} |`);
    }
  } else {
    md.push('Brak zaleglosci.');
  }
  md.push('');

  // --- DUE TODAY ---
  md.push('## NA DZIS — follow-up wymagany');
  md.push('');
  if (dueToday.length > 0) {
    md.push('| Lead | Firma | Wartosc | Status | Email |');
    md.push('|------|-------|---------|--------|-------|');
    for (const l of dueToday) {
      const val = l.value ? `${l.value.toLocaleString('pl-PL')} PLN` : '-';
      const email = l.email || '-';
      md.push(`| ${l.name || '-'} | ${l.company || '-'} | ${val} | ${l.status} | ${email} |`);
    }
  } else {
    md.push('Brak leadow na dzis.');
  }
  md.push('');

  // --- DUE TOMORROW ---
  if (dueTomorrow.length > 0) {
    md.push('## JUTRO — przygotuj');
    md.push('');
    md.push('| Lead | Firma | Wartosc | Status |');
    md.push('|------|-------|---------|--------|');
    for (const l of dueTomorrow) {
      const val = l.value ? `${l.value.toLocaleString('pl-PL')} PLN` : '-';
      md.push(`| ${l.name || '-'} | ${l.company || '-'} | ${val} | ${l.status} |`);
    }
    md.push('');
  }

  // --- NO DUE DATE ---
  if (noDue.length > 0) {
    md.push('## BEZ TERMINU — wymagaja ustawienia Due');
    md.push('');
    md.push('| Lead | Firma | Wartosc | Status |');
    md.push('|------|-------|---------|--------|');
    for (const l of noDue) {
      const val = l.value ? `${l.value.toLocaleString('pl-PL')} PLN` : '-';
      md.push(`| ${l.name || '-'} | ${l.company || '-'} | ${val} | ${l.status} |`);
    }
    md.push('');
  }

  // --- PIPELINE SNAPSHOT ---
  md.push('## PIPELINE SNAPSHOT');
  md.push('');
  md.push(`| Metryka | Wartosc |`);
  md.push(`|---------|---------|`);
  md.push(`| Aktywnych leadow | ${active.length} |`);
  md.push(`| Wartosc pipeline | ~${totalValue.toLocaleString('pl-PL')} PLN |`);
  md.push(`| Overdue | ${overdue.length} (~${overdueValue.toLocaleString('pl-PL')} PLN) |`);
  md.push(`| Na dzis | ${dueToday.length} |`);
  md.push(`| Na jutro | ${dueTomorrow.length} |`);
  md.push(`| Bez terminu | ${noDue.length} |`);
  md.push(`| Klienci AM | ${am.length} |`);
  md.push(`| Wygrane | ${won.length} |`);
  md.push('');

  // --- REKOMENDACJE DLA @CEO ---
  md.push('## REKOMENDACJE');
  md.push('');
  const recs = [];

  if (inboxMessages.length > 0) {
    const crmInbox = inboxMessages.filter(m => crmEmailMap.has(extractEmail(m.from)));
    if (crmInbox.length > 0) {
      recs.push(`PILNE: ${crmInbox.length} odpowiedzi od leadow CRM — @ghost napisz odpowiedzi`);
    }
    const nonCrmInbox = inboxMessages.length - crmInbox.length;
    if (nonCrmInbox > 0) {
      recs.push(`INFO: ${nonCrmInbox} maili spoza CRM — sprawdz czy nowy lead`);
    }
  }

  if (mismatches.length > 0) {
    recs.push(`WAZNE: ${mismatches.length} mismatchow Gmail vs CRM — zaktualizuj CRM`);
  }

  if (overdue.length > 0) {
    const critical = overdue.filter(l => daysDiff(now, l.due) >= 14);
    const standard = overdue.filter(l => { const d = daysDiff(now, l.due); return d >= 3 && d < 14; });
    if (critical.length > 0) {
      recs.push(`KRYTYCZNE: ${critical.length} leadow >14 dni — @ghost napisz break-up mail albo zamroz`);
    }
    if (standard.length > 0) {
      recs.push(`WAZNE: ${standard.length} leadow 3-14 dni overdue — @ghost napisz follow-up`);
    }
  }

  if (dueToday.length > 0) {
    recs.push(`DZIS: ${dueToday.length} follow-upow do wyslania — @ghost przygotuj drafty`);
  }

  if (drafts.length > 0) {
    recs.push(`DRAFTY: ${drafts.length} draftow w Gmail — sprawdz i wyslij`);
  }

  if (noDue.length > 0) {
    recs.push(`PORZADKI: ${noDue.length} leadow bez Due date — ustaw terminy w CRM`);
  }

  if (now.getDay() === 1) {
    recs.push('PONIEDZIALEK: CRM Sync audit + plan tygodnia (@coo)');
  }
  if (now.getDay() === 5) {
    recs.push('PIATEK: Pipeline Pulse + metryki tygodnia (@coo)');
  }

  if (recs.length > 0) {
    for (const r of recs) {
      md.push(`- ${r}`);
    }
  } else {
    md.push('Brak pilnych rekomendacji — pipeline czysty.');
  }
  md.push('');

  // --- SUGESTIE: niewykorzystane możliwości systemu (max 5) ---
  const suggestions = [];
  const dow = now.getDay(); // 1=Mon ... 5=Fri

  // 1. Poniedziałek: @recon targets
  if (dow === 1) {
    suggestions.push('PON: @recon moze wygenerowac 10 targetow z Google Maps/BIP. Wpisz "@recon [segment]"');
  }

  // 2. Content: brak postów LinkedIn (mid-week reminder)
  if (dow === 3 || dow === 5) {
    suggestions.push('CONTENT: Masz @content + carousel-generator. 1 post/tydz na LinkedIn = inbound leady. Wpisz "@content"');
  }

  // 3. Pipeline scoring: piątek
  if (dow === 5) {
    suggestions.push('SCORING: @pipeline moze policzyc Pipeline Velocity i BANT scoring. Wpisz "@pipeline"');
  }

  // 4. Batch outreach: leads w CRM bez outreachu
  const noContact = active.filter(l => !l.lastContact);
  if (noContact.length > 3) {
    suggestions.push(`BATCH: ${noContact.length} leadow w CRM BEZ kontaktu. @ghost moze przygotowac batch maili w 5 min`);
  }

  // 5. Restock: AM klienci (poniedziałek info)
  if (dow === 1 && am.length > 0) {
    suggestions.push(`RESTOCK: restock-reminder.js sprawdzi ${am.length} klientow AM o 9:00. Drafty w Gmail.`);
  }

  // 6. Overdue cleanup
  const criticalOverdue = overdue.filter(l => daysDiff(now, l.due) >= 14);
  if (criticalOverdue.length > 3) {
    suggestions.push(`CZYSTKA: ${criticalOverdue.length} leadow >14 dni overdue. Zamroz lub breakup — nie pompuj pipeline`);
  }

  if (suggestions.length > 0) {
    md.push('## SUGESTIE — niewykorzystane mozliwosci');
    md.push('');
    for (const s of suggestions.slice(0, 5)) {
      md.push(`- ${s}`);
    }
    md.push('');
  }

  // --- WRITE FEED FILE ---
  const feedContent = md.join('\n');
  writeFileSync(FEED_PATH, feedContent, 'utf-8');
  console.log(`[SCAN] Feed written: ${FEED_PATH}`);

  // --- OPTIONAL TELEGRAM ---
  if (process.env.TELEGRAM_MORNING === 'true') {
    const tg = buildTelegramSummary({
      todayStr, dayName, inboxMessages, sentMessages, drafts,
      mismatches, overdue, dueToday, active, am, won,
      totalValue, crmEmailMap, accessToken
    });
    await sendTelegram(tg);
    console.log('[SCAN] Telegram sent');
  }

  console.log(`[SCAN] Done — inbox:${inboxMessages.length} sent:${sentMessages.length} drafts:${drafts.length} mismatches:${mismatches.length} overdue:${overdue.length} today:${dueToday.length} active:${active.length}`);
}

function buildTelegramSummary(data) {
  const { todayStr, dayName, inboxMessages, sentMessages, drafts,
    mismatches, overdue, dueToday, active, am, won,
    totalValue, crmEmailMap, accessToken } = data;

  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const s = [];
  s.push(`<b>MORNING SCAN ${todayStr} (${dayName})</b>`);

  if (inboxMessages.length > 0) {
    s.push('');
    s.push(`<b>INBOX (${inboxMessages.length}):</b>`);
    for (const msg of inboxMessages.slice(0, 5)) {
      const fromName = esc(extractName(msg.from));
      const subject = esc(truncate(msg.subject, 40));
      s.push(`${fromName} — "${subject}"`);
    }
    if (inboxMessages.length > 5) s.push(`...i ${inboxMessages.length - 5} wiecej`);
  }

  if (overdue.length > 0) {
    s.push('');
    s.push(`<b>OVERDUE: ${overdue.length}</b> | Na dzis: ${dueToday.length}`);
  }

  if (mismatches.length > 0) {
    s.push(`<b>Mismatche: ${mismatches.length}</b>`);
  }

  s.push('');
  s.push(`Pipeline: ${active.length} aktywnych | ~${totalValue.toLocaleString('pl-PL')} PLN`);
  s.push(`AM: ${am.length} | Wygrane: ${won.length}`);
  s.push('');
  s.push('Pelny feed: dane/artnapi/morning-feed.md');

  if (!accessToken) {
    s.push('\nGmail niedostepny');
  }

  return s.join('\n');
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

async function runWithRetry() {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 30000; // 30s — give network time to stabilize after wake

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await run();
      return; // success
    } catch (err) {
      const isNetworkError = err.message === 'fetch failed' || err.message.includes('ENOTFOUND');
      if (isNetworkError && attempt < MAX_RETRIES) {
        console.log(`[SCAN] Network error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        continue;
      }
      console.error('[SCAN] ERROR:', err.message);
      process.exit(1);
    }
  }
}

runWithRetry();
