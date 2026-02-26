#!/usr/bin/env node
// FOLLOW-UP GUARDIAN (Notion CRM edition)
// Źródło: Notion CRM (API 2025-09-03)
// Skanuje pipeline pod kątem follow-upów → Telegram alert o 17:00
// Cron: 0 17 * * 1-5

import { loadEnv, sendTelegram, queryCRM, parseNotionLead, today, formatDate, daysDiff } from './lib.js';

loadEnv();

const ACTIVE_STATUSES = [
  'Pierwszy kontakt',
  'Kwalifikacja potrzeby',
  'Wysłana próbka',
  'Dogrywanie'
];

async function run() {
  const now = today();

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
    console.log('[FU-GUARD] Nothing to report — all clean');
    return;
  }

  const s = [];
  s.push(`<b>FOLLOW-UP ${formatDate(now)}</b>`);

  if (overdue14.length > 0) {
    s.push('');
    s.push('<b>WAZNE — ponad 14 dni bez kontaktu:</b>');
    for (const l of overdue14.slice(0, 5)) {
      const days = daysDiff(now, l.due);
      const val = l.value ? `, ${l.value} PLN` : '';
      const lastC = l.lastContact ? `, ost. ${formatDate(l.lastContact)}` : '';
      s.push(`  <b>${l.name || l.company}</b> — ${days} dni${val}${lastC}`);
      s.push(`  Decyzja: break-up mail albo wstrzymaj`);
    }
    if (overdue14.length > 5) s.push(`  ...i ${overdue14.length - 5} wiecej`);
  }

  if (overdue3.length > 0) {
    s.push('');
    s.push('<b>ZALEGLE 3-14 DNI — follow-up teraz:</b>');
    for (const l of overdue3.slice(0, 8)) {
      const days = daysDiff(now, l.due);
      const val = l.value ? `, ${l.value} PLN` : '';
      s.push(`  ${l.name || l.company} — ${days} dni${val}`);
    }
    if (overdue3.length > 8) s.push(`  ...i ${overdue3.length - 8} wiecej`);
  }

  if (tomorrow.length > 0) {
    s.push('');
    s.push('<b>JUTRO — przygotuj:</b>');
    for (const l of tomorrow.slice(0, 5)) {
      const val = l.value ? ` (${l.value} PLN)` : '';
      s.push(`  ${l.name || l.company}${val}`);
    }
  }

  const totalOverdue = overdue3.length + overdue14.length;
  s.push(`\nPipeline: ${active.length} aktywnych, ${totalOverdue} wymaga akcji`);

  if (overdue14.length > 0) {
    s.push(`${overdue14.length} leadow >14 dni — wyslij break-up albo wstrzymaj`);
  }

  await sendTelegram(s.join('\n'));
  console.log(`[FU-GUARD] Sent — ${tomorrow.length} tomorrow, ${overdue3.length} overdue 3-14d, ${overdue14.length} overdue >14d`);
}

run().catch(err => {
  console.error('[FU-GUARD] ERROR:', err.message);
  process.exit(1);
});
