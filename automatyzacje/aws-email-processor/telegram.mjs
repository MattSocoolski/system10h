// telegram.mjs — Telegram alert sender (ported from lib.js)
// Uses native fetch (Node 20+). No external dependencies.

const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1304598782';

/**
 * Send a Telegram message via Bot API.
 * @param {object} secrets — must contain TELEGRAM_BOT_TOKEN
 * @param {string} text — message (HTML parse_mode, max 4096 chars)
 */
export async function sendTelegram(secrets, text) {
  const token = secrets.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN missing from secrets');
    return;
  }

  // Telegram hard limit: 4096 characters
  const truncated = text.length > 4000
    ? text.slice(0, 4000) + '\n...(skrócono)'
    : text;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: truncated,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] API error:', JSON.stringify(data));
    }
    return data;
  } catch (err) {
    // Telegram failure should NEVER crash the Lambda — log and continue
    console.error('[Telegram] Network error:', err.message);
  }
}
