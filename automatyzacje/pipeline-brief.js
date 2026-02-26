#!/usr/bin/env node
// #2 PORANNY PIPELINE BRIEF
// Czyta plan.md obu biznesów → formatuje brief → Telegram push
// Uruchomienie: node pipeline-brief.js
// Cron: 30 9 * * 1-5 cd /Users/mateuszsokolski/asystent && node automatyzacje/pipeline-brief.js

import { loadEnv, sendTelegram, readPlan, parseDueDates, today, formatDate, daysDiff } from './lib.js';

loadEnv();

async function run() {
  const now = today();
  const todayStr = formatDate(now);
  const dayNames = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
  const dayName = dayNames[now.getDay()];

  // --- ARTNAPI ---
  const artPlan = readPlan('artnapi');
  const artLeads = parseDueDates(artPlan);
  const artActive = artLeads.filter(l => !l.isPaused);

  const artOverdue = artActive.filter(l => daysDiff(now, l.dueDate) > 0);
  const artToday = artActive.filter(l => {
    const diff = daysDiff(now, l.dueDate);
    return diff === 0;
  });
  const artTomorrow = artActive.filter(l => {
    const diff = daysDiff(l.dueDate, now);
    return diff === 1;
  });

  // Pipeline value from plan text
  const artPipelineMatch = artPlan.match(/pipeline:\s*~?([\d\s]+)\s*PLN/i);
  const artPipeline = artPipelineMatch ? artPipelineMatch[1].replace(/\s/g, '') : '?';

  // Prowizje from plan text
  const prowizjeMatch = artPlan.match(/prowizj[iy][^:]*:\s*([\d\s]+)\s*PLN/i);
  const prowizje = prowizjeMatch ? prowizjeMatch[1].replace(/\s/g, '') : '?';

  // --- SYSTEM 10H ---
  const s10Plan = readPlan('system10h');
  const s10Leads = parseDueDates(s10Plan);
  const s10Active = s10Leads.filter(l => !l.isPaused);

  const s10Overdue = s10Active.filter(l => daysDiff(now, l.dueDate) > 0);
  const s10Today = s10Active.filter(l => daysDiff(now, l.dueDate) === 0);

  // Pipeline value
  const s10PipelineMatch = s10Plan.match(/Pipeline value[^:]*:\s*([\d\s]+)\s*PLN/i);
  const s10Pipeline = s10PipelineMatch ? s10PipelineMatch[1].replace(/\s/g, '') : '?';

  // --- FORMAT MESSAGE ---
  const sections = [];
  sections.push(`📋 <b>PIPELINE BRIEF — ${todayStr} (${dayName})</b>`);
  sections.push('');

  // OVERDUE
  const allOverdue = [
    ...artOverdue.map(l => ({ ...l, biz: 'ART' })),
    ...s10Overdue.map(l => ({ ...l, biz: '10H' }))
  ].sort((a, b) => a.dueDate - b.dueDate);

  if (allOverdue.length > 0) {
    sections.push('🔴 <b>OVERDUE:</b>');
    for (const l of allOverdue.slice(0, 8)) {
      const days = daysDiff(now, l.dueDate);
      const val = l.value ? ` (${l.value} PLN)` : '';
      sections.push(`• [${l.biz}] ${l.name} — ${days}d overdue${val}`);
    }
    if (allOverdue.length > 8) sections.push(`  ...i ${allOverdue.length - 8} więcej`);
    sections.push('');
  }

  // TODAY
  const allToday = [
    ...artToday.map(l => ({ ...l, biz: 'ART' })),
    ...s10Today.map(l => ({ ...l, biz: '10H' }))
  ];

  if (allToday.length > 0) {
    sections.push('📌 <b>DZIŚ:</b>');
    for (const l of allToday.slice(0, 8)) {
      const val = l.value ? ` (${l.value} PLN)` : '';
      sections.push(`• [${l.biz}] ${l.name}${val}`);
    }
    sections.push('');
  }

  // TOMORROW
  const allTomorrow = [
    ...artTomorrow.map(l => ({ ...l, biz: 'ART' })),
    ...s10Active.filter(l => daysDiff(l.dueDate, now) === 1).map(l => ({ ...l, biz: '10H' }))
  ];

  if (allTomorrow.length > 0) {
    sections.push('📅 <b>JUTRO:</b>');
    for (const l of allTomorrow.slice(0, 5)) {
      sections.push(`• [${l.biz}] ${l.name}`);
    }
    sections.push('');
  }

  // PIPELINE SNAPSHOT
  sections.push('📊 <b>PIPELINE:</b>');
  sections.push(`• ARTNAPI: ~${artPipeline} PLN | ${artActive.length} aktywnych`);
  sections.push(`• SYSTEM 10H: ~${s10Pipeline} PLN | ${s10Active.length} aktywnych`);
  if (prowizje !== '?') {
    sections.push(`• 💰 Prowizja luty: ${prowizje} PLN`);
  }

  // WARNINGS
  if (allOverdue.length > 5) {
    sections.push('');
    sections.push(`⚠️ ${allOverdue.length} leadów overdue — rozważ czystkę pipeline`);
  }

  // DAY-SPECIFIC TIPS
  if (now.getDay() === 1) { // Monday
    sections.push('');
    sections.push('🔄 Poniedziałek → rozważ @coo CRM Sync');
  }
  if (now.getDay() === 5) { // Friday
    sections.push('');
    sections.push('📊 Piątek → rozważ Pipeline Pulse + aktualizacja metryki.md');
  }

  const message = sections.join('\n');
  await sendTelegram(message);
  console.log(`[BRIEF] Sent pipeline brief — ${allOverdue.length} overdue, ${allToday.length} today, ${allTomorrow.length} tomorrow`);
}

run().catch(err => {
  console.error('[BRIEF] ERROR:', err.message);
  process.exit(1);
});
