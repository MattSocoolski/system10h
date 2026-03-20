#!/usr/bin/env node
// MORNING BRIEF — Samograj Starter
// Reads stan.md → sends daily Telegram briefing (overdue leads, tasks, weekly goal).
// Schedule: cron morningHour (default 8:00), Mon-Fri
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function sendTelegram(text) {
  if (!config.telegramBotToken || !config.telegramChatId) {
    console.log(text.replace(/<[^>]*>/g, '')); return;
  }
  const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: config.telegramChatId, text, parse_mode: 'HTML' })
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
}

function parseDate(s) {
  if (!s || s === '-') return null;
  const p = s.trim().split('.');
  if (p.length < 2) return null;
  const d = parseInt(p[0]), m = parseInt(p[1]) - 1;
  const y = p.length >= 3 ? parseInt(p[2]) : new Date().getFullYear();
  return (isNaN(d) || isNaN(m)) ? null : new Date(y, m, d);
}

function parseValue(s) {
  if (!s || s === '-') return 0;
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function parseStan(content) {
  const r = { cel: '', pipeline: [], tasks: { done: 0, pending: 0 } };
  const celM = content.match(/## CEL TYGODNIA\s*\n+([\s\S]*?)(?=\n## |\n$)/);
  if (celM) r.cel = celM[1].trim().replace(/^\[|\]$/g, '');

  const pipM = content.match(/## PIPELINE\s*\n+([\s\S]*?)(?=\n## |\n$)/);
  if (pipM) for (const line of pipM[1].trim().split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Klient')) continue;
    const c = line.split('|').map(s => s.trim()).filter(Boolean);
    if (c.length >= 6) r.pipeline.push({ klient: c[0], wartosc: c[1], status: c[2], ostatniKontakt: c[3], nastepnyKrok: c[4], due: c[5] });
  }

  const taskM = content.match(/## ZADANIA\s*\n+([\s\S]*?)(?=\n## |\n$)/);
  if (taskM) for (const line of taskM[1].trim().split('\n')) {
    if (/^\s*-\s*\[x\]/i.test(line)) r.tasks.done++;
    else if (/^\s*-\s*\[\s*\]/.test(line)) r.tasks.pending++;
  }
  return r;
}

async function run() {
  const now = new Date();
  if (now.getDay() === 0 || now.getDay() === 6) { console.log('[BRIEF] Weekend — pomijam.'); return; }

  const stanPath = resolve(__dirname, config.stanPath);
  let content;
  try { content = readFileSync(stanPath, 'utf-8'); }
  catch { await sendTelegram(`<b>${esc(config.businessName)} BRIEF</b>\n\nBrak pliku stan.md.`); return; }

  const stan = parseStan(content);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = ['niedziela','poniedzialek','wtorek','sroda','czwartek','piatek','sobota'];

  const overdue = [], dueToday = [];
  let totalValue = 0;

  for (const lead of stan.pipeline) {
    const value = parseValue(lead.wartosc);
    totalValue += value;
    const dd = parseDate(lead.due);
    if (!dd) continue;
    const diff = Math.floor((today - dd) / 864e5);
    if (diff > 0) overdue.push({ ...lead, daysOverdue: diff, value });
    else if (diff === 0) dueToday.push({ ...lead, value });
  }
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const s = [];
  s.push(`<b>${esc(config.businessName)} BRIEFING ${today.toISOString().slice(0,10)} (${days[now.getDay()]})</b>\n`);
  if (stan.cel && !stan.cel.startsWith('[')) s.push(`Cel tygodnia: ${esc(stan.cel)}\n`);

  const overdueVal = overdue.reduce((a, l) => a + l.value, 0);
  s.push(`Pipeline: ${stan.pipeline.length} leadow, ~${totalValue.toLocaleString('pl-PL')} PLN`);
  const total = stan.tasks.done + stan.tasks.pending;
  if (total > 0) s.push(`Zadania: ${stan.tasks.done}/${total} zrobione`);
  s.push('');

  if (overdue.length > 0) {
    s.push(`<b>ZALEGLE (${overdue.length}, ~${overdueVal.toLocaleString('pl-PL')} PLN):</b>`);
    for (const l of overdue.slice(0, config.maxAlertsPerRun)) {
      const v = l.value ? `, ${l.value.toLocaleString('pl-PL')} PLN` : '';
      const tag = l.daysOverdue >= config.criticalDays ? 'PILNE' : 'WAZNE';
      s.push(`  ${tag}: ${esc(l.klient)} — ${l.daysOverdue} dni${v}`);
      if (l.nastepnyKrok && l.nastepnyKrok !== '-') s.push(`  -> ${esc(l.nastepnyKrok)}`);
    }
    if (overdue.length > config.maxAlertsPerRun) s.push(`  ...i ${overdue.length - config.maxAlertsPerRun} wiecej`);
    s.push('');
  }
  if (dueToday.length > 0) {
    s.push(`<b>NA DZIS (${dueToday.length}):</b>`);
    for (const l of dueToday) {
      const v = l.value ? ` (${l.value.toLocaleString('pl-PL')} PLN)` : '';
      s.push(`  ${esc(l.klient)}${v} — ${esc(l.nastepnyKrok || l.status)}`);
    }
    s.push('');
  }
  if (!overdue.length && !dueToday.length) s.push('Brak zaleglosci — pipeline czysty.\n');
  if (stan.tasks.pending > 0) s.push(`${stan.tasks.pending} zadan do zrobienia.`);

  await sendTelegram(s.join('\n'));
  console.log(`[BRIEF] Wyslano — pipeline:${stan.pipeline.length} overdue:${overdue.length} today:${dueToday.length} tasks:${stan.tasks.done}/${total}`);
}

run().catch(err => {
  console.error('[BRIEF] BLAD:', err.message);
  sendTelegram(`<b>BRIEF BLAD</b>\n${err.message}`).catch(() => {});
  process.exit(1);
});
