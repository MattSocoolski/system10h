#!/usr/bin/env node
// gdpr-delete.mjs — GDPR Right-to-Deletion: delete all DynamoDB records for a given email address.
//
// Usage: node gdpr-delete.mjs user@example.com
//
// Scans DynamoDB table for:
//   1. Records where senderEmail matches the given email
//   2. FREQ#email records (frequency cap counters)
//   3. AUDIT#* records where senderEmail matches
// Deletes all matching records and prints a summary.

import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';

const TABLE = process.env.DYNAMO_TABLE || 'email-processor-state';
const REGION = process.env.AWS_REGION || 'eu-north-1';

const client = new DynamoDBClient({ region: REGION });

async function scanBySenderEmail(email) {
  const items = [];
  let lastKey = undefined;

  do {
    const res = await client.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'senderEmail = :email',
      ExpressionAttributeValues: {
        ':email': { S: email },
      },
      ExclusiveStartKey: lastKey,
    }));

    if (res.Items) items.push(...res.Items);
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

async function scanFreqRecords(email) {
  const items = [];
  const pk = `FREQ#${email.toLowerCase()}`;
  let lastKey = undefined;

  do {
    const res = await client.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: pk },
      },
      ExclusiveStartKey: lastKey,
    }));

    if (res.Items) items.push(...res.Items);
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

async function deleteItems(items) {
  if (items.length === 0) return 0;

  // DynamoDB BatchWriteItem supports max 25 items per call
  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  let deleted = 0;
  for (const batch of batches) {
    const requests = batch.map(item => ({
      DeleteRequest: {
        Key: { PK: item.PK },
      },
    }));

    await client.send(new BatchWriteItemCommand({
      RequestItems: {
        [TABLE]: requests,
      },
    }));

    deleted += batch.length;
  }

  return deleted;
}

async function main() {
  const email = process.argv[2];

  if (!email || !email.includes('@')) {
    console.error('Usage: node gdpr-delete.mjs user@example.com');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();
  console.log(`\nGDPR Right-to-Deletion for: ${normalizedEmail}`);
  console.log(`Table: ${TABLE} | Region: ${REGION}`);
  console.log('---');

  // 1. Scan for records with matching senderEmail
  console.log('Scanning for senderEmail records...');
  const senderRecords = await scanBySenderEmail(normalizedEmail);
  const senderPKs = senderRecords.map(r => r.PK?.S || 'unknown');
  console.log(`  Found ${senderRecords.length} records with senderEmail match`);
  if (senderRecords.length > 0) {
    for (const pk of senderPKs) {
      console.log(`    - ${pk}`);
    }
  }

  // 2. Scan for FREQ#email records
  console.log('Scanning for FREQ# records...');
  const freqRecords = await scanFreqRecords(normalizedEmail);
  console.log(`  Found ${freqRecords.length} FREQ# records`);
  if (freqRecords.length > 0) {
    for (const r of freqRecords) {
      console.log(`    - ${r.PK?.S}`);
    }
  }

  // Combine and deduplicate by PK
  const allItems = [...senderRecords, ...freqRecords];
  const seen = new Set();
  const uniqueItems = allItems.filter(item => {
    const pk = item.PK?.S;
    if (seen.has(pk)) return false;
    seen.add(pk);
    return true;
  });

  if (uniqueItems.length === 0) {
    console.log('\nNo records found for this email. Nothing to delete.');
    return;
  }

  // Categorize by key pattern
  const patterns = {};
  for (const item of uniqueItems) {
    const pk = item.PK?.S || 'unknown';
    const prefix = pk.split('#')[0] + '#';
    patterns[prefix] = (patterns[prefix] || 0) + 1;
  }

  console.log('\n--- Deletion Summary ---');
  console.log(`Total records to delete: ${uniqueItems.length}`);
  console.log('By key pattern:');
  for (const [pattern, count] of Object.entries(patterns)) {
    console.log(`  ${pattern}*  =>  ${count} record(s)`);
  }

  // Delete all matching records
  console.log('\nDeleting...');
  const deletedCount = await deleteItems(uniqueItems);
  console.log(`Deleted ${deletedCount} record(s).`);
  console.log('GDPR deletion complete.\n');
}

main().catch(err => {
  console.error('GDPR delete failed:', (err.message || '').slice(0, 200));
  process.exit(1);
});
