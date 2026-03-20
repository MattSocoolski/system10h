#!/usr/bin/env node
// MORNING CHAIN — Sequential orchestrator for morning automation suite
// Runs 3 scripts in order: morning-scan → crm-auto-sync → followup-guardian --include-due-today
// Schedule: pn-pt 8:00 (replaces morning-scan.plist)
// Usage:
//   node automatyzacje/morning-chain.js              → full chain
//   node automatyzacje/morning-chain.js --force      → skip weekend guard, pass --force to morning-scan
//   node automatyzacje/morning-chain.js --dry-run    → pass --dry-run to all scripts

import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, sendTelegram } from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const NODE = process.execPath;

loadEnv();

// --- CLI args ---
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

// --- Weekend guard ---
const dayOfWeek = new Date().getDay();
if (!FORCE && (dayOfWeek === 0 || dayOfWeek === 6)) {
  console.log(`[CHAIN] Weekend (day=${dayOfWeek}) — skipping. Use --force to override.`);
  process.exit(0);
}

// --- Script definitions ---
const SCRIPTS = [
  {
    name: 'morning-scan',
    path: join(__dirname, 'morning-scan.js'),
    args: FORCE ? ['--force'] : [],
    required: true
  },
  {
    name: 'crm-auto-sync',
    path: join(__dirname, 'crm-auto-sync.js'),
    args: DRY_RUN ? [] : ['--live'],  // crm-auto-sync defaults to dry-run; pass --live when chain is in normal mode
    required: false // may not exist yet
  },
  {
    name: 'followup-guardian',
    path: join(__dirname, 'followup-guardian.js'),
    args: ['--include-due-today', ...(DRY_RUN ? ['--dry-run'] : [])],
    required: true
  }
];

// --- Run a single script as child process ---
function runScript(script) {
  return new Promise((resolve) => {
    // Check if script exists (for optional scripts)
    if (!existsSync(script.path)) {
      if (script.required) {
        resolve({ name: script.name, ok: false, error: 'file not found', ms: 0 });
      } else {
        console.log(`[CHAIN] ${script.name} — not found, skipping (optional)`);
        resolve({ name: script.name, ok: null, error: 'not found (optional)', ms: 0 });
      }
      return;
    }

    const start = Date.now();
    console.log(`[CHAIN] Starting ${script.name}...`);

    execFile(NODE, [script.path, ...script.args], {
      cwd: ROOT,
      timeout: 180_000, // 3 min per script (followup-guardian needs time for Claude API calls)
      env: process.env
    }, (error, stdout, stderr) => {
      const ms = Date.now() - start;

      if (stdout) {
        // Print child stdout line by line with prefix
        for (const line of stdout.split('\n').filter(Boolean)) {
          console.log(`  ${line}`);
        }
      }
      if (stderr) {
        for (const line of stderr.split('\n').filter(Boolean)) {
          console.error(`  ${line}`);
        }
      }

      if (error) {
        console.error(`[CHAIN] ${script.name} FAILED (${ms}ms): ${error.message}`);
        resolve({ name: script.name, ok: false, error: error.message, ms });
      } else {
        console.log(`[CHAIN] ${script.name} OK (${ms}ms)`);
        resolve({ name: script.name, ok: true, error: null, ms });
      }
    });
  });
}

// --- Main ---
async function run() {
  const chainStart = Date.now();
  console.log(`[CHAIN] Started at ${new Date().toISOString()} — force:${FORCE} dry-run:${DRY_RUN}`);

  const results = [];
  for (const script of SCRIPTS) {
    const result = await runScript(script);
    results.push(result);
  }

  const totalMs = Date.now() - chainStart;

  // Build summary
  const passed = results.filter(r => r.ok === true).length;
  const failed = results.filter(r => r.ok === false).length;
  const skipped = results.filter(r => r.ok === null).length;
  const total = results.length;

  const icons = results.map(r =>
    r.ok === true ? '\u2705' : r.ok === false ? '\u274c' : '\u23ed'
  );
  const statusLine = results.map((r, i) => `${r.name} ${icons[i]}`).join(' ');

  console.log(`[CHAIN] Done in ${totalMs}ms — ${passed}/${total} OK, ${failed} failed, ${skipped} skipped`);

  // Telegram summary
  const tgLines = [];
  tgLines.push(`<b>MORNING CHAIN</b> ${passed}/${total}`);
  tgLines.push('');
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const icon = r.ok === true ? '\u2705' : r.ok === false ? '\u274c' : '\u23ed';
    const timing = r.ms > 0 ? ` (${(r.ms / 1000).toFixed(1)}s)` : '';
    const err = r.ok === false ? ` — ${r.error.slice(0, 80)}` : '';
    tgLines.push(`${icon} ${r.name}${timing}${err}`);
  }
  tgLines.push('');
  tgLines.push(`Czas: ${(totalMs / 1000).toFixed(1)}s`);

  if (DRY_RUN) tgLines.push('<i>(dry-run mode)</i>');

  try {
    await sendTelegram(tgLines.join('\n'));
  } catch (err) {
    console.error(`[CHAIN] Telegram send failed: ${err.message}`);
  }

  // Exit with error if any required script failed
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('[CHAIN] FATAL:', err.message);
  sendTelegram(`<b>MORNING CHAIN ERROR</b>\n${err.message}`).catch(() => {});
  process.exit(1);
});
