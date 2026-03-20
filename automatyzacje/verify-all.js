#!/usr/bin/env node
// VERIFICATION SUITE — automatyzacje health check
// Sprawdza: syntax, importy, wymagane zmienne .env, state files
// Uruchomienie: node automatyzacje/verify-all.js [--fix] [--verbose]
// Inspiracja: Anthropic internal skill verification practices

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');
const TELEGRAM = process.argv.includes('--telegram');

// --- Konfiguracja skryptów i ich wymagań ---
const SCRIPTS = {
  'email-radar.js': {
    env: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'NOTION_API_KEY', 'TELEGRAM_BOT_TOKEN'],
    state: 'email-radar.json',
    cron: 'com.asystent.email-radar.plist'
  },
  'morning-scan.js': {
    env: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'NOTION_API_KEY'],
    state: null,
    cron: 'com.asystent.morning-scan.plist'
  },
  'morning-chain.js': {
    env: ['TELEGRAM_BOT_TOKEN'],
    state: null,
    cron: 'com.asystent.morning-chain.plist'
  },
  'crm-auto-sync.js': {
    env: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'NOTION_API_KEY', 'TELEGRAM_BOT_TOKEN'],
    state: 'crm-auto-sync.json',
    cron: null
  },
  'pipeline-brief.js': {
    env: ['NOTION_API_KEY', 'TELEGRAM_BOT_TOKEN'],
    state: null,
    cron: 'com.asystent.pipeline-brief.plist'
  },
  'speed-to-lead.js': {
    env: ['MAILERLITE_API_KEY', 'TELEGRAM_BOT_TOKEN'],
    state: 'subscribers.json',
    cron: null
  },
  'followup-guardian.js': {
    env: ['NOTION_API_KEY', 'TELEGRAM_BOT_TOKEN', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'],
    state: 'followup-guardian.json',
    cron: 'com.asystent.followup-guardian.plist'
  },
  'restock-reminder.js': {
    env: ['NOTION_API_KEY', 'TELEGRAM_BOT_TOKEN', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'],
    state: null,
    cron: null
  },
  'inquiry-router.js': {
    env: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'NOTION_API_KEY', 'TELEGRAM_BOT_TOKEN', 'ANTHROPIC_API_KEY'],
    state: 'inquiry-router.json',
    cron: 'com.asystent.inquiry-router.plist'
  },
  'stock-monitor.js': {
    env: ['TELEGRAM_BOT_TOKEN'],
    state: null,
    cron: null
  },
  'generate-weekly-report.js': {
    env: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'NOTION_API_KEY'],
    state: null,
    cron: null
  },
  'create-gmail-draft.js': {
    env: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'],
    state: null,
    cron: null
  },
  'lib.js': {
    env: [],
    state: null,
    cron: null
  }
};

// --- Kolory terminal ---
const C = {
  ok: '\x1b[32m✓\x1b[0m',
  fail: '\x1b[31m✗\x1b[0m',
  warn: '\x1b[33m!\x1b[0m',
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// --- Ładuj .env (bez rzucania błędów) ---
function loadEnvSilent() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return {};
  const vars = {};
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

// --- Testy ---
const results = { pass: 0, fail: 0, warn: 0, details: [] };

function pass(msg) { results.pass++; results.details.push({ status: 'pass', msg }); }
function fail(msg) { results.fail++; results.details.push({ status: 'fail', msg }); }
function warn(msg) { results.warn++; results.details.push({ status: 'warn', msg }); }

// TEST 1: Syntax check (node --check)
console.log(C.bold('\n[1/5] SYNTAX CHECK (node --check)'));
for (const script of Object.keys(SCRIPTS)) {
  const path = join(__dirname, script);
  if (!existsSync(path)) {
    warn(`${script} — plik nie istnieje`);
    continue;
  }
  try {
    execSync(`node --check "${path}"`, { stdio: 'pipe' });
    pass(`${script} — syntax OK`);
    if (VERBOSE) console.log(`  ${C.ok} ${script}`);
  } catch (e) {
    const stderr = e.stderr?.toString().trim() || 'unknown error';
    fail(`${script} — SYNTAX ERROR: ${stderr.split('\n')[0]}`);
    console.log(`  ${C.fail} ${script}: ${stderr.split('\n')[0]}`);
  }
}

// TEST 2: Import resolution (sprawdź czy lib.js eksportuje to co skrypty importują)
console.log(C.bold('\n[2/5] IMPORT CHECK'));
const libPath = join(__dirname, 'lib.js');
const libSource = existsSync(libPath) ? readFileSync(libPath, 'utf-8') : '';
const libExports = [...libSource.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map(m => m[1]);

for (const script of Object.keys(SCRIPTS)) {
  if (script === 'lib.js') continue;
  const path = join(__dirname, script);
  if (!existsSync(path)) continue;

  const source = readFileSync(path, 'utf-8');
  const importMatch = source.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/lib\.js['"]/);
  if (!importMatch) {
    if (VERBOSE) console.log(`  ${C.dim(`${script} — nie importuje z lib.js`)}`);
    continue;
  }

  const imports = importMatch[1].split(',').map(s => s.trim());
  const missing = imports.filter(i => !libExports.includes(i));

  if (missing.length === 0) {
    pass(`${script} — wszystkie importy z lib.js rozwiązane`);
    if (VERBOSE) console.log(`  ${C.ok} ${script} (${imports.length} importów)`);
  } else {
    fail(`${script} — BRAKUJE w lib.js: ${missing.join(', ')}`);
    console.log(`  ${C.fail} ${script}: brakuje eksportów: ${missing.join(', ')}`);
  }
}

// TEST 3: .env variables
console.log(C.bold('\n[3/5] ENV VARIABLES CHECK'));
const envVars = loadEnvSilent();
const envPath = join(ROOT, '.env');

if (!existsSync(envPath)) {
  fail('.env file not found!');
  console.log(`  ${C.fail} .env nie istnieje w ${ROOT}`);
} else {
  const allRequired = new Set();
  for (const [script, config] of Object.entries(SCRIPTS)) {
    for (const v of config.env) {
      allRequired.add(v);
      if (envVars[v] || process.env[v]) {
        if (VERBOSE) console.log(`  ${C.ok} ${v} ${C.dim(`(${script})`)}`);
      } else {
        fail(`${v} — BRAK (wymagany przez ${script})`);
        console.log(`  ${C.fail} ${v} — brak w .env (wymagany przez ${script})`);
      }
    }
  }
  const presentCount = [...allRequired].filter(v => envVars[v] || process.env[v]).length;
  pass(`.env: ${presentCount}/${allRequired.size} zmiennych obecnych`);
}

// TEST 4: State files integrity
console.log(C.bold('\n[4/5] STATE FILES CHECK'));
const stateDir = join(__dirname, 'state');
if (!existsSync(stateDir)) {
  warn('Folder state/ nie istnieje');
} else {
  for (const [script, config] of Object.entries(SCRIPTS)) {
    if (!config.state) continue;
    const statePath = join(stateDir, config.state);
    if (!existsSync(statePath)) {
      warn(`${config.state} — nie istnieje (${script} stworzy przy pierwszym uruchomieniu)`);
      if (VERBOSE) console.log(`  ${C.warn} ${config.state} — brak (OK jeśli nie uruchamiany)`);
      continue;
    }
    try {
      const content = readFileSync(statePath, 'utf-8');
      JSON.parse(content);
      const stats = statSync(statePath);
      const ageHours = (Date.now() - stats.mtimeMs) / 3600000;
      if (ageHours > 48) {
        warn(`${config.state} — ostatnia zmiana ${Math.round(ageHours)}h temu (${script})`);
        console.log(`  ${C.warn} ${config.state}: stary (${Math.round(ageHours)}h) — ${script} może nie działać`);
      } else {
        pass(`${config.state} — valid JSON, świeży (${Math.round(ageHours)}h)`);
        if (VERBOSE) console.log(`  ${C.ok} ${config.state} (${Math.round(ageHours)}h ago)`);
      }
    } catch (e) {
      fail(`${config.state} — INVALID JSON: ${e.message}`);
      console.log(`  ${C.fail} ${config.state}: nieprawidłowy JSON`);
    }
  }
}

// TEST 5: LaunchAgent plists
console.log(C.bold('\n[5/5] LAUNCHAGENT CHECK'));
const plistDir = join(process.env.HOME, 'Library/LaunchAgents');
for (const [script, config] of Object.entries(SCRIPTS)) {
  if (!config.cron) continue;
  const plistPath = join(plistDir, config.cron);
  if (!existsSync(plistPath)) {
    warn(`${config.cron} — nie istnieje (${script} nie jest zaplanowany)`);
    console.log(`  ${C.warn} ${config.cron}: brak LaunchAgent`);
    continue;
  }

  // Sprawdź czy załadowany
  try {
    const loaded = execSync(`launchctl list 2>/dev/null | grep "${config.cron.replace('.plist', '')}"`, { stdio: 'pipe' }).toString().trim();
    if (loaded) {
      pass(`${config.cron} — załadowany i aktywny`);
      if (VERBOSE) console.log(`  ${C.ok} ${config.cron}: aktywny`);
    } else {
      warn(`${config.cron} — plist istnieje ale NIE załadowany`);
      console.log(`  ${C.warn} ${config.cron}: istnieje ale nie załadowany (launchctl load)`);
    }
  } catch {
    warn(`${config.cron} — plist istnieje, status nieznany`);
    if (VERBOSE) console.log(`  ${C.warn} ${config.cron}: nie można sprawdzić statusu`);
  }
}

// --- RAPORT ---
console.log(C.bold('\n' + '═'.repeat(50)));
console.log(C.bold('RAPORT WERYFIKACJI AUTOMATYZACJI'));
console.log('═'.repeat(50));
console.log(`  ${C.ok} Passed:  ${results.pass}`);
console.log(`  ${C.fail} Failed:  ${results.fail}`);
console.log(`  ${C.warn} Warnings: ${results.warn}`);
console.log('─'.repeat(50));

if (results.fail > 0) {
  console.log(C.bold('\nBŁĘDY (wymagają naprawy):'));
  results.details.filter(d => d.status === 'fail').forEach(d => {
    console.log(`  ${C.fail} ${d.msg}`);
  });
}

if (results.warn > 0 && VERBOSE) {
  console.log(C.bold('\nOSTRZEŻENIA:'));
  results.details.filter(d => d.status === 'warn').forEach(d => {
    console.log(`  ${C.warn} ${d.msg}`);
  });
}

console.log('');

// --- TELEGRAM ALERT (tylko przy --telegram i FAIL) ---
if (TELEGRAM && results.fail > 0) {
  try {
    // Załaduj .env dla TELEGRAM_BOT_TOKEN
    const envPath2 = join(ROOT, '.env');
    if (existsSync(envPath2)) {
      const lines = readFileSync(envPath2, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = '1304598782';
    if (token) {
      const failures = results.details
        .filter(d => d.status === 'fail')
        .map(d => `  - ${d.msg}`)
        .join('\n');
      const warnings = results.details
        .filter(d => d.status === 'warn')
        .map(d => `  - ${d.msg}`)
        .join('\n');

      let msg = `<b>VERIFICATION FAILED</b>\n\nPassed: ${results.pass} | Failed: ${results.fail} | Warn: ${results.warn}\n\n<b>Błędy:</b>\n${failures}`;
      if (warnings) msg += `\n\n<b>Ostrzeżenia:</b>\n${warnings}`;
      msg += `\n\nUruchom: node automatyzacje/verify-all.js --verbose`;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: msg.length > 4000 ? msg.slice(0, 4000) + '\n...(skrócono)' : msg,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
      console.log('Telegram alert wysłany.');
    }
  } catch (e) {
    console.error('Telegram alert failed:', e.message);
  }
}

// Exit code: 1 jeśli są błędy (przydatne w CI/hooks)
process.exit(results.fail > 0 ? 1 : 0);
