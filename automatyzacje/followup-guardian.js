#!/usr/bin/env node
// #3 FOLLOW-UP GUARDIAN
// Skanuje pipeline pod kątem follow-upów → Telegram alert o 17:00
// Uruchomienie: node followup-guardian.js
// Cron: 0 17 * * 1-5 cd /Users/mateuszsokolski/asystent && node automatyzacje/followup-guardian.js

import { loadEnv, sendTelegram, readPlan, parseDueDates, today, formatDate, daysDiff } from './lib.js';

loadEnv();

async function run() {
  const now = today();

  // Parse both plans
  const artLeads = parseDueDates(readPlan('artnapi')).filter(l => !l.isPaused);
  const s10Leads = parseDueDates(readPlan('system10h')).filter(l => !l.isPaused);

  const allLeads = [
    ...artLeads.map(l => ({ ...l, biz: 'ART' })),
    ...s10Leads.map(l => ({ ...l, biz: '10H' }))
  ];

  // Categorize
  const tomorrow = allLeads.filter(l => {
    const diff = daysDiff(l.dueDate, now);
    return diff === 1;
  });

  const overdue3 = allLeads.filter(l => {
    const days = daysDiff(now, l.dueDate);
    return days >= 3 && days < 14;
  }).sort((a, b) => a.dueDate - b.dueDate);

  const overdue14 = allLeads.filter(l => {
    const days = daysDiff(now, l.dueDate);
    return days >= 14;
  }).sort((a, b) => a.dueDate - b.dueDate);

  // Skip if nothing to report
  if (tomorrow.length === 0 && overdue3.length === 0 && overdue14.length === 0) {
    console.log('[FU-GUARD] Nothing to report — all clean');
    return;
  }

  // Format message
  const sections = [];
  sections.push(`⚠️ <b>FOLLOW-UP GUARDIAN — ${formatDate(now)}</b>`);
  sections.push('');

  if (overdue14.length > 0) {
    sections.push('🔴 <b>BREAK-UP TRIGGER (>14 dni bez kontaktu):</b>');
    for (const l of overdue14.slice(0, 5)) {
      const days = daysDiff(now, l.dueDate);
      const val = l.value ? ` | ${l.value} PLN` : '';
      sections.push(`• [${l.biz}] <b>${l.name}</b> — ${days}d overdue${val}`);
      sections.push(`  → Decyzja: break-up mail lub kill?`);
    }
    if (overdue14.length > 5) sections.push(`  ...i ${overdue14.length - 5} więcej`);
    sections.push('');
  }

  if (overdue3.length > 0) {
    sections.push('🟡 <b>OVERDUE 3-14 DNI (follow-up TERAZ):</b>');
    for (const l of overdue3.slice(0, 8)) {
      const days = daysDiff(now, l.dueDate);
      const val = l.value ? ` | ${l.value} PLN` : '';
      sections.push(`• [${l.biz}] ${l.name} — ${days}d${val}`);
    }
    if (overdue3.length > 8) sections.push(`  ...i ${overdue3.length - 8} więcej`);
    sections.push('');
  }

  if (tomorrow.length > 0) {
    sections.push('📅 <b>JUTRO — PRZYGOTUJ:</b>');
    for (const l of tomorrow.slice(0, 5)) {
      const val = l.value ? ` (${l.value} PLN)` : '';
      sections.push(`• [${l.biz}] ${l.name}${val}`);
    }
    sections.push('');
  }

  // Summary
  const totalActive = allLeads.length;
  const totalOverdue = overdue3.length + overdue14.length;
  sections.push(`📊 Pipeline: ${totalActive} aktywnych | ${totalOverdue} wymaga akcji`);

  if (overdue14.length > 0) {
    sections.push('');
    sections.push(`💡 <i>${overdue14.length} lead(ów) >14d — profil.md: "Ghosting = rezygnacja". Wyślij break-up lub wstrzymaj.</i>`);
  }

  const message = sections.join('\n');
  await sendTelegram(message);
  console.log(`[FU-GUARD] Sent — ${tomorrow.length} tomorrow, ${overdue3.length} overdue 3-14d, ${overdue14.length} overdue >14d`);
}

run().catch(err => {
  console.error('[FU-GUARD] ERROR:', err.message);
  process.exit(1);
});
