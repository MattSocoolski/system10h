// Shared library for automatyzacje — zero dependencies (Node 18+)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- .env loader ---
export function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) throw new Error('.env not found at ' + envPath);
  const lines = readFileSync(envPath, 'utf-8').split('\n');
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

// --- Telegram ---
const CHAT_ID = '1304598782';

export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');

  // Telegram limit: 4096 chars
  const truncated = text.length > 4000 ? text.slice(0, 4000) + '\n...(skrócono)' : text;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: truncated,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram error: ${JSON.stringify(data)}`);
  return data;
}

// --- MailerLite ---
const ML_API = 'https://connect.mailerlite.com/api';

export async function mlFetch(endpoint) {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) throw new Error('MAILERLITE_API_KEY not set');
  const res = await fetch(`${ML_API}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`MailerLite ${res.status}: ${await res.text()}`);
  return res.json();
}

// --- Notion API (CRM) ---
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';
const CRM_DATA_SOURCE_ID = '26f862e1-4a0c-808f-a249-000b2cee31df';

export async function notionFetch(endpoint, options = {}) {
  const key = process.env.NOTION_API_KEY;
  if (!key) throw new Error('NOTION_API_KEY not set');
  const res = await fetch(`${NOTION_API}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function queryCRM(filter, sorts = []) {
  const body = { page_size: 100 };
  if (filter && Object.keys(filter).length) body.filter = filter;
  if (sorts.length) body.sorts = sorts;

  let results = [];
  let cursor;
  do {
    if (cursor) body.start_cursor = cursor;
    const data = await notionFetch(`/data_sources/${CRM_DATA_SOURCE_ID}/query`, {
      method: 'POST', body
    });
    results = results.concat(data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

export function parseNotionLead(page) {
  const p = page.properties;
  const getText = (prop) => {
    if (!prop) return '';
    if (prop.type === 'title') return (prop.title || []).map(t => t.plain_text).join('');
    if (prop.type === 'rich_text') return (prop.rich_text || []).map(t => t.plain_text).join('');
    return '';
  };
  const getSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
  const getDate = (prop) => prop?.date?.start ? new Date(prop.date.start + 'T00:00:00') : null;
  const getNumber = (prop) => prop?.number ?? null;

  return {
    id: page.id,
    name: getText(p['Task name']),
    company: getText(p['nazwa klienta']),
    contact: getText(p['osoba kontaktowa']),
    email: p['Email']?.email || '',
    phone: p['Phone']?.phone_number || '',
    status: getSelect(p['Status']),
    priority: getSelect(p['PRIORYTET']),
    segment: getSelect(p['segment rynku']),
    country: getSelect(p['kraj']),
    icp: getSelect(p['ICP']),
    source: getSelect(p['źródło leada']),
    value: getNumber(p['wartość szansy']),
    due: getDate(p['Due']),
    lastContact: getDate(p['ostatni kontakt']),
    notes: getText(p['notatki']),
    summary: getText(p['Summary'])
  };
}

// --- State persistence ---
export function loadState(name) {
  const path = join(__dirname, 'state', `${name}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function saveState(name, data) {
  const path = join(__dirname, 'state', `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// --- Plan parser ---
export function readPlan(tryb) {
  const path = join(ROOT, 'dane', tryb, 'plan.md');
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf-8');
}

export function parseDueDates(planText) {
  const leads = [];
  const lines = planText.split('\n');

  for (const line of lines) {
    // Match pipeline entries: "* **Name:** ... Due: DD.MM ..."
    const nameMatch = line.match(/\*\s+\*\*([^*]+)\*\*/);
    if (!nameMatch) continue;

    const name = nameMatch[1].replace(/[~]/g, '').trim();
    const dueMatch = line.match(/Due[:\s]+~?(\d{1,2})\.(\d{2})(?:\.(\d{4}))?/i);
    if (!dueMatch) continue;

    const day = parseInt(dueMatch[1]);
    const month = parseInt(dueMatch[2]);
    const year = dueMatch[3] ? parseInt(dueMatch[3]) : new Date().getFullYear();
    const dueDate = new Date(year, month - 1, day);

    // Extract value if present
    const valMatch = line.match(/Wartość:\s*([\d\s]+)\s*PLN/i);
    const value = valMatch ? valMatch[1].replace(/\s/g, '') : null;

    // Check status hints
    const isPaused = /PAUZA|ZAMROŻON|Ghosting|wykreślon/i.test(line);

    leads.push({ name, dueDate, value, isPaused, raw: line.trim() });
  }

  // Also parse table rows: "| Lead | ... | Due: DD.MM | ..."
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const nameMatch = line.match(/\|\s*\*\*([^*|]+)\*\*/);
    if (!nameMatch) continue;

    const name = nameMatch[1].trim();
    const dueMatch = line.match(/Due[:\s]+~?(\d{1,2})\.(\d{2})/i);
    // Skip if already captured
    if (!dueMatch || leads.some(l => l.name.includes(name.slice(0, 10)))) continue;

    const day = parseInt(dueMatch[1]);
    const month = parseInt(dueMatch[2]);
    const dueDate = new Date(new Date().getFullYear(), month - 1, day);
    const isPaused = /ZAMROŻON|PAUZA|NURTURE/i.test(line);

    leads.push({ name, dueDate, value: null, isPaused, raw: line.trim() });
  }

  return leads;
}

export function parsePipelineValue(planText) {
  const match = planText.match(/pipeline:\s*~?([\d\s]+)\s*PLN/i);
  return match ? match[1].replace(/\s/g, '') : null;
}

export function parseSection(planText, sectionName) {
  const regex = new RegExp(`###?\\s+.*${sectionName}[\\s\\S]*?(?=\\n###?\\s|\\n---\\s|$)`, 'i');
  const match = planText.match(regex);
  return match ? match[0] : '';
}

export function today() {
  return new Date();
}

export function formatDate(d) {
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function daysDiff(d1, d2) {
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
}
