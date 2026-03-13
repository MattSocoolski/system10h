#!/usr/bin/env node
// EMAIL RADAR — Alert-only pipeline for ArtNapi
// Runs every 30 min (8:00-18:00, Mon-Fri) via LaunchAgent
//
// Flow:
// 1. Check Gmail for new emails (last 1h, overlap for safety)
// 2. Cross-reference sender with Notion CRM
// 3. CRM lead → Telegram alert with lead context
// 4. Non-CRM email → Telegram info alert
// 5. Drafts are created in @ceo session (Claude Code, full @ghost context)
//
// Requires: GMAIL_*, NOTION_API_KEY, TELEGRAM_BOT_TOKEN

import {
  loadEnv, gmailGetAccessToken, gmailSearchMessages, gmailGetMessage,
  queryCRM, parseNotionLead, sendTelegram,
  loadState, saveState, extractEmail, extractName, escapeHtml
} from './lib.js';

loadEnv();

// --- Config ---
const BUSINESS_HOURS_START = 8;
const BUSINESS_HOURS_END = 18;
const MAX_EMAILS_PER_SCAN = 10;
const MY_EMAIL = 'mateusz.sokolski@artnapi.pl';

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

  let processed = 0;
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
      // === CRM LEAD — alert with context ===
      const daysAgo = lead.lastContact
        ? Math.floor((now - lead.lastContact) / (1000 * 60 * 60 * 24))
        : null;
      const lastContactStr = daysAgo !== null ? `${daysAgo}d temu` : 'brak';

      alerts.push(
        `✉️ <b>CRM: ${escapeHtml(lead.name)}</b> (${escapeHtml(lead.status)}${lead.value ? ', ' + lead.value + ' PLN' : ''})\n` +
        `→ "${escapeHtml(detail.subject.slice(0, 80))}"\n` +
        `→ ${escapeHtml(detail.snippet.slice(0, 150))}\n` +
        `→ Ostatni kontakt: ${lastContactStr} | Segment: ${escapeHtml(lead.segment || '—')}`
      );
    } else {
      // === Not in CRM — info alert ===
      alerts.push(
        `📩 <b>Spoza CRM:</b> ${escapeHtml(senderName)}\n` +
        `→ "${escapeHtml(detail.subject.slice(0, 80))}"\n` +
        `→ ${escapeHtml(detail.snippet.slice(0, 150))}`
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
    const header = `🔔 <b>EMAIL RADAR</b> (${time})\n${processed} nowych\n\n`;
    await sendTelegram(header + alerts.join('\n\n'));
  }

  console.log(`Done: ${processed} processed.`);
}

run().catch(err => {
  console.error('RADAR ERROR:', err.message);
  sendTelegram(`🚨 <b>EMAIL RADAR ERROR</b>\n${escapeHtml(err.message)}`).catch(() => {});
  process.exit(1);
});
