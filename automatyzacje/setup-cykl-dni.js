#!/usr/bin/env node
// ONE-TIME SETUP: Add cykl_dni property to Notion CRM + set values for REPEAT clients
// Based on real order data from arkusz prowizji (I-III/2026)
// Usage: node automatyzacje/setup-cykl-dni.js

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load .env
const envContent = readFileSync(join(ROOT, '.env'), 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = '19a268dd-5467-4f2a-9eb2-a004efc0ac7e';
const NOTION_VERSION = '2022-06-28';

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_VERSION
};

// Real cykl_dni values from arkusz prowizji analysis
const CLIENTS = [
  { pageId: '303862e1-4a0c-811f-a078-fca953bfe1a8', name: 'Malowisko', cykl: 8 },
  { pageId: '303862e1-4a0c-819b-9189-e2ff403155e3', name: 'BATS', cykl: 39 },
  { pageId: '303862e1-4a0c-8157-bea1-d4cb005541ff', name: 'Farboteka', cykl: 13 },
  { pageId: '2f0862e1-4a0c-8024-932a-e7307019154e', name: 'Konrad Wisz', cykl: 12 },
  { pageId: '303862e1-4a0c-816f-ac8c-cad8a5080186', name: 'Art Wine', cykl: 21 },
  { pageId: '303862e1-4a0c-818f-a6ed-d3f7a95e821a', name: 'Winem malowane', cykl: 13 },
  { pageId: '303862e1-4a0c-8190-b454-dae2727f4435', name: 'WATAHA', cykl: 39 },
  { pageId: '303862e1-4a0c-819e-aa53-e99fee7ae9cb', name: 'Kolorolab', cykl: 30 },
  { pageId: '306862e1-4a0c-81c4-85e6-ebf90c636d81', name: 'WINO-GRONO', cykl: 25 },
];

async function notionFetch(url, options = {}) {
  const res = await fetch(url, { headers, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function addPropertyToDatabase() {
  console.log('1/2 Adding cykl_dni property to database...');
  try {
    await notionFetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties: {
          cykl_dni: { number: {} }
        }
      })
    });
    console.log('   ✅ cykl_dni column added to CRM');
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('conflict')) {
      console.log('   ℹ️  cykl_dni already exists, skipping');
    } else {
      throw err;
    }
  }
}

async function setClientValues() {
  console.log('2/2 Setting cykl_dni values for 9 REPEAT clients...');
  for (const client of CLIENTS) {
    try {
      await notionFetch(`https://api.notion.com/v1/pages/${client.pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: {
            cykl_dni: { number: client.cykl }
          }
        })
      });
      console.log(`   ✅ ${client.name}: ${client.cykl} dni`);
    } catch (err) {
      console.error(`   ❌ ${client.name}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('=== SETUP cykl_dni — Notion CRM ArtNapi ===\n');
  await addPropertyToDatabase();
  await setClientValues();
  console.log('\n✅ Done. cykl_dni set for all REPEAT clients.');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
