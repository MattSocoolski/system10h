#!/usr/bin/env node
// #1 SPEED-TO-LEAD ALERT
// Sprawdza MailerLite co 5 min → nowy subscriber → Telegram push
// Uruchomienie: node speed-to-lead.js
// Cron: */5 * * * * cd /Users/mateuszsokolski/asystent && node automatyzacje/speed-to-lead.js

import { loadEnv, mlFetch, sendTelegram, loadState, saveState } from './lib.js';

loadEnv();

async function run() {
  // Fetch recent subscribers (last 20, sorted by newest)
  const { data: subscribers } = await mlFetch('/subscribers?filter[status]=active&sort=-created_at&limit=20');

  if (!subscribers || subscribers.length === 0) {
    console.log('[STL] No subscribers found');
    return;
  }

  // Load last known state
  const state = loadState('subscribers') || { knownIds: [], lastCheck: null };
  const knownSet = new Set(state.knownIds);

  // Find NEW subscribers (not in last known state)
  const newSubs = subscribers.filter(s => !knownSet.has(s.id));

  if (newSubs.length === 0) {
    console.log(`[STL] ${new Date().toISOString()} — No new subscribers (${subscribers.length} total)`);
  } else {
    for (const sub of newSubs) {
      const name = [sub.fields?.name, sub.fields?.last_name].filter(Boolean).join(' ') || 'Nieznane';
      const email = sub.email;
      const source = sub.source || 'unknown';
      const groups = (sub.groups || []).map(g => g.name).join(', ') || 'brak grupy';
      const subscribedAt = sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleString('pl-PL') : 'teraz';

      const message = [
        '🔥 <b>NOWY LEAD — SPEED-TO-LEAD</b>',
        '',
        `👤 <b>${escapeHtml(name)}</b>`,
        `📧 ${escapeHtml(email)}`,
        `📂 Grupy: ${escapeHtml(groups)}`,
        `📍 Źródło: ${escapeHtml(source)}`,
        `🕐 Zapisał się: ${subscribedAt}`,
        '',
        '⚡ <b>REAGUJ TERAZ — lead jest gorący!</b>',
        '',
        '→ Sprawdź czy zrobił Self-Discovery',
        '→ Wyślij DM / mail w ciągu 5 min',
        '→ Wpisz @pipeline dla nudge draftu'
      ].join('\n');

      await sendTelegram(message);
      console.log(`[STL] 🔥 NEW: ${name} (${email})`);
    }
  }

  // Save updated state (all current subscriber IDs)
  saveState('subscribers', {
    knownIds: subscribers.map(s => s.id),
    lastCheck: new Date().toISOString(),
    count: subscribers.length
  });
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

run().catch(err => {
  console.error('[STL] ERROR:', err.message);
  process.exit(1);
});
