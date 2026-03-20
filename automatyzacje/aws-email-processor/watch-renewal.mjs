// watch-renewal.mjs — Gmail Watch Renewal Lambda
// Renews Gmail push notification subscription (users.watch).
// Triggered by EventBridge every 6 days (watch expires after 7).
// Node.js 20 ESM — no external dependencies beyond AWS SDK.

import { getSecrets } from './secrets.mjs';
import { gmailGetAccessToken } from './gmail.mjs';
import { sendTelegram } from './telegram.mjs';

const PUBSUB_TOPIC = process.env.GMAIL_PUBSUB_TOPIC;

export async function handler(event) {
  console.log('[WatchRenewal] Starting Gmail watch renewal...');

  if (!PUBSUB_TOPIC) {
    const err = 'GMAIL_PUBSUB_TOPIC env var is not set';
    console.error(`[WatchRenewal] ${err}`);
    throw new Error(err);
  }

  let secrets;
  try {
    secrets = await getSecrets();
  } catch (err) {
    console.error('[WatchRenewal] Failed to load secrets:', err.message);
    throw err;
  }

  let accessToken;
  try {
    accessToken = await gmailGetAccessToken(secrets);
  } catch (err) {
    console.error('[WatchRenewal] OAuth token refresh failed:', err.message);
    await sendTelegram(secrets, `⚠️ <b>Gmail Watch FAILED</b>\nOAuth token refresh error:\n<code>${err.message}</code>`);
    throw err;
  }

  try {
    const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicName: PUBSUB_TOPIC,
        labelIds: ['INBOX'],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gmail watch API ${res.status}: ${text}`);
    }

    const data = await res.json();
    const expirationMs = Number(data.expiration);
    const expiryDate = new Date(expirationMs).toISOString();

    console.log(`[WatchRenewal] Success — historyId: ${data.historyId}, expiration: ${expiryDate}`);

    await sendTelegram(
      secrets,
      `✅ <b>Gmail Watch renewed</b>\nExpiry: ${expiryDate}\nHistoryId: ${data.historyId}\nTopic: <code>${PUBSUB_TOPIC}</code>`,
    );

    return {
      statusCode: 200,
      body: { historyId: data.historyId, expiration: expiryDate },
    };
  } catch (err) {
    console.error('[WatchRenewal] Watch call failed:', err.message);
    await sendTelegram(
      secrets,
      `⚠️ <b>Gmail Watch FAILED</b>\n<code>${err.message}</code>`,
    );
    throw err;
  }
}
