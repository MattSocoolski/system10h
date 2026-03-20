#!/usr/bin/env node
// FOLLOWUP ALERT — Samograj Starter
// Reads stan.md pipeline → Telegram alert grouped by urgency (PILNE/WAZNE/JUTRO).
// Schedule: cron followupCheckHour (default 17:00), Mon-Fri
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

function parsePipeline(content) {
  const leads = [];
  const m = content.match(/## PIPELINE\s*\n+([\s\S]*?)(?=\n## |\n$)/);
  if (!m) return leads;
  for (const line of m[1].trim().split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Klient')) continue;
    const c = line.split('|').map(s => s.trim()).filter(Boolean);
    if (c.length < 6) continue;
    const status = c[2].toLowerCase();
    if (status.includes('wygrana') || status.includes('przegrana')) continue;
    leads.push({ klient: c[0], wartosc: c[1], status: c[2], ostatniKontakt: c[3], nastepnyKrok: c[4], due: c[5] });
  }
  return leads;
}

async function run() {
  const now = new Date();
  if (now.getDay() === 0 || now.getDay() === 6) { console.log('[FOLLOWUP] Weekend — pomijam.'); return; }

  const stanPath = resolve(__dirname, config.stanPath);
  let content;
  try { content = readFileSync(stanPath, 'utf-8'); }
  catch { console.error(`[FOLLOWUP] Brak pliku ${stanPath}`); return; }

  const pipeline = parsePipeline(content);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const pilne = [], wazne = [], jutro = [];
  for (const lead of pipeline) {
    const dd = parseDate(lead.due);
    if (!dd) continue;
    const diff = Math.floor((today - dd) / 864e5);
    const value = parseValue(lead.wartosc);
    if (diff >= config.criticalDays) pilne.push({ ...lead, daysOverdue: diff, value });
    else if (diff >= config.followupDays) wazne.push({ ...lead, daysOverdue: diff, value });
    else if (diff === -1) jutro.push({ ...lead, value });
  }

  if (!pilne.length && !wazne.length && !jutro.length) {
    console.log('[FOLLOWUP] Brak zaleglosci.'); return;
  }

  const s = [];
  s.push(`<b>${esc(config.businessName)} FOLLOW-UP CHECK ${today.toISOString().slice(0,10)}</b>\n`);

  if (pilne.length) {
    const v = pilne.reduce((a, l) => a + l.value, 0);
    s.push(`<b>PILNE — ponad ${config.criticalDays} dni (${pilne.length}, ~${v.toLocaleString('pl-PL')} PLN):</b>`);
    for (const l of pilne.slice(0, config.maxAlertsPerRun)) {
      const vs = l.value ? `, ${l.value.toLocaleString('pl-PL')} PLN` : '';
      s.push(`  ${esc(l.klient)} — ${l.daysOverdue} dni${vs}`);
      s.push('  -> Napisz albo zamknij temat');
    }
    s.push('');
  }
  if (wazne.length) {
    const v = wazne.reduce((a, l) => a + l.value, 0);
    s.push(`<b>WAZNE — ${config.followupDays}-${config.criticalDays} dni (${wazne.length}, ~${v.toLocaleString('pl-PL')} PLN):</b>`);
    for (const l of wazne.slice(0, config.maxAlertsPerRun)) {
      const vs = l.value ? `, ${l.value.toLocaleString('pl-PL')} PLN` : '';
      s.push(`  ${esc(l.klient)} — ${l.daysOverdue} dni${vs}`);
      if (l.nastepnyKrok && l.nastepnyKrok !== '-') s.push(`  -> ${esc(l.nastepnyKrok)}`);
    }
    s.push('');
  }
  if (jutro.length) {
    s.push(`<b>JUTRO — przygotuj (${jutro.length}):</b>`);
    for (const l of jutro) {
      const vs = l.value ? ` (${l.value.toLocaleString('pl-PL')} PLN)` : '';
      s.push(`  ${esc(l.klient)}${vs} — ${esc(l.nastepnyKrok || l.status)}`);
    }
    s.push('');
  }

  s.push(`Razem: ${pilne.length + wazne.length} wymaga akcji, ${jutro.length} na jutro`);
  if (pilne.length) s.push(`${pilne.length} leadow PILNYCH — nie czekaj dluzej!`);

  await sendTelegram(s.join('\n'));
  console.log(`[FOLLOWUP] Wyslano — pilne:${pilne.length} wazne:${wazne.length} jutro:${jutro.length}`);
}

run().catch(err => {
  console.error('[FOLLOWUP] BLAD:', err.message);
  sendTelegram(`<b>FOLLOWUP BLAD</b>\n${err.message}`).catch(() => {});
  process.exit(1);
});
