// gmail.mjs — Gmail API functions (ported from lib.js)
// Uses native fetch (Node 20+). OAuth refresh via Secrets Manager credentials.

/**
 * Exchange a refresh token for a fresh access token.
 * Retries up to 3 times on network errors (Lambda cold-start DNS can be slow).
 */
export async function gmailGetAccessToken(secrets) {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = secrets;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error('Gmail OAuth credentials missing from Secrets Manager');
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GMAIL_CLIENT_ID,
          client_secret: GMAIL_CLIENT_SECRET,
          refresh_token: GMAIL_REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }).toString(),
      });

      const data = await res.json();

      if (data.error) {
        // Distinguish auth failure (permanent) from transient errors
        if (data.error === 'invalid_grant') {
          throw new Error(`GMAIL_AUTH_PERMANENT: Refresh token revoked or expired. Re-run gmail-auth.js on Mac. Detail: ${data.error_description || ''}`);
        }
        throw new Error(`Gmail token refresh failed: ${data.error} — ${data.error_description || ''}`);
      }

      return data.access_token;
    } catch (err) {
      const isNetwork = err.message === 'fetch failed' ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('ETIMEDOUT');

      if (isNetwork && attempt < MAX_RETRIES) {
        console.log(`[Gmail OAuth] Network error attempt ${attempt}/${MAX_RETRIES}, retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Low-level Gmail API GET helper.
 */
async function gmailFetch(accessToken, endpoint, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://www.googleapis.com/gmail/v1/users/me/${endpoint}${qs ? '?' + qs : ''}`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw new Error('GMAIL_AUTH_FAILED: Access token expired or revoked (401).');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Search Gmail messages matching a query string.
 * Returns array of { id, threadId } stubs.
 */
export async function gmailSearchMessages(accessToken, query, maxResults = 10) {
  const data = await gmailFetch(accessToken, 'messages', {
    q: query,
    maxResults: String(maxResults),
  });
  return data.messages || [];
}

/**
 * Get a single message with parsed headers.
 * @param {string} format — 'metadata' (headers only) or 'full' (with body)
 */
export async function gmailGetMessage(accessToken, messageId, format = 'metadata') {
  const qs = new URLSearchParams();
  qs.append('format', format);
  qs.append('metadataHeaders', 'From');
  qs.append('metadataHeaders', 'To');
  qs.append('metadataHeaders', 'Subject');
  qs.append('metadataHeaders', 'Date');

  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?${qs.toString()}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw new Error('GMAIL_AUTH_FAILED: Access token expired or revoked (401).');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API ${res.status}: ${text}`);
  }

  const data = await res.json();
  const headers = {};
  for (const h of (data.payload?.headers || [])) {
    headers[h.name.toLowerCase()] = h.value;
  }

  // Extract plain text body from the message payload
  let bodyText = '';
  if (format === 'full' && data.payload) {
    bodyText = extractBodyText(data.payload);
  }

  return {
    id: data.id,
    threadId: data.threadId,
    from: headers.from || '',
    to: headers.to || '',
    subject: headers.subject || '',
    date: headers.date || '',
    snippet: data.snippet || '',
    labels: data.labelIds || [],
    bodyText,
  };
}

/**
 * Recursively extract plain text body from a Gmail message payload.
 */
function extractBodyText(payload) {
  // Direct body (simple messages)
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
  }

  // Multipart — recurse into parts, prefer text/plain
  if (payload.parts) {
    // First pass: look for text/plain
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64url').toString('utf-8');
      }
    }
    // Second pass: recurse into nested multipart
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith('multipart/') && part.parts) {
        const text = extractBodyText(part);
        if (text) return text;
      }
    }
    // Fallback: try text/html, strip tags
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64url').toString('utf-8');
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  return '';
}

/**
 * Get all messages in a thread (for context in draft generation).
 * Returns array of simplified message objects, oldest first.
 */
export async function getThreadMessages(accessToken, threadId) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    // Non-critical — return empty if thread fetch fails
    console.warn(`[Gmail] Failed to fetch thread ${threadId}: ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.messages || []).map(msg => {
    const headers = {};
    for (const h of (msg.payload?.headers || [])) {
      headers[h.name.toLowerCase()] = h.value;
    }
    return {
      id: msg.id,
      from: headers.from || '',
      subject: headers.subject || '',
      date: headers.date || '',
      snippet: msg.snippet || '',
    };
  });
}

/**
 * List existing Gmail drafts (for race condition check — Edge Case 1).
 */
export async function gmailListDrafts(accessToken, maxResults = 20) {
  const data = await gmailFetch(accessToken, 'drafts', { maxResults: String(maxResults) });
  return data.drafts || [];
}

/**
 * Get draft details including threadId.
 */
export async function gmailGetDraft(accessToken, draftId) {
  const data = await gmailFetch(accessToken, `drafts/${draftId}`, { format: 'metadata' });
  return {
    id: data.id,
    threadId: data.message?.threadId || '',
    subject: '',
  };
}

/**
 * Create a Gmail draft (reply-in-thread if threadId provided).
 * NEVER calls messages/send — drafts ONLY.
 */
export async function gmailCreateDraft(accessToken, to, subject, body, threadId = null, { html = false } = {}) {
  const contentType = html ? 'text/html' : 'text/plain';
  const lines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `Content-Type: ${contentType}; charset="UTF-8"`,
    'Content-Transfer-Encoding: base64',
    'MIME-Version: 1.0',
    '',
    Buffer.from(body).toString('base64'),
  ];
  const raw = Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const draftBody = { message: { raw } };
  if (threadId) draftBody.message.threadId = threadId;

  const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draftBody),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail draft create ${res.status}: ${text}`);
  }
  return res.json();
}
