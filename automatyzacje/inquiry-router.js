#!/usr/bin/env node
// INQUIRY ROUTER — Auto-draft for B2B Calculator inquiries
// Detects structured emails from artnapi.pl/B2B-Price-Calculator
// Parses product/qty/price → Claude generates targeted response → Gmail draft
// Cron: */15 8-18 * * 1-5

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadEnv, sendTelegram, queryCRM, parseNotionLead,
  gmailGetAccessToken, gmailSearchMessages, gmailGetMessage, gmailCreateDraft,
  loadState, saveState, extractEmail, extractName, escapeHtml,
  wrapEmailHTML
} from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

loadEnv();

const MY_EMAIL = 'mateusz.sokolski@artnapi.pl';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_INQUIRIES_PER_RUN = 5;

// --- Detect calculator inquiry by subject ---
function isCalculatorInquiry(subject) {
  return /^(Zapytanie|Inquiry):\s/.test(subject);
}

// --- Parse structured body from calculator mailto ---
function parseInquiryBody(body, lang) {
  const result = { product: null, quantity: null, price: null, currency: null, delivery: null };

  if (lang === 'pl') {
    const prodMatch = body.match(/Produkt:\s*(.+)/);
    const qtyMatch = body.match(/Ilość:\s*(.+)/);
    const priceMatch = body.match(/Cena z kalkulatora:\s*([\d.,]+)\s*(\w+)\/szt/);
    if (prodMatch) result.product = prodMatch[1].trim();
    if (qtyMatch) result.quantity = qtyMatch[1].trim();
    if (priceMatch) { result.price = priceMatch[1]; result.currency = priceMatch[2]; }
  } else {
    const prodMatch = body.match(/Product:\s*(.+)/);
    const qtyMatch = body.match(/Quantity:\s*(.+)/);
    const priceMatch = body.match(/Calculator price:\s*€?([\d.,]+)\/pc/);
    const delivMatch = body.match(/Delivery to:\s*(.+)/);
    if (prodMatch) result.product = prodMatch[1].trim();
    if (qtyMatch) result.quantity = qtyMatch[1].trim();
    if (priceMatch) { result.price = priceMatch[1]; result.currency = 'EUR'; }
    if (delivMatch) result.delivery = delivMatch[1].trim();
  }

  return result;
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

  return extractBody(data.payload);
}

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

// --- Main ---
async function run() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (day === 0 || day === 6 || hour < 8 || hour >= 18) {
    console.log(`[INQ-ROUTER] Outside business hours. Skipping.`);
    return;
  }

  console.log(`[INQ-ROUTER] Started at ${now.toISOString()}`);

  // Load own state + email-radar state (to prevent duplicates)
  const state = loadState('inquiry-router') || { lastScan: null, processedIds: [] };
  const radarState = loadState('email-radar') || { processedIds: [] };

  const token = await gmailGetAccessToken();

  // Search for calculator inquiries (PL + EN)
  const query = `to:${MY_EMAIL} is:inbox newer_than:2h -from:${MY_EMAIL} (subject:Zapytanie OR subject:Inquiry)`;
  const messages = await gmailSearchMessages(token, query, MAX_INQUIRIES_PER_RUN);

  if (messages.length === 0) {
    console.log('[INQ-ROUTER] No calculator inquiries.');
    state.lastScan = now.toISOString();
    saveState('inquiry-router', state);
    return;
  }

  // Fetch CRM leads for cross-reference
  const crmResults = await queryCRM({});
  const crmLeads = crmResults.map(parseNotionLead);
  const emailToLead = {};
  for (const lead of crmLeads) {
    if (lead.email) emailToLead[lead.email.toLowerCase()] = lead;
  }

  // Load ghost style (B2B PL + EN)
  const ghostStyl = readFileSync(join(ROOT, 'dane', 'ghost_styl.md'), 'utf-8');
  const b2bMatch = ghostStyl.match(/## B2B SPRZEDAŻ[\s\S]*?(?=\n## WSPÓLNE|$)/);
  const b2bContext = b2bMatch ? b2bMatch[0] : '';

  const oferta = readFileSync(join(ROOT, 'dane', 'artnapi', 'oferta.md'), 'utf-8');
  const ofertaCondensed = oferta.slice(0, 2500);

  let processed = 0;
  let draftsCreated = 0;
  const alerts = [];

  for (const msg of messages) {
    // Skip if already processed by either router or radar
    if (state.processedIds.includes(msg.id) || radarState.processedIds.includes(msg.id)) continue;

    const detail = await gmailGetMessage(token, msg.id);

    // Verify it's a calculator inquiry
    if (!isCalculatorInquiry(detail.subject)) {
      state.processedIds.push(msg.id);
      continue;
    }

    const senderEmail = extractEmail(detail.from);
    const senderName = extractName(detail.from);
    if (senderEmail === MY_EMAIL) { state.processedIds.push(msg.id); continue; }

    // Detect language from subject
    const lang = detail.subject.startsWith('Zapytanie:') ? 'pl' : 'en';

    // Get body and parse structured data
    const emailBody = await getEmailBody(token, msg.id);
    const inquiry = parseInquiryBody(emailBody || '', lang);
    const lead = emailToLead[senderEmail];

    console.log(`[INQ-ROUTER] Calculator inquiry from ${senderName} (${senderEmail}): ${inquiry.product || 'unknown'} x ${inquiry.quantity || '?'}`);

    try {
      const leadContext = lead ? [
        `LEAD W CRM: TAK`,
        `Nazwa: ${lead.name}`,
        `Firma: ${lead.company || 'brak'}`,
        `Status: ${lead.status}`,
        `Segment: ${lead.segment || 'brak'}`,
        `Wartość: ${lead.value ? lead.value + ' PLN' : 'nieznana'}`,
        `Notatki: ${lead.notes || 'brak'}`
      ].join('\n') : `LEAD W CRM: NIE — nowy kontakt, ${senderName} (${senderEmail})`;

      const systemPrompt = lang === 'pl'
        ? `Jesteś ghostwriterem Mateusza Sokólskiego, key account managera w artnapi.pl.
Odpowiadasz na zapytanie ofertowe z kalkulatora B2B na stronie.

FORMAT: Pisz w HTML. Używaj <p> dla akapitów, <strong> dla pogrubień, <ul><li> dla list. NIE dodawaj tagów <html>/<body> — tylko wewnętrzną treść. NIE dodawaj stopki/podpisu — zostanie dodana automatycznie.

STYL:
${b2bContext}

OFERTA (skrót):
${ofertaCondensed}

ZASADY:
• Klient użył kalkulatora — wie o cenach. Potwierdź cenę, nie powtarzaj kalkulatora.
• Max 5-7 zdań
• Ton: ciepły, bezpośredni, Good Cop
• Potwierdź produkt, ilość i cenę z zapytania
• Zaproponuj darmową próbkę (2 szt 40x50) jeśli nowy klient
• Podaj dostępność (24h wysyłka z PL)
• Zamknięcie: proaktywne, oferuj następny krok (próbka / zamówienie testowe)
• NIE dodawaj stopki/podpisu na końcu — jest dodawana automatycznie
• Pisz TYLKO treść maila w HTML (bez nagłówków, bez podpisu)`
        : `You are a ghostwriter for Mateusz Sokolski, key account manager at artnapi.pl.
You're replying to a B2B calculator inquiry from the website.

FORMAT: Write in HTML. Use <p> for paragraphs, <strong> for emphasis, <ul><li> for lists. Do NOT add <html>/<body> tags — only the inner content. Do NOT include a signature — it will be added automatically.

STYLE:
${b2bContext}

OFFER (summary):
${ofertaCondensed}

RULES:
• The client used the calculator — they know the prices. Confirm, don't repeat the calculator.
• Max 5-7 sentences
• Tone: warm, direct, Good Cop
• Confirm the product, quantity and price from their inquiry
• Offer free samples (2 pcs 40x50) if new client
• Mention availability (24h shipping from PL warehouse)
• Close: proactive, offer next step (sample / test order)
• Do NOT add a signature at the end — it is appended automatically
• Write ONLY the email body in HTML (no headers, no signature)`;

      const userPrompt = lang === 'pl'
        ? `Odpowiedz na to zapytanie z kalkulatora B2B:

Od: ${detail.from}
Temat: ${detail.subject}

ZAPYTANIE:
Produkt: ${inquiry.product || 'nieznany'}
Ilość: ${inquiry.quantity || 'nieznana'}
Cena z kalkulatora: ${inquiry.price || 'nieznana'} ${inquiry.currency || 'PLN'}/szt.

${leadContext}

Napisz krótką, ciepłą odpowiedź potwierdzającą zapytanie.`
        : `Reply to this B2B calculator inquiry:

From: ${detail.from}
Subject: ${detail.subject}

INQUIRY:
Product: ${inquiry.product || 'unknown'}
Quantity: ${inquiry.quantity || 'unknown'}
Calculator price: ${inquiry.price || 'unknown'} ${inquiry.currency || 'EUR'}/pc
Delivery to: ${inquiry.delivery || 'unknown'}

${leadContext}

Write a short, warm reply confirming the inquiry.`;

      const draftBodyRaw = await callClaude(systemPrompt, userPrompt);
      const isEN = lang === 'en';
      const draftBody = wrapEmailHTML(draftBodyRaw, isEN);
      const reSubject = `Re: ${detail.subject.replace(/^Re:\s*/i, '')}`;

      await gmailCreateDraft(token, senderEmail, reSubject, draftBody, detail.threadId, { html: true });
      draftsCreated++;

      const icon = lead ? '🔥' : '🆕';
      const crmStatus = lead ? `CRM: ${lead.status}` : 'NOWY — nie ma w CRM';
      alerts.push(
        `${icon} <b>${escapeHtml(inquiry.product || detail.subject)}</b>\n` +
        `→ ${escapeHtml(senderName)} (${escapeHtml(senderEmail)})\n` +
        `→ ${inquiry.quantity || '?'} szt @ ${inquiry.price || '?'} ${inquiry.currency || ''}\n` +
        `→ ${crmStatus}\n` +
        `→ Draft w Gmail — sprawdź i wyślij`
      );
    } catch (err) {
      console.error(`[INQ-ROUTER] Error for ${senderName}: ${err.message}`);
      alerts.push(
        `⚠️ <b>${escapeHtml(senderName)}</b> — inquiry, draft FAILED\n` +
        `→ ${escapeHtml(err.message.slice(0, 80))}`
      );
    }

    state.processedIds.push(msg.id);
    // Also mark in email-radar state so it skips this message
    if (!radarState.processedIds.includes(msg.id)) {
      radarState.processedIds.push(msg.id);
    }
    processed++;
  }

  // Trim state
  if (state.processedIds.length > 200) state.processedIds = state.processedIds.slice(-200);
  if (radarState.processedIds.length > 500) radarState.processedIds = radarState.processedIds.slice(-500);

  state.lastScan = now.toISOString();
  saveState('inquiry-router', state);
  saveState('email-radar', radarState);

  // Telegram
  if (alerts.length > 0) {
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const header = `📊 <b>KALKULATOR INQUIRY</b> (${time})\n${processed} zapytań | ${draftsCreated} draftów\n\n`;
    await sendTelegram(header + alerts.join('\n\n'));
  }

  console.log(`[INQ-ROUTER] Done: ${processed} inquiries, ${draftsCreated} drafts.`);
}

run().catch(err => {
  console.error('[INQ-ROUTER] ERROR:', err.message);
  sendTelegram(`<b>INQ-ROUTER ERROR</b>\n${escapeHtml(err.message)}`).catch(() => {});
  process.exit(1);
});
