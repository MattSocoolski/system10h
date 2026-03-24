// weekly-stats.mjs — Weekly stats Lambda for ArtNapi Email Processor
// Scans DynamoDB for EMAIL# records from last 7 days, calculates stats,
// sends a Telegram report. Triggered by EventBridge cron (Sundays 20:00).

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { getSecrets } from './secrets.mjs';
import { sendTelegram } from './telegram.mjs';
import { maskEmail } from './utils.mjs';

const TABLE = process.env.DYNAMO_TABLE || 'email-processor-state';
const REGION = process.env.AWS_REGION || 'eu-west-1';
const client = new DynamoDBClient({ region: REGION });

export async function handler() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const cutoff = sevenDaysAgo.toISOString();

  // --- 1. Scan EMAIL# items from last 7 days ---
  const items = [];
  let lastKey = undefined;

  do {
    const res = await client.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'begins_with(PK, :prefix) AND processedAt >= :cutoff',
      ExpressionAttributeValues: {
        ':prefix': { S: 'EMAIL#' },
        ':cutoff': { S: cutoff },
      },
      ExclusiveStartKey: lastKey,
    }));
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  const total = items.length;

  if (total === 0) {
    const secrets = await getSecrets();
    await sendTelegram(secrets, '<b>Weekly Stats</b>\n\nNo emails processed in the last 7 days.');
    return { statusCode: 200, body: 'No data' };
  }

  // --- 2. Calculate stats ---
  const counters = {
    DRAFT_CREATED: 0,
    SKIPPED_DECISION: 0,
    SKIPPED_ALREADY_REPLIED: 0,
    SKIPPED_GUARDRAIL: 0,
    SKIPPED_FREQ_CAP: 0,
    SKIPPED_BUDGET_CAP: 0,
    errors: 0,
    other: 0,
  };

  const senderMap = {};   // email -> count
  const dayMap = {};       // YYYY-MM-DD -> count

  for (const item of items) {
    const action = item.action?.S || 'UNKNOWN';
    const sender = item.senderEmail?.S || 'unknown';
    const processedAt = item.processedAt?.S || '';

    // Counters
    if (action === 'DRAFT_CREATED') counters.DRAFT_CREATED++;
    else if (action === 'SKIPPED_DECISION') counters.SKIPPED_DECISION++;
    else if (action === 'SKIPPED_ALREADY_REPLIED') counters.SKIPPED_ALREADY_REPLIED++;
    else if (action === 'SKIPPED_GUARDRAIL') counters.SKIPPED_GUARDRAIL++;
    else if (action === 'SKIPPED_FREQ_CAP') counters.SKIPPED_FREQ_CAP++;
    else if (action === 'SKIPPED_BUDGET_CAP') counters.SKIPPED_BUDGET_CAP++;
    else if (action.startsWith('ERROR')) counters.errors++;
    else counters.other++;

    // Sender frequency
    senderMap[sender] = (senderMap[sender] || 0) + 1;

    // Day frequency
    const day = processedAt.slice(0, 10);
    if (day) dayMap[day] = (dayMap[day] || 0) + 1;
  }

  // Top 5 senders
  const topSenders = Object.entries(senderMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Busiest day
  const busiestDay = Object.entries(dayMap)
    .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const busiestDayName = busiestDay[0] !== 'N/A'
    ? dayNames[new Date(busiestDay[0] + 'T12:00:00Z').getUTCDay()]
    : 'N/A';

  // Week number (ISO)
  const weekNum = getISOWeek(now);

  // Date range (Mon-Sun)
  const monDate = formatDate(sevenDaysAgo);
  const sunDate = formatDate(now);

  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
  const draftRate = pct(counters.DRAFT_CREATED);

  // --- 3. Build Telegram report ---
  const sendersBlock = topSenders
    .map(([email, count], i) => `${i + 1}. ${maskEmail(email)} — ${count} maili`)
    .join('\n');

  const otherSkips = counters.SKIPPED_FREQ_CAP + counters.SKIPPED_BUDGET_CAP + counters.other;

  const report = [
    `<b>Weekly Stats (W${weekNum})</b>`,
    `${monDate} — ${sunDate}`,
    '',
    `Total: <b>${total}</b> maili`,
    `├── ✅ Drafts: ${counters.DRAFT_CREATED} (${pct(counters.DRAFT_CREATED)}%)`,
    `├── 🔴 Decisions: ${counters.SKIPPED_DECISION} (${pct(counters.SKIPPED_DECISION)}%)`,
    `├── ⏭️ Already replied: ${counters.SKIPPED_ALREADY_REPLIED}`,
    `├── 🛡️ Guardrail blocked: ${counters.SKIPPED_GUARDRAIL}`,
    `├── ⚠️ Errors: ${counters.errors}`,
    `└── 🔄 Other skips: ${otherSkips}`,
    '',
    '<b>TOP SENDERS:</b>',
    sendersBlock,
    '',
    `Busiest day: ${busiestDayName} ${busiestDay[0]} (${busiestDay[1]} maili)`,
    `Draft rate: ${draftRate}%`,
  ].join('\n');

  const secrets = await getSecrets();
  await sendTelegram(secrets, report);

  console.log('[weekly-stats] Report sent.', { total, draftRate });
  return { statusCode: 200, body: `Sent weekly stats: ${total} emails` };
}

// --- Helpers ---

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}
