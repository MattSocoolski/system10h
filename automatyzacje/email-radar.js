#!/usr/bin/env node
// EMAIL RADAR — Auto-draft pipeline for ArtNapi
// Runs every 30 min (8:00-18:00, Mon-Fri) via LaunchAgent
//
// Flow:
// 1. Check Gmail for new emails (last 1h, overlap for safety)
// 2. Cross-reference sender with Notion CRM
// 3. CRM lead → Claude API generates draft response (ghost style)
// 4. Draft created in Gmail → Telegram alert
// 5. Non-CRM email → Telegram info alert only
//
// Requires: ANTHROPIC_API_KEY, GMAIL_*, NOTION_API_KEY, TELEGRAM_BOT_TOKEN

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadEnv, gmailGetAccessToken, gmailSearchMessages, gmailGetMessage,
  gmailCreateDraft, queryCRM, parseNotionLead, sendTelegram,
  loadState, saveState, extractEmail, extractName, escapeHtml
} from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

loadEnv();

// --- Config ---
const BUSINESS_HOURS_START = 8;
const BUSINESS_HOURS_END = 18;
const MAX_EMAILS_PER_SCAN = 10;
const MY_EMAIL = 'mateusz.sokolski@artnapi.pl';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// --- Claude API ---
async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// --- Get full email body ---
async function getEmailBody(accessToken, messageId) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) return null;
  const data = await res.json();

  function extractBody(payload) {
    if (payload.body && payload.body.data) {
      return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }
    if (payload.parts) {
      for (const p of payload.parts) {
        if (p.mimeType === 'text/plain' && p.body && p.body.data) {
          return Buffer.from(p.body.data, 'base64url').toString('utf-8');
        }
        const nested = extractBody(p);
        if (nested) return nested;
      }
    }
    return null;
  }

  const body = extractBody(data.payload);
  // Trim to 2000 chars to control token cost
  return body ? body.slice(0, 2000) : null;
}

// --- Main ---
async function run() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun, 6=Sat

  // Business hours guard
  if (day === 0 || day === 6 || hour < BUSINESS_HOURS_START || hour >= BUSINESS_HOURS_END) {
    console.log(`[${now.toISOString()}] Outside business hours. Skipping.`);
    return;
  }

  console.log(`[${now.toISOString()}] Email Radar starting...`);

  // Load state
  const state = loadState('email-radar') || { lastScan: null, processedIds: [] };

  // Gmail: new emails in last 1h (overlap for safety)
  const token = await gmailGetAccessToken();
  const query = `to:${MY_EMAIL} is:inbox newer_than:1h -from:${MY_EMAIL} -category:promotions -category:social -category:updates`;
  const messages = await gmailSearchMessages(token, query, MAX_EMAILS_PER_SCAN);

  if (messages.length === 0) {
    console.log('No new emails.');
    state.lastScan = now.toISOString();
    saveState('email-radar', state);
    return;
  }

  console.log(`Found ${messages.length} emails to check.`);

  // Fetch CRM leads
  const crmResults = await queryCRM({});
  const crmLeads = crmResults.map(parseNotionLead);

  // Build email→lead lookup
  const emailToLead = {};
  for (const lead of crmLeads) {
    if (lead.email) emailToLead[lead.email.toLowerCase()] = lead;
  }

  // Load ghost style context (B2B section only — token efficient)
  const ghostStyl = readFileSync(join(ROOT, 'dane', 'ghost_styl.md'), 'utf-8');
  const b2bMatch = ghostStyl.match(/## B2B SPRZEDAŻ[\s\S]*?(?=\n## [A-Z]|$)/);
  const b2bContext = b2bMatch ? b2bMatch[0] : '';

  // Load condensed oferta (pricing tables only)
  const oferta = readFileSync(join(ROOT, 'dane', 'artnapi', 'oferta.md'), 'utf-8');
  const ofertaCondensed = oferta.slice(0, 2500);

  let processed = 0;
  let draftsCreated = 0;
  const alerts = [];

  for (const msg of messages) {
    if (state.processedIds.includes(msg.id)) continue;

    const detail = await gmailGetMessage(token, msg.id);
    const senderEmail = extractEmail(detail.from);
    const senderName = extractName(detail.from);

    // Skip self
    if (senderEmail === MY_EMAIL) {
      state.processedIds.push(msg.id);
      continue;
    }

    const lead = emailToLead[senderEmail];

    if (lead) {
      // === CRM LEAD — generate draft ===
      console.log(`CRM Lead: ${lead.name} (${lead.status})`);

      try {
        // Get full body for better draft
        const emailBody = await getEmailBody(token, msg.id);
        const emailContent = emailBody || detail.snippet;

        const systemPrompt = `Jesteś ghostwriterem Mateusza Sokólskiego, key account managera w artnapi.pl.
Piszesz odpowiedzi na maile B2B w jego stylu — ciepło, bezpośrednio, partnersko.

STYL:
${b2bContext}

OFERTA (skrót):
${ofertaCondensed}

LEAD:
• Nazwa: ${lead.name}
• Firma: ${lead.company || 'brak'}
• Status: ${lead.status}
• Priorytet: ${lead.priority || 'brak'}
• Segment: ${lead.segment || 'brak'}
• Wartość: ${lead.value ? lead.value + ' PLN' : 'nieznana'}
• Ostatni kontakt: ${lead.lastContact ? lead.lastContact.toISOString().split('T')[0] : 'brak'}
• Notatki: ${lead.notes || 'brak'}

ZASADY:
• Max 5-7 zdań
• Używaj "•" zamiast "-" w listach
• Ton: ciepły, bezpośredni, Good Cop — NIGDY nie ciśnij
• NIGDY nie wymyślaj cen — bierz z oferty lub "sprawdzę i wrócę z wyceną"
• Zamknięcie: proaktywne, oferuj następny krok
• Kończ: Pozdrawiam serdecznie,\\n\\nSokólski Mateusz\\nkey account manager w artnapi.pl\\nmail: mateusz.sokolski@artnapi.pl\\ntelefon: +48 534 852 707
• Pisz TYLKO treść maila (bez nagłówków To:/Subject:)`;

        const userPrompt = `Napisz odpowiedź na tego maila:

Od: ${detail.from}
Temat: ${detail.subject}
Data: ${detail.date}

Treść:
${emailContent}

Odpowiedz w stylu Mateusza. Krótko, konkretnie, ciepło.`;

        const draftBody = await callClaude(systemPrompt, userPrompt);

        // Create Gmail draft as reply
        await gmailCreateDraft(
          token,
          senderEmail,
          `Re: ${detail.subject.replace(/^Re:\s*/i, '')}`,
          draftBody,
          detail.threadId
        );
        draftsCreated++;

        alerts.push(
          `✉️ <b>DRAFT: ${escapeHtml(lead.name)}</b> (${escapeHtml(lead.status)}${lead.value ? ', ' + lead.value + ' PLN' : ''})\n` +
          `→ "${escapeHtml(detail.subject.slice(0, 60))}"\n` +
          `→ Draft w Gmail — sprawdź i wyślij`
        );
      } catch (err) {
        console.error(`Draft error for ${lead.name}: ${err.message}`);
        alerts.push(
          `⚠️ <b>${escapeHtml(lead.name)}</b> — nowy mail, draft FAILED\n` +
          `→ "${escapeHtml(detail.subject.slice(0, 60))}"\n` +
          `→ Error: ${escapeHtml(err.message.slice(0, 80))}`
        );
      }
    } else {
      // === Not in CRM — info alert only ===
      alerts.push(
        `📩 <b>Spoza CRM:</b> ${escapeHtml(senderName)}\n` +
        `→ "${escapeHtml(detail.subject.slice(0, 60))}"\n` +
        `→ ${escapeHtml(detail.snippet.slice(0, 100))}`
      );
    }

    state.processedIds.push(msg.id);
    processed++;
  }

  // Trim processedIds (keep last 500)
  if (state.processedIds.length > 500) {
    state.processedIds = state.processedIds.slice(-500);
  }

  // Save state
  state.lastScan = now.toISOString();
  saveState('email-radar', state);

  // Telegram summary
  if (alerts.length > 0) {
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const header = `🔔 <b>EMAIL RADAR</b> (${time})\n${processed} nowych | ${draftsCreated} draftów\n\n`;
    await sendTelegram(header + alerts.join('\n\n'));
  }

  console.log(`Done: ${processed} processed, ${draftsCreated} drafts created.`);
}

run().catch(err => {
  console.error('RADAR ERROR:', err.message);
  sendTelegram(`🚨 <b>EMAIL RADAR ERROR</b>\n${escapeHtml(err.message)}`).catch(() => {});
  process.exit(1);
});
