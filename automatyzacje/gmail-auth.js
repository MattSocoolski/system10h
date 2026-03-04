#!/usr/bin/env node
// GMAIL OAUTH 2.0 SETUP — jednorazowy skrypt
// Otwiera przeglądarkę → user loguje się → zapisuje refresh_token do .env
// Uruchomienie: node automatyzacje/gmail-auth.js
//
// WYMAGANIA:
// 1. Google Cloud Console → APIs & Services → Enable Gmail API
// 2. Credentials → Create OAuth 2.0 Client ID (typ: Desktop Application)
// 3. Wpisz GMAIL_CLIENT_ID i GMAIL_CLIENT_SECRET do .env PRZED uruchomieniem

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENV_PATH = join(ROOT, '.env');

// Load .env
function loadEnvRaw() {
  if (!existsSync(ENV_PATH)) throw new Error('.env not found at ' + ENV_PATH);
  return readFileSync(ENV_PATH, 'utf-8');
}

function getEnvValue(content, key) {
  const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

function setEnvValue(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  return content.trimEnd() + `\n${key}=${value}\n`;
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose'
].join(' ');

const REDIRECT_PORT = 8844;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

async function run() {
  console.log('=== GMAIL OAUTH 2.0 SETUP ===\n');

  let envContent = loadEnvRaw();
  const clientId = getEnvValue(envContent, 'GMAIL_CLIENT_ID');
  const clientSecret = getEnvValue(envContent, 'GMAIL_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('BRAK GMAIL_CLIENT_ID lub GMAIL_CLIENT_SECRET w .env');
    console.error('\nKROKI:');
    console.error('1. Wejdz na https://console.cloud.google.com/');
    console.error('2. APIs & Services → Enable Gmail API');
    console.error('3. Credentials → Create OAuth 2.0 Client ID (Desktop)');
    console.error('4. Dodaj do .env:');
    console.error('   GMAIL_CLIENT_ID=twoj_client_id');
    console.error('   GMAIL_CLIENT_SECRET=twoj_client_secret');
    console.error('5. Odpal ponownie: node automatyzacje/gmail-auth.js');
    process.exit(1);
  }

  // Build authorization URL
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent'
  }).toString();

  // Start local server to receive callback
  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const authCode = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Blad autoryzacji</h1><p>' + error + '</p>');
        server.close();
        reject(new Error('Auth error: ' + error));
        return;
      }

      if (authCode) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Autoryzacja OK!</h1><p>Mozesz zamknac te karte. Wroc do terminala.</p>');
        server.close();
        resolve(authCode);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`Serwer callback na http://localhost:${REDIRECT_PORT}/callback`);
      console.log('\nOtwieram przegladarke...\n');
      exec(`open "${authUrl}"`);
      console.log('Jesli przegladarka sie nie otworzy, wklej ten URL recznie:');
      console.log(authUrl + '\n');
      console.log('Czekam na autoryzacje...');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout — brak autoryzacji w ciagu 5 minut'));
    }, 5 * 60 * 1000);
  });

  console.log('\nOtrzymano kod autoryzacji. Wymieniam na tokeny...');

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString()
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    console.error('Blad wymiany tokenu:', tokenData.error, tokenData.error_description);
    process.exit(1);
  }

  if (!tokenData.refresh_token) {
    console.error('Brak refresh_token w odpowiedzi. Sprobuj usunac dostep w:');
    console.error('https://myaccount.google.com/permissions → usun aplikacje → odpal ponownie');
    process.exit(1);
  }

  // Save to .env
  envContent = loadEnvRaw(); // reload fresh
  envContent = setEnvValue(envContent, 'GMAIL_REFRESH_TOKEN', tokenData.refresh_token);
  writeFileSync(ENV_PATH, envContent);

  console.log('\n=== SUKCES ===');
  console.log('GMAIL_REFRESH_TOKEN zapisany w .env');
  console.log('Access token wazny: ' + tokenData.expires_in + ' sekund');
  console.log('\nMozesz teraz uruchomic: node automatyzacje/morning-scan.js');
}

run().catch(err => {
  console.error('\nBLAD:', err.message);
  process.exit(1);
});
