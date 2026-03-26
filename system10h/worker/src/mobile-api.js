// mobile-api.js — Hono.js BFF routes for System 10h+ mobile app
//
// SETUP:
//   cd system10h/worker
//   npm install hono
//
// INTEGRATION (add to index.js after review):
//   import { mobileApp } from './mobile-api.js';
//
//   // In the main export default { fetch() { ... } }:
//   // Before existing routes, add:
//   if (url.pathname.startsWith('/api/mobile/')) {
//     return mobileApp.fetch(request, env, ctx);
//   }
//
// SECRETS REQUIRED (wrangler secret put):
//   - MOBILE_SECRET_KEY    (openssl rand -hex 32)
//   - JWT_SECRET           (openssl rand -hex 32)
//   - NOTION_API_KEY       (Notion Internal Integration Secret)
//   - GMAIL_CLIENT_ID      (Google Cloud OAuth2 Client ID)
//   - GMAIL_CLIENT_SECRET  (Google Cloud OAuth2 Client Secret)
//   - GMAIL_REFRESH_TOKEN  (Offline refresh token for mateusz@system10h.com)
//
// CRON TRIGGER (add to wrangler.toml):
//   [triggers]
//   crons = ["*/5 * * * *"]
//
//   Then wire scheduled() from notion-cache.js in the main export.

import { Hono } from 'hono';
import {
  generateToken,
  timingSafeEqual,
  authMiddleware,
  rateLimitMiddleware,
  checkAuthRateLimit,
  incrementAuthRateLimit,
  checkRateLimit,
} from './auth.js';
import {
  getDashboardFromCache,
  getLeadsFromCache,
  getLeadById,
  updateLead,
  invalidateLeadCaches,
  isValidNotionPageId,
  VALID_STATUSES,
} from './notion-cache.js';
import {
  listDrafts,
  getDraft,
  sendDraft,
  trashDraft,
  updateDraft,
  getDraftCount,
  GmailError,
} from './gmail.js';

// ─── HONO APP ───────────────────────────────────────────

const app = new Hono({ strict: false });

// ─── CORS FOR MOBILE ────────────────────────────────────
// Origin whitelist: allows our web app, localhost dev, and native mobile (no Origin header).
// JWT auth protects these routes as primary access control.

const ALLOWED_ORIGINS = [
  'https://mobile.hajlajf-art.workers.dev',
  'https://system10h.com',
  'https://www.system10h.com',
  'https://system10h-mobile.pages.dev',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:8787',
  'http://localhost:8083',
];

function getCorsOrigin(requestOrigin) {
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  if (!requestOrigin) {
    // No origin = native app or server-to-server (allow)
    return '*';
  }
  // Unknown origin — do not reflect
  return null;
}

app.use('/api/mobile/*', async (c, next) => {
  const origin = c.req.header('origin') || '';
  const corsOrigin = getCorsOrigin(origin);

  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    const headers = {
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    if (corsOrigin) {
      headers['Access-Control-Allow-Origin'] = corsOrigin;
      if (corsOrigin !== '*') headers['Vary'] = 'Origin';
    }
    return new Response(null, { status: 204, headers });
  }

  await next();

  // Add CORS headers to all responses
  if (corsOrigin) {
    c.header('Access-Control-Allow-Origin', corsOrigin);
    if (corsOrigin !== '*') c.header('Vary', 'Origin');
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

// ─── ERROR HELPER ───────────────────────────────────────

function mobileError(c, message, status, code = null) {
  return c.json({ error: message, code, status }, status);
}

// ─── TELEGRAM ALERT (background) ────────────────────────

function sendTelegramAlert(env, ctx, text) {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  const chatId = env.TELEGRAM_CHAT_ID || '1304598782';
  const promise = fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    }
  ).catch(err => console.error('Telegram alert error:', err));

  if (ctx && ctx.waitUntil) {
    ctx.waitUntil(promise);
  }
}

// ─── ACTIVITY EVENT LOGGER ────────────────────────────────

async function logActivity(kv, event) {
  const key = `activity:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
  const entry = {
    type: event.type,       // 'draft_created' | 'draft_approved' | 'draft_rejected' | 'lead_updated' | 'lead_postponed'
    summary: event.summary, // "Email Autopilot stworzyl draft do Art Adventure"
    leadName: event.leadName || null,
    draftSubject: event.draftSubject || null,
    timestamp: new Date().toISOString(),
  };
  try {
    await kv.put(key, JSON.stringify(entry), { expirationTtl: 86400 * 2 }); // 48h TTL
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

// ─── PUSH NOTIFICATION (EXPO) ─────────────────────────────

async function sendPushNotification(kv, title, body, data = {}) {
  try {
    // Multi-device support: read token array, fallback to legacy single-token key
    let tokens = await kv.get('push_tokens:mateusz', 'json');
    if (!tokens) {
      // Backward compat: check legacy single-token key
      const legacyToken = await kv.get('push_token:mateusz');
      if (legacyToken) tokens = [legacyToken];
    }
    if (!tokens || tokens.length === 0) return; // No devices registered

    // Expo push API accepts array of recipients
    const messages = tokens.map(token => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      categoryId: data.categoryId || undefined,
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

// ──────────────────────────────────────────────────────────
// ROUTE: POST /api/mobile/auth
// Authenticate with device_id + shared secret, receive JWT.
// ──────────────────────────────────────────────────────────

app.post('/api/mobile/auth', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const kv = c.env.RATE_LIMIT_KV;

  // Rate limit check — per IP
  const rateCheck = await checkAuthRateLimit(ip, kv);
  if (!rateCheck.ok) {
    return mobileError(c, 'Too many attempts. Try again in 15 minutes.', 429, 'RATE_LIMIT');
  }

  // Parse body
  let body;
  try {
    body = await c.req.json();
  } catch {
    return mobileError(c, 'Invalid JSON', 400, 'VALIDATION_ERROR');
  }

  const { device_id, secret_key } = body;

  // Validate device_id: 1-100 chars, alphanumeric + dashes
  if (!device_id || typeof device_id !== 'string' || device_id.length > 100 ||
      !/^[a-zA-Z0-9\-]+$/.test(device_id)) {
    return mobileError(c, 'Invalid device_id', 400, 'VALIDATION_ERROR');
  }

  // Rate limit check — per device_id (prevents device-specific brute force)
  const deviceRateCheck = await checkAuthRateLimit(`dev:${device_id}`, kv);
  if (!deviceRateCheck.ok) {
    return mobileError(c, 'Too many attempts for this device. Try again in 15 minutes.', 429, 'RATE_LIMIT');
  }

  // Validate secret_key: exactly 64 hex chars
  if (!secret_key || typeof secret_key !== 'string' || !/^[0-9a-f]{64}$/i.test(secret_key)) {
    await incrementAuthRateLimit(ip, kv);
    await incrementAuthRateLimit(`dev:${device_id}`, kv);
    return mobileError(c, 'Invalid credentials', 401, 'AUTH_INVALID');
  }

  // Check secret is configured
  if (!c.env.MOBILE_SECRET_KEY) {
    console.error('MOBILE_SECRET_KEY not configured in Worker secrets');
    return mobileError(c, 'Server configuration error', 500, 'INTERNAL_ERROR');
  }

  // Constant-time comparison (uses env secret for HMAC key)
  const valid = await timingSafeEqual(secret_key, c.env.MOBILE_SECRET_KEY, c.env);
  if (!valid) {
    await incrementAuthRateLimit(ip, kv);
    await incrementAuthRateLimit(`dev:${device_id}`, kv);
    return mobileError(c, 'Invalid credentials', 401, 'AUTH_INVALID');
  }

  // Generate JWT
  const token = await generateToken(c.env, {
    sub: 'mateusz',
    device_id,
  });

  // Register device in KV (for revocation)
  const ctx = c.executionCtx;
  const deviceRegister = kv.put(
    `auth:device:${device_id}`,
    JSON.stringify({ ip, authenticated_at: new Date().toISOString() }),
    { expirationTtl: 86400 }
  );
  if (ctx && ctx.waitUntil) {
    ctx.waitUntil(deviceRegister);
  } else {
    await deviceRegister;
  }

  return c.json({
    token,
    expires_in: 3600,
    user: 'mateusz',
  });
});

// ──────────────────────────────────────────────────────────
// PROTECTED ROUTES — Auth + Rate Limit middleware
// ──────────────────────────────────────────────────────────

// Apply auth middleware to all routes except /auth
const protected_ = new Hono();
protected_.use('*', authMiddleware());
protected_.use('*', rateLimitMiddleware());

// ──────────────────────────────────────────────────────────
// ROUTE: GET /api/mobile/dashboard
// Pipeline snapshot — served from KV (pre-computed by Cron Trigger).
// ──────────────────────────────────────────────────────────

protected_.get('/dashboard', async (c) => {
  const user = c.get('user');

  // Rate limit: 10 req/min per user for dashboard (protects Notion API)
  const rl = await checkRateLimit(c.env.RATE_LIMIT_KV, `dash:${user.sub}`, 10, 60);
  if (!rl.allowed) {
    return mobileError(c, 'Dashboard rate limit exceeded. Try again later.', 429, 'RATE_LIMIT');
  }

  try {
    const { data, hit } = await getDashboardFromCache(c.env, user.sub);
    c.header('X-Cache', hit ? 'HIT' : 'MISS');
    return c.json(data);
  } catch (err) {
    console.error('Dashboard error:', err);
    return mobileError(c, 'Failed to fetch dashboard', 502, 'NOTION_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: GET /api/mobile/leads
// List leads from Notion CRM with filtering and sorting.
// Query params: status, sort, limit, cursor
// ──────────────────────────────────────────────────────────

protected_.get('/leads', async (c) => {
  const user = c.get('user');

  // Rate limit: 20 req/min per user for leads list (protects Notion API)
  const rl = await checkRateLimit(c.env.RATE_LIMIT_KV, `leads:${user.sub}`, 20, 60);
  if (!rl.allowed) {
    return mobileError(c, 'Leads rate limit exceeded. Try again later.', 429, 'RATE_LIMIT');
  }

  const url = new URL(c.req.url);

  const status = url.searchParams.get('status') || 'active';
  const sort = url.searchParams.get('sort') || 'due_asc';
  const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit')) || 50, 100));
  const cursor = url.searchParams.get('cursor') || null;

  // Validate status param
  const validStatuses = ['active', 'nurture', 'frozen', 'won', 'all'];
  if (!validStatuses.includes(status)) {
    return mobileError(c, `Invalid status. Allowed: ${validStatuses.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  // Validate sort param
  const validSorts = ['due_asc', 'due_desc', 'value_desc', 'name_asc'];
  if (!validSorts.includes(sort)) {
    return mobileError(c, `Invalid sort. Allowed: ${validSorts.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  try {
    const { data, hit } = await getLeadsFromCache(c.env, {
      status,
      sort,
      limit,
      cursor,
      userSub: user.sub,
    });
    c.header('X-Cache', hit ? 'HIT' : 'MISS');
    return c.json(data);
  } catch (err) {
    console.error('Leads list error:', err);
    return mobileError(c, 'Failed to fetch leads', 502, 'NOTION_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: GET /api/mobile/leads/:id
// Single lead detail with full properties.
// ──────────────────────────────────────────────────────────

protected_.get('/leads/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  if (!isValidNotionPageId(id)) {
    return mobileError(c, 'Invalid lead ID format', 400, 'VALIDATION_ERROR');
  }

  // Single-user system — log access for audit
  console.log(`Lead access: ${user.sub} → ${id}`);

  try {
    const { data, hit } = await getLeadById(c.env, id);
    c.header('X-Cache', hit ? 'HIT' : 'MISS');
    return c.json(data);
  } catch (err) {
    console.error(`Lead detail error (${id}):`, err);
    if (err.message && err.message.includes('404')) {
      return mobileError(c, 'Lead not found', 404, 'NOT_FOUND');
    }
    return mobileError(c, 'Failed to fetch lead', 502, 'NOTION_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: PATCH /api/mobile/leads/:id
// Update lead properties (due, status, note, next_step, last_contact).
// Invalidates cache and sends Telegram alert.
// ──────────────────────────────────────────────────────────

protected_.patch('/leads/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  if (!isValidNotionPageId(id)) {
    return mobileError(c, 'Invalid lead ID format', 400, 'VALIDATION_ERROR');
  }

  // Single-user system — log access for audit
  console.log(`Lead update: ${user.sub} → ${id}`);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return mobileError(c, 'Invalid JSON', 400, 'VALIDATION_ERROR');
  }

  // Validate: at least one field required
  const allowedFields = ['due', 'status', 'note', 'next_step', 'last_contact'];
  const hasField = allowedFields.some(f => body[f] !== undefined && body[f] !== null);
  if (!hasField) {
    return mobileError(c, 'At least one field required: ' + allowedFields.join(', '), 400, 'VALIDATION_ERROR');
  }

  // Validate individual fields
  if (body.due && !/^\d{4}-\d{2}-\d{2}$/.test(body.due)) {
    return mobileError(c, 'Invalid due format. Use YYYY-MM-DD.', 400, 'VALIDATION_ERROR');
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return mobileError(c, `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  if (body.note && (typeof body.note !== 'string' || body.note.length > 2000)) {
    return mobileError(c, 'Note must be string, max 2000 chars', 400, 'VALIDATION_ERROR');
  }
  // Sanitize note: escape HTML entities to prevent XSS while preserving text
  if (body.note) {
    body.note = String(body.note)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '')
      .slice(0, 500);
  }

  if (body.next_step && (typeof body.next_step !== 'string' || body.next_step.length > 200)) {
    return mobileError(c, 'next_step must be string, max 200 chars', 400, 'VALIDATION_ERROR');
  }
  // Sanitize next_step: escape HTML entities to prevent XSS
  if (body.next_step) {
    body.next_step = String(body.next_step)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '')
      .slice(0, 200);
  }

  if (body.last_contact && !/^\d{4}-\d{2}-\d{2}$/.test(body.last_contact)) {
    return mobileError(c, 'Invalid last_contact format. Use YYYY-MM-DD.', 400, 'VALIDATION_ERROR');
  }

  try {
    const result = await updateLead(c.env, id, body);

    // Invalidate caches (background)
    const ctx = c.executionCtx;
    const invalidation = invalidateLeadCaches(c.env, id, user.sub);
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(invalidation);
    }

    // Telegram alert (background)
    const alertParts = [`<b>MOBILE UPDATE:</b> ${result.lead.name}`];
    if (result.lead.company) alertParts[0] += ` @ ${result.lead.company}`;
    if (body.status) alertParts.push(`Status: ${body.status}`);
    if (body.due) alertParts.push(`Due: ${body.due}`);
    if (body.note) alertParts.push(`Note: ${body.note.slice(0, 100)}${body.note.length > 100 ? '...' : ''}`);
    sendTelegramAlert(c.env, ctx, alertParts.join('\n'));

    // Activity log
    const leadName = result.lead.name || 'Lead';
    const updatedFields = result.updated.join(', ');
    const kv = c.env.RATE_LIMIT_KV;
    await logActivity(kv, { type: 'lead_updated', summary: `Zaktualizowano ${leadName}: ${updatedFields}`, leadName });

    return c.json(result);
  } catch (err) {
    console.error(`Lead update error (${id}):`, err);

    if (err.message && err.message.includes('Invalid status')) {
      return mobileError(c, err.message, 400, 'VALIDATION_ERROR');
    }
    if (err.message && err.message.includes('No valid fields')) {
      return mobileError(c, err.message, 400, 'VALIDATION_ERROR');
    }
    if (err.message && err.message.includes('404')) {
      return mobileError(c, 'Lead not found', 404, 'NOT_FOUND');
    }

    return mobileError(c, 'Failed to update lead', 502, 'NOTION_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: GET /api/mobile/activity
// Recent activity feed (events logged by logActivity).
// ──────────────────────────────────────────────────────────

protected_.get('/activity', async (c) => {
  const kv = c.env.RATE_LIMIT_KV;

  // KV list with prefix 'activity:' — returns keys sorted by name (which includes timestamp)
  const list = await kv.list({ prefix: 'activity:', limit: 30 });

  // Fetch all values in parallel
  const entries = await Promise.all(
    list.keys.map(async (key) => {
      try {
        const val = await kv.get(key.name, 'json');
        return val;
      } catch {
        return null;
      }
    })
  );

  // Filter nulls, sort newest first
  const activity = entries
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return c.json({ activity, total: activity.length });
});

// ──────────────────────────────────────────────────────────
// ROUTE: POST /api/mobile/push-token
// Register Expo push token for notifications.
// ──────────────────────────────────────────────────────────

protected_.post('/push-token', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return mobileError(c, 'Invalid JSON', 400, 'VALIDATION_ERROR');
  }

  const { token } = body;
  if (!token || typeof token !== 'string') {
    return mobileError(c, 'Invalid token', 400, 'VALIDATION_ERROR');
  }

  const user = c.get('user');
  const kv = c.env.RATE_LIMIT_KV;
  const storageKey = `push_tokens:${user.sub || 'mateusz'}`;

  // Multi-device support: store as array, keep last 5 devices max
  const existing = await kv.get(storageKey, 'json') || [];
  if (!existing.includes(token)) {
    existing.push(token);
  }
  const tokens = existing.slice(-5);
  await kv.put(storageKey, JSON.stringify(tokens));
  return c.json({ ok: true, devices: tokens.length });
});

// ──────────────────────────────────────────────────────────
// ROUTE: POST /api/mobile/logout
// Revoke device token in KV. Client should clear SecureStore.
// ──────────────────────────────────────────────────────────

protected_.post('/logout', async (c) => {
  const user = c.get('user');
  const kv = c.env.RATE_LIMIT_KV;

  // Revoke device for 30 days
  await kv.put(
    `revoke:device:${user.device_id}`,
    JSON.stringify({ revoked_at: new Date().toISOString(), reason: 'logout' }),
    { expirationTtl: 86400 * 30 }
  );

  sendTelegramAlert(
    c.env,
    c.executionCtx,
    `<b>DEVICE LOGOUT:</b> ${user.device_id}\nUser: ${user.sub}`
  );

  return c.json({ ok: true, message: 'Device revoked. Clear local token.' });
});

// ──────────────────────────────────────────────────────────
// ROUTE: GET /api/mobile/drafts
// Gmail drafts list via gmail.js. Returns enriched draft metadata.
// Query params: limit (1-20, default 10)
// ──────────────────────────────────────────────────────────

protected_.get('/drafts', async (c) => {
  if (!c.env.GMAIL_REFRESH_TOKEN) {
    return c.json({
      drafts: [],
      total: 0,
      message: 'Gmail not connected. Configure GMAIL_REFRESH_TOKEN in Worker secrets.',
    });
  }

  try {
    const url = new URL(c.req.url);
    const maxResults = Math.max(1, Math.min(parseInt(url.searchParams.get('limit')) || 10, 20));

    const drafts = await listDrafts(c.env, { maxResults });
    return c.json({ drafts, total: drafts.length });
  } catch (err) {
    console.error('Drafts list error:', err);
    if (err instanceof GmailError) {
      return mobileError(c, err.message, err.httpStatus, err.code);
    }
    return mobileError(c, 'Failed to fetch drafts', 502, 'GMAIL_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: GET /api/mobile/drafts/:id
// Single draft detail with full body and attachment metadata.
// ──────────────────────────────────────────────────────────

protected_.get('/drafts/:id', async (c) => {
  const draftId = c.req.param('id');

  if (!draftId || typeof draftId !== 'string' || draftId.length > 100) {
    return mobileError(c, 'Invalid draft ID', 400, 'VALIDATION_ERROR');
  }

  if (!c.env.GMAIL_REFRESH_TOKEN) {
    return mobileError(c, 'Gmail not connected', 503, 'GMAIL_NOT_CONFIGURED');
  }

  try {
    const draft = await getDraft(c.env, draftId);
    return c.json(draft);
  } catch (err) {
    console.error(`Draft detail error (${draftId}):`, err);
    if (err instanceof GmailError) {
      return mobileError(c, err.message, err.httpStatus, err.code);
    }
    return mobileError(c, 'Failed to fetch draft', 502, 'GMAIL_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: PATCH /api/mobile/drafts/:id
// Update draft content (edit subject/body before sending).
// ──────────────────────────────────────────────────────────

protected_.patch('/drafts/:id', async (c) => {
  const draftId = c.req.param('id');

  if (!draftId || typeof draftId !== 'string' || draftId.length > 100) {
    return mobileError(c, 'Invalid draft ID', 400, 'VALIDATION_ERROR');
  }

  if (!c.env.GMAIL_REFRESH_TOKEN) {
    return mobileError(c, 'Gmail not connected', 503, 'GMAIL_NOT_CONFIGURED');
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    return mobileError(c, 'Invalid JSON', 400, 'VALIDATION_ERROR');
  }

  const { subject, body: bodyText } = body;

  if (!subject && !bodyText) {
    return mobileError(c, 'Nothing to update. Provide subject or body.', 400, 'VALIDATION_ERROR');
  }

  // Sanitize inputs
  const updates = {};
  if (subject) updates.subject = String(subject).slice(0, 500);
  if (bodyText) updates.body = String(bodyText).slice(0, 50000);

  try {
    const result = await updateDraft(c.env, draftId, updates);
    return c.json({ ok: true, id: result.id });
  } catch (err) {
    console.error(`Draft update error (${draftId}):`, err);
    if (err instanceof GmailError) {
      return mobileError(c, err.message, err.httpStatus, err.code);
    }
    return mobileError(c, 'Failed to update draft', 502, 'GMAIL_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: POST /api/mobile/drafts/:id/approve
// Approve a Gmail draft — sends it via Gmail API.
// The draft is removed from drafts and appears in Sent mail.
// ──────────────────────────────────────────────────────────

protected_.post('/drafts/:id/approve', async (c) => {
  const draftId = c.req.param('id');
  const user = c.get('user');

  if (!draftId || typeof draftId !== 'string' || draftId.length > 100) {
    return mobileError(c, 'Invalid draft ID', 400, 'VALIDATION_ERROR');
  }

  if (!c.env.GMAIL_REFRESH_TOKEN) {
    return mobileError(c, 'Gmail not connected', 503, 'GMAIL_NOT_CONFIGURED');
  }

  try {
    // Fetch draft metadata before sending (for audit trail + alert)
    let subject = '';
    let to = '';
    try {
      const detail = await getDraft(c.env, draftId);
      subject = detail.subject;
      to = detail.to;
    } catch {
      // If metadata fetch fails, proceed with send anyway — the ID is what matters
    }

    // Send the draft
    const result = await sendDraft(c.env, draftId);

    // Store audit record in KV (background)
    const kv = c.env.RATE_LIMIT_KV;
    const ctx = c.executionCtx;
    const auditWrite = kv.put(
      `audit:draft:sent:${draftId}`,
      JSON.stringify({
        sent_by: user.sub,
        sent_at: new Date().toISOString(),
        message_id: result.id,
        subject,
        to,
      }),
      { expirationTtl: 86400 * 30 } // Keep audit for 30 days
    );
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(auditWrite);
    }

    // Telegram alert (background)
    sendTelegramAlert(
      c.env,
      ctx,
      `<b>DRAFT SENT:</b> "${subject}"\nTo: ${to}\nBy: ${user.sub}\nMessage ID: ${result.id}`
    );

    // Activity log
    await logActivity(kv, { type: 'draft_approved', summary: `Zatwierdzono draft: ${subject}`, draftSubject: subject });

    return c.json({
      ok: true,
      action: 'sent',
      draft_id: draftId,
      message_id: result.id,
      thread_id: result.threadId,
      subject,
    });
  } catch (err) {
    console.error(`Draft approve error (${draftId}):`, err);
    if (err instanceof GmailError) {
      return mobileError(c, err.message, err.httpStatus, err.code);
    }
    return mobileError(c, 'Failed to send draft', 502, 'GMAIL_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE: POST /api/mobile/drafts/:id/reject
// Reject a Gmail draft — deletes it permanently.
// ──────────────────────────────────────────────────────────

protected_.post('/drafts/:id/reject', async (c) => {
  const draftId = c.req.param('id');
  const user = c.get('user');

  if (!draftId || typeof draftId !== 'string' || draftId.length > 100) {
    return mobileError(c, 'Invalid draft ID', 400, 'VALIDATION_ERROR');
  }

  if (!c.env.GMAIL_REFRESH_TOKEN) {
    return mobileError(c, 'Gmail not connected', 503, 'GMAIL_NOT_CONFIGURED');
  }

  try {
    // Fetch draft metadata before deleting (for audit trail + alert)
    let subject = '';
    let to = '';
    try {
      const detail = await getDraft(c.env, draftId);
      subject = detail.subject;
      to = detail.to;
    } catch {
      // If metadata fetch fails, proceed with delete anyway
    }

    // Delete the draft
    await trashDraft(c.env, draftId);

    // Store audit record in KV (background)
    const kv = c.env.RATE_LIMIT_KV;
    const ctx = c.executionCtx;
    const auditWrite = kv.put(
      `audit:draft:rejected:${draftId}`,
      JSON.stringify({
        rejected_by: user.sub,
        rejected_at: new Date().toISOString(),
        subject,
        to,
      }),
      { expirationTtl: 86400 * 30 } // Keep audit for 30 days
    );
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(auditWrite);
    }

    // Telegram alert (background)
    sendTelegramAlert(
      c.env,
      ctx,
      `<b>DRAFT REJECTED:</b> "${subject}"\nTo: ${to}\nBy: ${user.sub}`
    );

    // Activity log
    await logActivity(kv, { type: 'draft_rejected', summary: `Odrzucono draft: ${subject}`, draftSubject: subject });

    return c.json({
      ok: true,
      action: 'rejected',
      draft_id: draftId,
      subject,
    });
  } catch (err) {
    console.error(`Draft reject error (${draftId}):`, err);
    if (err instanceof GmailError) {
      return mobileError(c, err.message, err.httpStatus, err.code);
    }
    return mobileError(c, 'Failed to reject draft', 502, 'GMAIL_ERROR');
  }
});

// ──────────────────────────────────────────────────────────
// HEALTH CHECK (unprotected — must be BEFORE protected mount)
// ──────────────────────────────────────────────────────────

app.get('/api/mobile/health', (c) => {
  return c.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────────────────
// MOUNT PROTECTED ROUTES
// ──────────────────────────────────────────────────────────

app.route('/api/mobile', protected_);

// ──────────────────────────────────────────────────────────
// EXPORT
// ──────────────────────────────────────────────────────────

export { app as mobileApp };
export default app;
