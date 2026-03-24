#!/usr/bin/env node
// setup-pubsub.mjs — One-time setup for Gmail Push Notifications via Google Cloud Pub/Sub
// Creates topic, subscription, IAM binding, and registers Gmail watch.
//
// Usage: node setup-pubsub.mjs
// Requires: interactive browser login (one-time OAuth with Pub/Sub scope)

import { createInterface } from 'readline';
import { exec } from 'child_process';

const PROJECT_ID = 'gmail-claude-draft';
const TOPIC_NAME = 'artnapi-gmail-push';
const SUBSCRIPTION_NAME = 'artnapi-gmail-push';
const FULL_TOPIC = `projects/${PROJECT_ID}/topics/${TOPIC_NAME}`;
const FULL_SUBSCRIPTION = `projects/${PROJECT_ID}/subscriptions/${SUBSCRIPTION_NAME}`;
const API_GATEWAY_URL = 'https://p8cke5vxsl.execute-api.eu-north-1.amazonaws.com/webhook';

// OAuth credentials loaded from AWS Secrets Manager (never hardcode)
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/pubsub',
].join(' ');

const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

async function apiCall(url, { method = 'GET', token, body } = {}) {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : {} };
}

async function main() {
  console.log('\n=== Gmail Push Notification Setup ===\n');

  // Step 1: OAuth with Pub/Sub scope
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;

  console.log('1. Otwieram przegladarke — zaloguj sie na konto mateusz.sokolski@artnapi.pl');
  console.log('2. Zaakceptuj uprawnienia (Gmail + Pub/Sub)');
  console.log('3. Skopiuj kod autoryzacyjny i wklej ponizej\n');

  openBrowser(authUrl);

  const code = await ask('Wklej kod autoryzacyjny: ');

  // Exchange code for access token
  console.log('\nWymieniam kod na token...');
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    console.error(`OAuth error: ${tokenData.error} — ${(tokenData.error_description || '').slice(0, 200)}`);
    process.exit(1);
  }

  const token = tokenData.access_token;
  console.log('Token OK.\n');

  // Step 2: Create Pub/Sub topic
  console.log(`2. Tworzenie topic: ${FULL_TOPIC}...`);
  const topicRes = await apiCall(
    `https://pubsub.googleapis.com/v1/${FULL_TOPIC}`,
    { method: 'PUT', token }
  );

  if (topicRes.ok) {
    console.log('   Topic utworzony.');
  } else if (topicRes.status === 409) {
    console.log('   Topic juz istnieje — OK.');
  } else {
    console.error(`   BLAD: ${topicRes.status}`, topicRes.data);
    process.exit(1);
  }

  // Step 3: Grant Gmail push publish access
  console.log('3. Ustawiam IAM — gmail-api-push publish access...');

  // Get current IAM policy
  const policyRes = await apiCall(
    `https://pubsub.googleapis.com/v1/${FULL_TOPIC}:getIamPolicy`,
    { method: 'GET', token }
  );

  const policy = policyRes.ok ? policyRes.data : { bindings: [] };
  const bindings = policy.bindings || [];

  // Check if gmail-api-push already has publish access
  const publishBinding = bindings.find(b => b.role === 'roles/pubsub.publisher');
  const gmailSA = 'serviceAccount:gmail-api-push@system.gserviceaccount.com';

  if (publishBinding && publishBinding.members?.includes(gmailSA)) {
    console.log('   IAM juz skonfigurowany — OK.');
  } else {
    if (publishBinding) {
      publishBinding.members = [...(publishBinding.members || []), gmailSA];
    } else {
      bindings.push({ role: 'roles/pubsub.publisher', members: [gmailSA] });
    }

    const setRes = await apiCall(
      `https://pubsub.googleapis.com/v1/${FULL_TOPIC}:setIamPolicy`,
      { method: 'POST', token, body: { policy: { bindings } } }
    );

    if (setRes.ok) {
      console.log('   IAM ustawiony.');
    } else {
      console.error(`   BLAD IAM: ${setRes.status}`, setRes.data);
      process.exit(1);
    }
  }

  // Step 4: Create push subscription
  console.log(`4. Tworzenie subscription: ${SUBSCRIPTION_NAME} -> ${API_GATEWAY_URL}...`);
  const subRes = await apiCall(
    `https://pubsub.googleapis.com/v1/${FULL_SUBSCRIPTION}`,
    {
      method: 'PUT',
      token,
      body: {
        topic: FULL_TOPIC,
        pushConfig: {
          pushEndpoint: API_GATEWAY_URL,
        },
        ackDeadlineSeconds: 60,
        messageRetentionDuration: '600s',
        expirationPolicy: {}, // never expire
      },
    }
  );

  if (subRes.ok) {
    console.log('   Subscription utworzona.');
  } else if (subRes.status === 409) {
    console.log('   Subscription juz istnieje — OK.');
  } else {
    console.error(`   BLAD: ${subRes.status}`, subRes.data);
    process.exit(1);
  }

  // Step 5: Register Gmail watch
  console.log('5. Rejestracja Gmail watch...');
  const watchRes = await apiCall(
    'https://www.googleapis.com/gmail/v1/users/me/watch',
    {
      method: 'POST',
      token,
      body: {
        topicName: FULL_TOPIC,
        labelIds: ['INBOX'],
      },
    }
  );

  if (watchRes.ok) {
    const expiry = new Date(Number(watchRes.data.expiration));
    console.log(`   Watch zarejestrowany! historyId=${watchRes.data.historyId}, wygasa: ${expiry.toISOString()}`);
  } else {
    console.error(`   BLAD watch: ${watchRes.status}`, watchRes.data);
    process.exit(1);
  }

  // Step 6: Update Lambda env var
  console.log(`\n6. Aktualizacja Lambda watch-renewal (GMAIL_PUBSUB_TOPIC)...`);

  // Done — print summary
  console.log('\n=== GOTOWE ===');
  console.log(`Topic:        ${FULL_TOPIC}`);
  console.log(`Subscription: ${FULL_SUBSCRIPTION} -> ${API_GATEWAY_URL}`);
  console.log(`Watch:        aktywny do ${new Date(Number(watchRes.data.expiration)).toISOString()}`);
  console.log(`\nZostalo: ustaw GMAIL_PUBSUB_TOPIC w Lambda watch-renewal (robi Claude po zakonczeniu skryptu).`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
