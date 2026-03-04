#!/usr/bin/env node
// CREATE GMAIL DRAFT — CLI tool
// Tworzy draft w Gmail ArtNapi (mateusz.sokolski@artnapi.pl)
// Używa tego samego OAuth co morning-scan.js (lib.js)
//
// Użycie:
//   node automatyzacje/create-gmail-draft.js --to EMAIL --subject "TEMAT" --body "TREŚĆ"
//   node automatyzacje/create-gmail-draft.js --to EMAIL --subject "TEMAT" --body-file /path/to/body.txt
//   node automatyzacje/create-gmail-draft.js --json '[{"to":"a@b.com","subject":"X","body":"Y"},...]'
//
// Opcje:
//   --to        Adres email odbiorcy
//   --subject   Temat wiadomości
//   --body      Treść wiadomości (inline)
//   --body-file Ścieżka do pliku z treścią
//   --json      JSON array z wieloma draftami (batch mode)
//   --thread-id Thread ID do reply (opcjonalnie)

import { readFileSync } from 'fs';
import { loadEnv, gmailGetAccessToken, gmailCreateDraft } from './lib.js';

loadEnv();

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--') && i + 1 < argv.length) {
      args[key.slice(2)] = argv[++i];
    }
  }
  return args;
}

async function run() {
  const args = parseArgs(process.argv);

  const accessToken = await gmailGetAccessToken();

  // Batch mode
  if (args.json) {
    const drafts = JSON.parse(args.json);
    let ok = 0;
    let fail = 0;
    for (const d of drafts) {
      try {
        await gmailCreateDraft(accessToken, d.to, d.subject, d.body, d.threadId);
        console.log(`OK: ${d.to} — "${d.subject}"`);
        ok++;
      } catch (err) {
        console.error(`FAIL: ${d.to} — ${err.message}`);
        fail++;
      }
    }
    console.log(`\nDone: ${ok} created, ${fail} failed`);
    process.exit(fail > 0 ? 1 : 0);
  }

  // Single draft mode
  if (!args.to || !args.subject) {
    console.error('Usage: node create-gmail-draft.js --to EMAIL --subject "TEMAT" --body "TREŚĆ"');
    console.error('  or:  node create-gmail-draft.js --json \'[{"to":"a@b.com","subject":"X","body":"Y"}]\'');
    process.exit(1);
  }

  let body = args.body || '';
  if (args['body-file']) {
    body = readFileSync(args['body-file'], 'utf-8');
  }

  try {
    const result = await gmailCreateDraft(accessToken, args.to, args.subject, body, args['thread-id']);
    console.log(`OK: Draft created — ID: ${result.id}`);
  } catch (err) {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
