// dynamo.mjs — DynamoDB state management
// Handles: dedup (processedIds), frequency cap, heartbeat, budget tracking.
// All records use TTL for automatic cleanup.

import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const TABLE = process.env.DYNAMO_TABLE || 'email-processor-state';
const REGION = process.env.AWS_REGION || 'eu-west-1';

const client = new DynamoDBClient({ region: REGION });

const TTL_30_DAYS = 30 * 24 * 60 * 60;
const TTL_24_HOURS = 24 * 60 * 60;
const TTL_4_HOURS = 4 * 60 * 60;

// --- Dedup: processed message IDs ---

/**
 * Check if a Gmail message ID has already been processed.
 */
export async function isProcessed(messageId) {
  const res = await client.send(new GetItemCommand({
    TableName: TABLE,
    Key: { PK: { S: `EMAIL#${messageId}` } },
  }));
  return !!res.Item;
}

/**
 * Mark a Gmail message ID as processed.
 * @param {string} messageId
 * @param {string} senderEmail
 * @param {string} action — DRAFT_CREATED | SKIPPED_ALREADY_REPLIED | SKIPPED_DECISION | SKIPPED_GUARDRAIL | SKIPPED_FREQ_CAP | SKIPPED_BUDGET_CAP | SKIPPED_OWN_EMAIL | SKIPPED_EXISTING_DRAFT
 */
export async function markProcessed(messageId, senderEmail, action) {
  await client.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      PK: { S: `EMAIL#${messageId}` },
      processedAt: { S: new Date().toISOString() },
      senderEmail: { S: senderEmail || 'unknown' },
      action: { S: action },
      ttl: { N: String(Math.floor(Date.now() / 1000) + TTL_30_DAYS) },
    },
  }));
}

// --- Frequency Cap (Edge Case 3: spam loop prevention) ---

/**
 * Check and increment the frequency counter for a lead email.
 * Returns { allowed: boolean, count: number } based on:
 *   - Max 3 drafts per 24h per lead
 *   - Max 1 draft per 1h per lead (burst protection)
 */
export async function checkFrequencyCap(senderEmail) {
  const pk = `FREQ#${senderEmail.toLowerCase()}`;
  const maxPer24h = parseInt(process.env.DRAFT_FREQUENCY_CAP_24H || '3', 10);
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);

  const res = await client.send(new GetItemCommand({
    TableName: TABLE,
    Key: { PK: { S: pk } },
  }));

  if (res.Item) {
    const windowStart = parseInt(res.Item.windowStart?.N || '0', 10) * 1000;
    const count = parseInt(res.Item.draftCount?.N || '0', 10);
    const lastDraftAt = parseInt(res.Item.lastDraftAt?.N || '0', 10) * 1000;

    // 24h window still active?
    if ((now - windowStart) < 24 * 60 * 60 * 1000) {
      // Check 24h cap
      if (count >= maxPer24h) {
        return { allowed: false, count, reason: `${count} drafts in 24h (cap: ${maxPer24h})` };
      }
      // Check 1h burst cap
      if ((now - lastDraftAt) < 60 * 60 * 1000) {
        return { allowed: false, count, reason: 'burst protection: <1h since last draft' };
      }
    }
    // Window expired — will reset below
  }

  return { allowed: true, count: 0 };
}

/**
 * Increment the frequency counter after a draft is created.
 */
export async function incrementFrequencyCounter(senderEmail) {
  const pk = `FREQ#${senderEmail.toLowerCase()}`;
  const nowSec = Math.floor(Date.now() / 1000);

  // Upsert: if window expired or new, start fresh; otherwise increment
  try {
    await client.send(new PutItemCommand({
      TableName: TABLE,
      Item: {
        PK: { S: pk },
        draftCount: { N: '1' },
        windowStart: { N: String(nowSec) },
        lastDraftAt: { N: String(nowSec) },
        ttl: { N: String(nowSec + TTL_24_HOURS) },
      },
      // Only create if doesn't exist or window expired
      ConditionExpression: 'attribute_not_exists(PK) OR #ttl < :now',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':now': { N: String(nowSec) } },
    }));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Record exists and window still active — increment
      await client.send(new UpdateItemCommand({
        TableName: TABLE,
        Key: { PK: { S: pk } },
        UpdateExpression: 'SET draftCount = draftCount + :one, lastDraftAt = :now',
        ExpressionAttributeValues: {
          ':one': { N: '1' },
          ':now': { N: String(nowSec) },
        },
      }));
    } else {
      throw err;
    }
  }
}

// --- Budget Cap (Edge Case 7: cost spike protection) ---

/**
 * Check if the daily Bedrock call budget has been exceeded.
 * Returns { allowed: boolean, callsToday: number }
 */
export async function checkBudgetCap() {
  const dailyCap = parseInt(process.env.DAILY_BEDROCK_CAP || '50', 10);
  const today = new Date().toISOString().slice(0, 10);
  const pk = `BUDGET#${today}`;

  const res = await client.send(new GetItemCommand({
    TableName: TABLE,
    Key: { PK: { S: pk } },
  }));

  const callsToday = res.Item ? parseInt(res.Item.bedrockCallsToday?.N || '0', 10) : 0;

  return {
    allowed: callsToday < dailyCap,
    callsToday,
    cap: dailyCap,
  };
}

/**
 * Increment the daily Bedrock call counter.
 * @param {number} [calls=1] — number of calls to add
 */
export async function incrementBudgetCounter(calls = 1) {
  const today = new Date().toISOString().slice(0, 10);
  const pk = `BUDGET#${today}`;
  const nowSec = Math.floor(Date.now() / 1000);

  try {
    await client.send(new PutItemCommand({
      TableName: TABLE,
      Item: {
        PK: { S: pk },
        bedrockCallsToday: { N: String(calls) },
        ttl: { N: String(nowSec + TTL_24_HOURS) },
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    }));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      await client.send(new UpdateItemCommand({
        TableName: TABLE,
        Key: { PK: { S: pk } },
        UpdateExpression: 'SET bedrockCallsToday = bedrockCallsToday + :n',
        ExpressionAttributeValues: { ':n': { N: String(calls) } },
      }));
    } else {
      throw err;
    }
  }
}

// --- Heartbeat (Edge Case 6: push failure detection) ---

/**
 * Update the webhook heartbeat timestamp.
 */
export async function updateHeartbeat() {
  const nowSec = Math.floor(Date.now() / 1000);
  await client.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      PK: { S: 'HEARTBEAT#webhook' },
      lastWebhookAt: { S: new Date().toISOString() },
      ttl: { N: String(nowSec + TTL_30_DAYS) },
    },
  }));
}

/**
 * Get the last webhook heartbeat timestamp.
 * Returns { lastWebhookAt: string|null, ageHours: number }
 */
export async function getHeartbeat() {
  const res = await client.send(new GetItemCommand({
    TableName: TABLE,
    Key: { PK: { S: 'HEARTBEAT#webhook' } },
  }));

  if (!res.Item) return { lastWebhookAt: null, ageHours: Infinity };

  const ts = res.Item.lastWebhookAt?.S;
  if (!ts) return { lastWebhookAt: null, ageHours: Infinity };

  const ageMs = Date.now() - new Date(ts).getTime();
  return {
    lastWebhookAt: ts,
    ageHours: Math.floor(ageMs / (1000 * 60 * 60)),
  };
}
