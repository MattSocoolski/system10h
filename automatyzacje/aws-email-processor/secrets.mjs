// secrets.mjs — Secrets Manager loader with in-memory caching
// Secrets are fetched once per Lambda cold start, then cached for the container lifetime.
// On warm invocations the cached value is reused (no extra API call).

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const SECRET_NAME = process.env.SECRET_NAME || 'artnapi-email-processor/credentials';
const REGION = process.env.AWS_REGION || 'eu-north-1';

const client = new SecretsManagerClient({ region: REGION });

let _cached = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min — refresh within a long-running container

/**
 * Returns parsed secrets object with keys:
 *   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN,
 *   NOTION_API_KEY, TELEGRAM_BOT_TOKEN
 */
export async function getSecrets() {
  const now = Date.now();
  if (_cached && (now - _cachedAt) < CACHE_TTL_MS) {
    return _cached;
  }

  const res = await client.send(new GetSecretValueCommand({
    SecretId: SECRET_NAME,
  }));

  _cached = JSON.parse(res.SecretString);
  _cachedAt = now;
  return _cached;
}
