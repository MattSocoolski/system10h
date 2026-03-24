// canary.mjs — Daily health check Lambda for ArtNapi Email Processor
// Triggered by EventBridge (cron). Tests all integrations, reports via Telegram.
// On failure: continues checking remaining services, sends alert with details.

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { getSecrets } from './secrets.mjs';
import { gmailGetAccessToken, gmailSearchMessages } from './gmail.mjs';
import { loadS3File, checkStaleness } from './s3.mjs';
import { queryCRM } from './notion.mjs';
import { getHeartbeat } from './dynamo.mjs';
import { sendTelegram } from './telegram.mjs';
import { loadTenantConfig, getDefaultTenantId } from './tenant-config.mjs';

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'email-processor-state';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL_ID || 'claude-sonnet-4-6';
const MY_EMAIL = process.env.MY_EMAIL || 'mateusz.sokolski@artnapi.pl';

/**
 * Run a single check, catching errors and measuring latency.
 * @returns {{ name, status, latency_ms, error_message, detail }}
 */
async function runCheck(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { name, status: 'OK', latency_ms: Date.now() - t0, error_message: null, detail: detail || null };
  } catch (err) {
    return { name, status: 'FAIL', latency_ms: Date.now() - t0, error_message: err.message, detail: null };
  }
}

export async function handler(event) {
  const results = [];
  const date = new Date().toISOString().slice(0, 10);
  let secrets = null;
  let accessToken = null;

  // Load tenant config (best-effort — canary continues even if config fails)
  let tenantConfig = null;
  try {
    tenantConfig = loadTenantConfig(getDefaultTenantId());
  } catch (err) {
    console.warn('[Canary] Tenant config not available, using defaults:', err.message);
  }
  const myEmail = tenantConfig?.email || MY_EMAIL;
  const s3Prefix = tenantConfig?.s3Prefix || '';
  const telegramOpts = tenantConfig?.telegramChatId ? { chatId: tenantConfig.telegramChatId } : {};
  const notionDatasourceId = tenantConfig?.notionDatasourceId || undefined;

  // 1. Secrets Manager
  const secretsResult = await runCheck('Secrets Manager', async () => {
    secrets = await getSecrets();
    const keys = Object.keys(secrets);
    if (keys.length === 0) throw new Error('Secrets object is empty');
    return `${keys.length} keys loaded`;
  });
  results.push(secretsResult);

  // 2. Gmail OAuth
  const oauthResult = await runCheck('Gmail OAuth', async () => {
    if (!secrets) throw new Error('Skipped: Secrets Manager failed');
    accessToken = await gmailGetAccessToken(secrets);
    if (!accessToken) throw new Error('Access token is empty');
  });
  results.push(oauthResult);

  // 3. Gmail API
  const gmailResult = await runCheck('Gmail API', async () => {
    if (!accessToken) throw new Error('Skipped: OAuth failed');
    const msgs = await gmailSearchMessages(accessToken, `to:${myEmail}`, 1);
    return `${msgs.length} message(s)`;
  });
  results.push(gmailResult);

  // 4. S3 oferta.md
  const s3Result = await runCheck('S3 oferta.md', async () => {
    const text = await loadS3File(`${s3Prefix}oferta.md`);
    if (!text || text.length < 50) throw new Error(`File too small: ${text?.length || 0} chars`);
    const staleness = await checkStaleness(`${s3Prefix}oferta.md`, 168); // 7 days
    const ageLabel = staleness.ageHours < 24
      ? `${staleness.ageHours}h`
      : `${Math.floor(staleness.ageHours / 24)}d`;
    if (staleness.ageHours > 168) throw new Error(`Stale: ${ageLabel} old (>7d)`);
    return `age: ${ageLabel}`;
  });
  results.push(s3Result);

  // 5. DynamoDB
  const dynamoResult = await runCheck('DynamoDB', async () => {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
    const res = await client.send(new GetItemCommand({
      TableName: DYNAMO_TABLE,
      Key: { PK: { S: 'HEARTBEAT#webhook' } },
    }));
    // GetItem succeeding (even with no Item) proves connectivity
    return res.Item ? 'heartbeat found' : 'table reachable';
  });
  results.push(dynamoResult);

  // 5b. Webhook Heartbeat — check if Gmail Push is alive
  const heartbeatResult = await runCheck('Webhook Heartbeat', async () => {
    const hb = await getHeartbeat();
    if (!hb.lastWebhookAt) throw new Error('No webhook heartbeat found — Gmail Push may never have been active');
    if (hb.ageHours > 2) throw new Error(`Webhook heartbeat is ${hb.ageHours}h old — Gmail Push may be dead (running on 15min fallback only)`);
    return `last: ${hb.lastWebhookAt} (${hb.ageHours}h ago)`;
  });
  results.push(heartbeatResult);

  // 5c. S3 ghost_styl.md staleness
  const ghostResult = await runCheck('S3 ghost_styl.md', async () => {
    const text = await loadS3File(`${s3Prefix}ghost_styl.md`);
    if (!text || text.length < 50) throw new Error(`File too small: ${text?.length || 0} chars`);
    const staleness = await checkStaleness(`${s3Prefix}ghost_styl.md`, 168);
    const ageLabel = staleness.ageHours < 24 ? `${staleness.ageHours}h` : `${Math.floor(staleness.ageHours / 24)}d`;
    if (staleness.ageHours > 168) throw new Error(`Stale: ${ageLabel} old (>7d)`);
    return `age: ${ageLabel}`;
  });
  results.push(ghostResult);

  // 6. Notion CRM
  const notionResult = await runCheck('Notion CRM', async () => {
    if (!secrets) throw new Error('Skipped: Secrets Manager failed');
    const pages = await queryCRM(secrets.NOTION_API_KEY, null, { datasourceId: notionDatasourceId });
    if (!Array.isArray(pages)) throw new Error('Unexpected response format');
    return `${pages.length} leads`;
  });
  results.push(notionResult);

  // 7. Anthropic API
  const anthropicResult = await runCheck('Anthropic API', async () => {
    if (!secrets) throw new Error('Skipped: Secrets Manager failed');
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': secrets.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 10,
        temperature: 0,
        messages: [{ role: 'user', content: 'Say OK' }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      throw new Error(`HTTP ${res.status}: ${(errText || '').slice(0, 200)}`);
    }
    const body = await res.json();
    if (!body.content?.[0]?.text) throw new Error('Empty response');
  });
  results.push(anthropicResult);

  // --- Build report ---
  const okCount = results.filter(r => r.status === 'OK').length;
  const totalCount = results.length;
  const totalMs = results.reduce((sum, r) => sum + r.latency_ms, 0);
  const allOk = okCount === totalCount;

  const lines = [`<b>CANARY HEALTH CHECK [${date}]</b>`];
  for (const r of results) {
    const icon = r.status === 'OK' ? '\u2705' : (r.error_message?.startsWith('Skipped:') ? '\u23ED\uFE0F' : '\u274C');
    let line = `${icon} ${r.name}`;
    if (r.status === 'FAIL') {
      const label = r.error_message?.startsWith('Skipped:') ? 'SKIPPED' : 'FAILED';
      line += ` ${label}: ${r.error_message}`;
    }
    line += ` (${r.latency_ms}ms)`;
    if (r.detail) line += ` [${r.detail}]`;
    lines.push(line);
  }

  lines.push('');
  if (allOk) {
    lines.push(`<b>Total: ${okCount}/${totalCount} OK (${totalMs}ms)</b>`);
  } else {
    const failCount = results.filter(r => r.status === 'FAIL' && !r.error_message?.startsWith('Skipped:')).length;
    lines.push(`<b>ALERT: ${failCount}/${totalCount} FAILED \u2014 check AWS Console</b>`);
  }

  const report = lines.join('\n');
  console.log(report);

  // 8. Telegram (always last — reports results)
  if (secrets) {
    await sendTelegram(secrets, report, telegramOpts);
  } else {
    console.error('[Canary] Cannot send Telegram: secrets unavailable');
  }

  return {
    statusCode: allOk ? 200 : 500,
    body: { date, checks: results, ok: okCount, total: totalCount, totalMs },
  };
}
