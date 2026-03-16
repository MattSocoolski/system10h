#!/usr/bin/env node
// STOCK MONITOR v1 — Inventory Forecasting & Alerts
// Cel: Monitoruje zapasy magazynowe, estymuje daty stockoutu, alertuje na Telegram
// Źródło: dane/artnapi/stock.json (aktualizowany ręcznie po każdej dostawie/sprzedaży)
// Cron: 0 9 * * 1 (poniedziałki 9:00)
//
// Tryby:
//   node stock-monitor.js              → pełny raport na Telegram
//   node stock-monitor.js --check      → tylko alert jeśli stock < threshold
//   node stock-monitor.js --dry-run    → loguje do konsoli, nie wysyła Telegrama

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, sendTelegram } from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

loadEnv();

// --- Config ---
const STOCK_FILE = join(ROOT, 'dane', 'artnapi', 'stock.json');
const DRY_RUN = process.argv.includes('--dry-run');
const CHECK_ONLY = process.argv.includes('--check');

// --- Helpers ---
function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// --- Core Logic ---
function analyzeProduct(product, today) {
  const { stock_current, burn_rate_monthly, incoming, alert_weeks, name, sku } = product;

  if (burn_rate_monthly <= 0) {
    return { sku, name, status: 'inactive', message: `${name}: brak sprzedaży (burn=0)` };
  }

  const dailyBurn = burn_rate_monthly / 30;
  const weeklyBurn = dailyBurn * 7;

  // Sort incoming by ETA
  const sortedIncoming = [...incoming]
    .filter(d => d.eta >= today)
    .sort((a, b) => a.eta.localeCompare(b.eta));

  // Simulate day by day to find stockout date
  let stock = stock_current;
  let currentDate = today;
  let stockoutDate = null;
  let deliveriesUsed = [];

  // Simulate up to 365 days
  for (let day = 0; day < 365; day++) {
    const simDate = addDays(today, day);

    // Check for deliveries arriving today
    for (const delivery of sortedIncoming) {
      if (delivery.eta === simDate && !deliveriesUsed.includes(delivery)) {
        stock += delivery.qty;
        deliveriesUsed.push(delivery);
      }
    }

    // Consume daily burn
    stock -= dailyBurn;

    if (stock <= 0 && !stockoutDate) {
      stockoutDate = simDate;
      break;
    }
  }

  const daysToStockout = stockoutDate ? daysBetween(today, stockoutDate) : 999;
  const weeksToStockout = Math.round(daysToStockout / 7 * 10) / 10;
  const isAlert = daysToStockout <= alert_weeks * 7;

  // Current runway (without incoming)
  const rawRunwayDays = Math.round(stock_current / dailyBurn);
  const rawStockoutDate = addDays(today, rawRunwayDays);

  // Next delivery
  const nextDelivery = sortedIncoming.length > 0 ? sortedIncoming[0] : null;

  // Total incoming
  const totalIncoming = sortedIncoming.reduce((sum, d) => sum + d.qty, 0);

  return {
    sku,
    name,
    status: isAlert ? 'ALERT' : 'OK',
    stock_current,
    dailyBurn: Math.round(dailyBurn),
    weeklyBurn: Math.round(weeklyBurn),
    burn_rate_monthly,
    rawRunwayDays,
    rawStockoutDate,
    totalIncoming,
    stockoutDate: stockoutDate || 'brak (>12 mies)',
    daysToStockout,
    weeksToStockout,
    nextDelivery,
    deliveriesCount: sortedIncoming.length,
    isAlert
  };
}

function formatReport(analyses, today) {
  const alerts = analyses.filter(a => a.isAlert);
  const hasAlerts = alerts.length > 0;

  let msg = `<b>📦 STOCK MONITOR — ${today}</b>\n\n`;

  for (const a of analyses) {
    if (a.status === 'inactive') {
      msg += `⚪ ${a.name}: nieaktywny\n`;
      continue;
    }

    const icon = a.isAlert ? '🔴' : '🟢';
    msg += `${icon} <b>${a.name}</b>\n`;
    msg += `   Stan: ${a.stock_current.toLocaleString('pl')} szt\n`;
    msg += `   Tempo: ~${a.burn_rate_monthly.toLocaleString('pl')} szt/mies (~${a.dailyBurn}/dzień)\n`;
    msg += `   Bez dostaw: stockout ${a.rawStockoutDate} (${a.rawRunwayDays} dni)\n`;

    if (a.totalIncoming > 0) {
      msg += `   W dostawie: ${a.totalIncoming.toLocaleString('pl')} szt (${a.deliveriesCount} dostaw)\n`;
      if (a.nextDelivery) {
        msg += `   Najbliższa: ${a.nextDelivery.qty.toLocaleString('pl')} szt → ${a.nextDelivery.eta}`;
        if (a.nextDelivery.note) msg += ` (${a.nextDelivery.note})`;
        msg += '\n';
      }
      msg += `   Z dostawami: stockout ${a.stockoutDate} (${a.weeksToStockout} tyg)\n`;
    } else {
      msg += `   Brak dostaw w planie!\n`;
    }

    if (a.isAlert) {
      msg += `   ⚠️ <b>ALERT: Mniej niż ${Math.round(a.daysToStockout / 7)} tyg zapasu!</b>\n`;
    }
    msg += '\n';
  }

  if (hasAlerts) {
    msg += `\n🚨 <b>WYMAGANA AKCJA:</b> ${alerts.length} produkt(ów) poniżej progu bezpieczeństwa!\n`;
    msg += `Zaktualizuj: dane/artnapi/stock.json\n`;
  }

  return msg;
}

// --- Main ---
async function main() {
  const today = todayStr();

  // Read stock data
  let stockData;
  try {
    stockData = JSON.parse(readFileSync(STOCK_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Błąd odczytu ${STOCK_FILE}:`, err.message);
    process.exit(1);
  }

  // Check staleness
  const daysSinceUpdate = daysBetween(stockData.last_updated, today);
  if (daysSinceUpdate > 7) {
    console.warn(`⚠️ stock.json nieaktualny! Ostatnia aktualizacja: ${stockData.last_updated} (${daysSinceUpdate} dni temu)`);
  }

  // Analyze each product
  const analyses = stockData.products.map(p => analyzeProduct(p, today));

  // Check-only mode: only alert if threshold breached
  if (CHECK_ONLY) {
    const alerts = analyses.filter(a => a.isAlert);
    if (alerts.length === 0) {
      console.log('✅ Wszystkie produkty powyżej progu bezpieczeństwa.');
      return;
    }
  }

  // Generate report
  const report = formatReport(analyses, today);

  if (DRY_RUN) {
    // Strip HTML tags for console
    console.log(report.replace(/<[^>]+>/g, ''));
    console.log('--- DRY RUN: Telegram nie wysłany ---');
    return;
  }

  // Send to Telegram
  try {
    await sendTelegram(report);
    console.log(`✅ Stock monitor report wysłany na Telegram (${today})`);
  } catch (err) {
    console.error('❌ Błąd wysyłki Telegram:', err.message);
    process.exit(1);
  }

  // Log to console
  for (const a of analyses) {
    if (a.status === 'inactive') continue;
    const icon = a.isAlert ? '🔴' : '🟢';
    console.log(`${icon} ${a.name}: ${a.stock_current} szt, stockout ${a.stockoutDate} (${a.weeksToStockout} tyg)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
