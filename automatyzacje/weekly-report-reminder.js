#!/usr/bin/env node
// WEEKLY REPORT REMINDER — Telegram push every Thursday 8:30
// Przypomina o raporcie tygodniowym dla Piotra
// Cron: czwartek 8:30 (LaunchAgent)

import { loadEnv, sendTelegram } from './lib.js';

loadEnv();

const msg = [
  '<b>RAPORT TYGODNIOWY — deadline dziś</b>',
  '',
  'Uruchom:',
  '<code>node automatyzacje/generate-weekly-report.js</code>',
  '',
  'Uzupełnij ręcznie:',
  '• Rozmowy handlowe (ile, z kim)',
  '• Nowi klienci (kto, skąd)',
  '• Sztuki sprzedane (suma)',
  '• Komentarz (1-2 zdania)',
  '',
  'Spec: materialy-artnapi/2026-03-06_spec_raport_tygodniowy.md'
].join('\n');

sendTelegram(msg)
  .then(() => console.log('[REMINDER] Weekly report reminder sent'))
  .catch(err => {
    console.error('[REMINDER] ERROR:', err.message);
    process.exit(1);
  });
