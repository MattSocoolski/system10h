#!/usr/bin/env node
// CREATE GMAIL DRAFT — CLI tool
// Tworzy draft w Gmail ArtNapi (mateusz.sokolski@artnapi.pl)
// Używa tego samego OAuth co morning-scan.js (lib.js)
//
// Użycie:
//   node automatyzacje/create-gmail-draft.js --to EMAIL --subject "TEMAT" --body "TREŚĆ"
//   node automatyzacje/create-gmail-draft.js --to EMAIL --subject "TEMAT" --body "TREŚĆ" --html
//   node automatyzacje/create-gmail-draft.js --to EMAIL --subject "TEMAT" --body-file /path/to/body.html --html
//   node automatyzacje/create-gmail-draft.js --json '[{"to":"a@b.com","subject":"X","body":"Y","html":true},...]'
//
// Opcje:
//   --to        Adres email odbiorcy
//   --subject   Temat wiadomości
//   --body      Treść wiadomości (inline)
//   --body-file Ścieżka do pliku z treścią
//   --json      JSON array z wieloma draftami (batch mode)
//   --thread-id Thread ID do reply (opcjonalnie)
//   --html      Wymuś Content-Type text/html (auto-detect jeśli body zawiera tagi HTML)
//   --sig-pl    Dodaj polską stopkę HTML (wymaga --html)
//   --sig-en    Dodaj angielską stopkę HTML (wymaga --html)

import { readFileSync } from 'fs';
import { loadEnv, gmailGetAccessToken, gmailCreateDraft, wrapEmailHTML } from './lib.js';

loadEnv();

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--html' || key === '--sig-pl' || key === '--sig-en') {
      args[key.slice(2)] = true;
    } else if (key.startsWith('--') && i + 1 < argv.length) {
      args[key.slice(2)] = argv[++i];
    }
  }
  return args;
}

// Auto-detect HTML content
function looksLikeHTML(text) {
  return /<(p|div|strong|br|ul|ol|li|a |h[1-6]|table)\b/i.test(text);
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
        const isHtml = d.html || looksLikeHTML(d.body || '');
        let body = d.body || '';
        // Wrap with signature if requested
        if (isHtml && d.sigEN) body = wrapEmailHTML(body, true);
        else if (isHtml && d.sigPL !== false) body = wrapEmailHTML(body, false);
        await gmailCreateDraft(accessToken, d.to, d.subject, body, d.threadId, { html: isHtml });
        console.log(`OK: ${d.to} — "${d.subject}"${isHtml ? ' (HTML)' : ''}`);
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
    console.error('Usage: node create-gmail-draft.js --to EMAIL --subject "TEMAT" --body "TREŚĆ" [--html] [--sig-pl|--sig-en]');
    console.error('  or:  node create-gmail-draft.js --json \'[{"to":"a@b.com","subject":"X","body":"<p>Y</p>","html":true}]\'');
    process.exit(1);
  }

  let body = args.body || '';
  if (args['body-file']) {
    body = readFileSync(args['body-file'], 'utf-8');
  }

  const isHtml = args.html || looksLikeHTML(body);

  // Wrap with signature if flags set
  if (isHtml && args['sig-en']) {
    body = wrapEmailHTML(body, true);
  } else if (isHtml && args['sig-pl']) {
    body = wrapEmailHTML(body, false);
  }

  try {
    const result = await gmailCreateDraft(accessToken, args.to, args.subject, body, args['thread-id'], { html: isHtml });
    console.log(`OK: Draft created${isHtml ? ' (HTML)' : ''} — ID: ${result.id}`);
  } catch (err) {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
