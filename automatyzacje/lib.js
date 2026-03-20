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
    summary: getText(p['Summary']),
    tag: getSelect(p['tag_klienta'])
  };
}

// --- Language detection ---
export function isForeignLead(lead) {
  const country = (lead.country || '').toUpperCase();
  // Explicit country set and not Poland
  if (country && country !== 'PL' && country !== 'POLSKA' && country !== 'POLAND') {
    return true;
  }
  // Fallback: check email TLD for known EU country domains
  if (!country && lead.email) {
    const tld = lead.email.split('.').pop().toLowerCase();
    const foreignTLDs = [
      'cz', 'sk', 'hu', 'lt', 'lv', 'ee', 'de', 'nl', 'fr', 'se', 'dk',
      'at', 'ro', 'bg', 'hr', 'si', 'fi', 'no', 'be', 'pt', 'es', 'it', 'ie', 'uk', 'ch'
    ];
    return foreignTLDs.includes(tld);
  }
  return false;
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

// --- Gmail API (OAuth 2.0) ---

export async function gmailGetAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail OAuth not configured — run: node automatyzacje/gmail-auth.js');
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 10000; // 10s between retries (network wake-up after sleep)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }).toString()
      });

      const data = await res.json();
      if (data.error) throw new Error(`Gmail token refresh failed: ${data.error} — ${data.error_description || ''}`);
      return data.access_token;
    } catch (err) {
      const isNetworkError = err.message === 'fetch failed' || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED');
      if (isNetworkError && attempt < MAX_RETRIES) {
        console.log(`[OAuth] Network error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw err; // non-network error or last attempt — propagate
    }
  }
}

export async function gmailFetch(accessToken, endpoint, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://www.googleapis.com/gmail/v1/users/me/${endpoint}${qs ? '?' + qs : ''}`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function gmailSearchMessages(accessToken, query, maxResults = 10) {
  const data = await gmailFetch(accessToken, 'messages', { q: query, maxResults: String(maxResults) });
  return data.messages || [];
}

export async function gmailGetMessage(accessToken, messageId, format = 'metadata') {
  // Gmail API requires repeated metadataHeaders params (one per header)
  const qs = new URLSearchParams();
  qs.append('format', format);
  qs.append('metadataHeaders', 'From');
  qs.append('metadataHeaders', 'To');
  qs.append('metadataHeaders', 'Subject');
  qs.append('metadataHeaders', 'Date');
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?${qs.toString()}`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API ${res.status}: ${text}`);
  }
  const data = await res.json();

  const headers = {};
  for (const h of (data.payload?.headers || [])) {
    headers[h.name.toLowerCase()] = h.value;
  }

  return {
    id: data.id,
    threadId: data.threadId,
    from: headers.from || '',
    to: headers.to || '',
    subject: headers.subject || '',
    date: headers.date || '',
    snippet: data.snippet || '',
    labels: data.labelIds || []
  };
}

export async function gmailListDrafts(accessToken, maxResults = 10) {
  const data = await gmailFetch(accessToken, 'drafts', { maxResults: String(maxResults) });
  const drafts = [];

  for (const d of (data.drafts || [])) {
    const msg = d.message;
    if (!msg?.id) continue;
    // Fetch draft message details
    const detail = await gmailGetMessage(accessToken, msg.id);
    drafts.push({
      id: d.id,
      subject: detail.subject,
      to: detail.to,
      snippet: detail.snippet
    });
  }

  return drafts;
}

export function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- HTML Email Signatures ---
export const HTML_SIGNATURE_PL = `<p style="margin-top: 16px; line-height: 1.6;">
<strong>Sokólski Mateusz</strong><br>
key account manager w <a href="https://artnapi.pl" style="color: #1a73e8; text-decoration: none;">artnapi.pl</a><br>
<a href="mailto:mateusz.sokolski@artnapi.pl" style="color: #1a73e8; text-decoration: none;">mateusz.sokolski@artnapi.pl</a> | <a href="tel:+48534852707" style="color: #1a73e8; text-decoration: none;">+48 534 852 707</a>
</p>`;

export const HTML_SIGNATURE_EN = `<p style="margin-top: 16px; line-height: 1.6;">
<strong>Mateusz Sokólski</strong><br>
Key Account Manager at <a href="https://artnapi.pl" style="color: #1a73e8; text-decoration: none;">artnapi.pl</a><br>
<a href="mailto:mateusz.sokolski@artnapi.pl" style="color: #1a73e8; text-decoration: none;">mateusz.sokolski@artnapi.pl</a> | <a href="tel:+48534852707" style="color: #1a73e8; text-decoration: none;">+48 534 852 707</a>
</p>`;

/**
 * Wraps HTML email body content with consistent styling and the appropriate signature.
 * @param {string} bodyContent - HTML body content (paragraphs, lists, etc.)
 * @param {boolean} isEnglish - Use English signature if true, Polish otherwise
 * @returns {string} Complete HTML email with signature
 */
export function wrapEmailHTML(bodyContent, isEnglish = false) {
  // Strip markdown code fences if Claude wrapped the response in ```html ... ```
  const cleaned = bodyContent.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/g, '');
  const signature = isEnglish ? HTML_SIGNATURE_EN : HTML_SIGNATURE_PL;
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
${cleaned}
${signature}
</div>`;
}

export async function gmailCreateDraft(accessToken, to, subject, body, replyToMessageId = null, { html = false } = {}) {
  // Build RFC 2822 MIME message
  const contentType = html ? 'text/html' : 'text/plain';
  const lines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `Content-Type: ${contentType}; charset="UTF-8"`,
    'Content-Transfer-Encoding: base64',
    'MIME-Version: 1.0',
    '',
    Buffer.from(body).toString('base64')
  ];
  const raw = Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const draftBody = { message: { raw } };
  if (replyToMessageId) draftBody.message.threadId = replyToMessageId;

  const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(draftBody)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail draft create ${res.status}: ${text}`);
  }
  return res.json();
}

export function extractEmail(headerValue) {
  const match = headerValue.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : headerValue.toLowerCase().trim();
}

export function extractName(headerValue) {
  const match = headerValue.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : headerValue.split('@')[0];
}

// --- Notion CRM update helpers ---

export async function updateNotionPage(pageId, properties) {
  return notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: { properties }
  });
}

export function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

// Format date as YYYY-MM-DD using LOCAL timezone (not UTC)
export function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function updateCRMDue(pageId, newDueDate) {
  return updateNotionPage(pageId, {
    'Due': { date: { start: newDueDate } }
  });
}

export async function updateCRMLastContact(pageId, contactDate) {
  return updateNotionPage(pageId, {
    'ostatni kontakt': { date: { start: contactDate } }
  });
}

export async function appendCRMNote(pageId, noteText, existingNotes = '') {
  const stamp = toLocalISO(new Date());
  const prefix = `[${stamp}] ${noteText}`;
  const updated = existingNotes ? `${prefix}\n${existingNotes}` : prefix;
  if (updated.length > 2000) {
    console.warn(`[LIB] Note truncated for page ${pageId}: ${updated.length} → 2000 chars`);
  }
  return updateNotionPage(pageId, {
    'notatki': { rich_text: [{ text: { content: updated.slice(0, 2000) } }] }
  });
}
