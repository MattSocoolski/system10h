#!/usr/bin/env node
// Archiwizuje (soft-delete) stronę w Notion po page_id.
// Użycie: node automatyzacje/notion-archive.js PAGE_ID
// Notion API nie ma "delete" — archived:true = przeniesienie do kosza.

import { loadEnv, notionFetch } from './lib.js';

loadEnv();

const pageId = process.argv[2];
if (!pageId) {
  console.error('Użycie: node automatyzacje/notion-archive.js PAGE_ID');
  process.exit(1);
}

try {
  const result = await notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: { archived: true }
  });
  console.log(`Zarchiwizowano: ${result.id} (${result.url})`);
} catch (err) {
  console.error('Błąd:', err.message);
  process.exit(1);
}
