#!/usr/bin/env node
// WEEKLY PULSE — Samograj Starter
// Weekly summary: pipeline value, active/overdue/closed leads, task completion.
// Schedule: cron weeklyReportDay (default Friday)
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

function getWeekNumber(d) {
  const dt = new Date(d); dt.setHours(0,0,0,0);
  dt.setDate(dt.getDate() + 3 - ((dt.getDay() + 6) % 7));
  const w1 = new Date(dt.getFullYear(), 0, 4);
  return Math.round(((dt - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7) + 1;
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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const wk = `W${getWeekNumber(today)}`;

  const stanPath = resolve(__dirname, config.stanPath);
  let content;
  try { content = readFileSync(stanPath, 'utf-8'); }
  catch { await sendTelegram(`<b>${esc(config.businessName)} PULSE ${wk}</b>\n\nBrak pliku stan.md.`); return; }

  const stan = parseStan(content);
  let totalValue = 0, activeCount = 0, overdueCount = 0, overdueValue = 0;
  let closedWon = 0, closedWonValue = 0, closedLost = 0;

  for (const lead of stan.pipeline) {
    const value = parseValue(lead.wartosc);
    const st = lead.status.toLowerCase();
    if (st.includes('wygrana')) { closedWon++; closedWonValue += value; continue; }
    if (st.includes('przegrana')) { closedLost++; continue; }
    activeCount++; totalValue += value;
    const dd = parseDate(lead.due);
    if (dd && Math.floor((today - dd) / 864e5) > 0) { overdueCount++; overdueValue += value; }
  }

  const total = stan.tasks.done + stan.tasks.pending;
  const rate = total > 0 ? Math.round((stan.tasks.done / total) * 100) : 0;

  const s = [];
  s.push(`<b>${esc(config.businessName)} TYDZIEN ${wk}</b>\n`);
  if (stan.cel && !stan.cel.startsWith('[')) s.push(`Cel: ${esc(stan.cel)}\n`);

  s.push('<b>PIPELINE:</b>');
  s.push(`  Aktywnych leadow: ${activeCount}`);
  s.push(`  Wartosc: ~${totalValue.toLocaleString('pl-PL')} PLN`);
  s.push(overdueCount > 0 ? `  Zaleglosci: ${overdueCount} (~${overdueValue.toLocaleString('pl-PL')} PLN)` : '  Zaleglosci: 0 — czysto!');
  s.push('');

  if (closedWon || closedLost) {
    s.push('<b>ZAMKNIETE:</b>');
    if (closedWon) s.push(`  Wygrane: ${closedWon} (~${closedWonValue.toLocaleString('pl-PL')} PLN)`);
    if (closedLost) s.push(`  Przegrane: ${closedLost}`);
    s.push('');
  }
  if (total > 0) {
    s.push('<b>ZADANIA:</b>');
    s.push(`  Zrobione: ${stan.tasks.done}/${total} (${rate}%)`);
    if (stan.tasks.pending > 0) s.push(`  Zostalo: ${stan.tasks.pending}`);
    s.push('');
  }

  const issues = [];
  if (overdueCount > 0) issues.push(`${overdueCount} zaleglosci`);
  if (rate < 50 && total > 0) issues.push(`zadania na ${rate}%`);
  s.push(issues.length === 0 ? 'Stan: ZDROWY — tak trzymaj!' : `Stan: WYMAGA UWAGI — ${issues.join(', ')}`);
  s.push('');
  s.push(`Pipeline ${totalValue.toLocaleString('pl-PL')} PLN | ${activeCount} aktywnych | ${closedWon} zamknietych | ${overdueCount} zaleglosci`);

  await sendTelegram(s.join('\n'));
  console.log(`[PULSE] Wyslano ${wk} — active:${activeCount} value:${totalValue} overdue:${overdueCount} won:${closedWon} tasks:${stan.tasks.done}/${total}`);
}

run().catch(err => {
  console.error('[PULSE] BLAD:', err.message);
  sendTelegram(`<b>PULSE BLAD</b>\n${err.message}`).catch(() => {});
  process.exit(1);
});
