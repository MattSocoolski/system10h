#!/usr/bin/env node
// UNIFIED MORNING DIGEST (Opcja 1+3)
// Źródło: Notion CRM (API 2025-09-03) + plan.md (System 10H fallback)
// Wysyła jeden skonsolidowany brief na Telegram o 9:30
// Cron: 30 9 * * 1-5

import { loadEnv, sendTelegram, queryCRM, parseNotionLead, readPlan, parseDueDates, today, formatDate, daysDiff } from './lib.js';

loadEnv();

const ACTIVE_STATUSES = [
  'Pierwszy kontakt',
  'Kwalifikacja potrzeby',
  'Wysłana próbka',
  'Dogrywanie'
];

async function run() {
  console.log(`[DIGEST] Started at ${new Date().toISOString()}`);
  const now = today();
  const todayStr = formatDate(now);
  const dayNames = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
  const dayName = dayNames[now.getDay()];

  // --- NOTION CRM (ARTNAPI) ---
  const pages = await queryCRM();
  const allLeads = pages.map(parseNotionLead);

  const active = allLeads.filter(l => ACTIVE_STATUSES.includes(l.status));
  const am = allLeads.filter(l => l.status === 'Klient / Rozwój (Account Management)');
  const won = allLeads.filter(l => l.status === 'Zamknięta - Wygrana');

  // Due date categories (active pipeline only)
  const withDue = active.filter(l => l.due);
  const overdue = withDue
    .filter(l => daysDiff(now, l.due) > 0)
    .sort((a, b) => a.due - b.due);
  const dueToday = withDue.filter(l => daysDiff(now, l.due) === 0);
  const dueTomorrow = withDue.filter(l => daysDiff(l.due, now) === 1);
  const noDue = active.filter(l => !l.due);

  // Pipeline value
  const totalValue = active.reduce((sum, l) => sum + (l.value || 0), 0);

  // Country breakdown
  const countries = {};
  for (const l of active) {
    const c = l.country || '?';
    countries[c] = (countries[c] || 0) + 1;
  }

  // --- SYSTEM 10H (plan.md fallback — brak Notion CRM) ---
  const s10Plan = readPlan('system10h');
  const s10Leads = parseDueDates(s10Plan).filter(l => !l.isPaused);
  const s10Overdue = s10Leads.filter(l => daysDiff(now, l.dueDate) > 0);
  const s10Today = s10Leads.filter(l => daysDiff(now, l.dueDate) === 0);

  // --- FORMAT ---
  const s = [];
  s.push(`<b>BRIEF ${todayStr} (${dayName})</b>`);

  // OVERDUE
  if (overdue.length > 0 || s10Overdue.length > 0) {
    s.push('');
    s.push('<b>ZALEGFE:</b>');
    for (const l of overdue.slice(0, 8)) {
      const days = daysDiff(now, l.due);
      const val = l.value ? ` — ${l.value} PLN` : '';
      s.push(`  ${l.name || l.company}, ${days} dni${val}`);
    }
    if (overdue.length > 8) s.push(`  ...i ${overdue.length - 8} wiecej`);
    for (const l of s10Overdue.slice(0, 3)) {
      const days = daysDiff(now, l.dueDate);
      s.push(`  [10H] ${l.name}, ${days} dni`);
    }
  }

  // TODAY
  if (dueToday.length > 0 || s10Today.length > 0) {
    s.push('');
    s.push('<b>NA DZIS:</b>');
    for (const l of dueToday) {
      const val = l.value ? ` — ${l.value} PLN` : '';
      s.push(`  ${l.name || l.company}${val}`);
    }
    for (const l of s10Today) {
      s.push(`  [10H] ${l.name}`);
    }
  }

  // TOMORROW
  if (dueTomorrow.length > 0) {
    s.push('');
    s.push('<b>JUTRO:</b>');
    for (const l of dueTomorrow.slice(0, 5)) {
      const val = l.value ? ` — ${l.value} PLN` : '';
      s.push(`  ${l.name || l.company}${val}`);
    }
  }

  // HOT LEADS
  const hot = active.filter(l => l.priority?.includes('Gorący'));
  if (hot.length > 0) {
    s.push('');
    s.push('<b>GORACE LEADY:</b>');
    for (const l of hot.slice(0, 5)) {
      const val = l.value ? ` — ${l.value} PLN` : '';
      const lastC = l.lastContact ? `, ost. kontakt ${formatDate(l.lastContact)}` : '';
      s.push(`  ${l.name || l.company}${val}${lastC}`);
    }
  }

  // PIPELINE SNAPSHOT
  s.push('');
  s.push(`<b>PIPELINE:</b> ${active.length} aktywnych, ~${totalValue.toLocaleString('pl-PL')} PLN`);
  s.push(`Klienci AM: ${am.length} | Wygrane: ${won.length}`);
  const countryLine = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}:${n}`)
    .join(' ');
  if (countryLine) s.push(countryLine);
  if (s10Leads.length > 0) s.push(`10H: ${s10Leads.length} aktywnych`);

  // WARNINGS
  if (noDue.length > 0) s.push(`\n${noDue.length} leadow bez due date`);
  if (overdue.length > 5) s.push(`${overdue.length} zalegych — rozwaz czystke`);

  // DAY TIPS
  if (now.getDay() === 1) s.push('\nPoniedzialek — CRM Sync + plan tygodnia');
  if (now.getDay() === 5) s.push('\nPiatek — Pipeline Pulse + metryki');

  await sendTelegram(s.join('\n'));
  console.log(`[DIGEST] Sent — ${overdue.length} overdue, ${dueToday.length} today, ${dueTomorrow.length} tomorrow, ${active.length} active`);
}

run().catch(err => {
  console.error('[DIGEST] ERROR:', err.message);
  process.exit(1);
});
