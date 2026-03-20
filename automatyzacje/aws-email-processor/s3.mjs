// s3.mjs — S3 knowledge base loader with in-memory caching
// Loads oferta.md and ghost_styl.md from S3. Caches per Lambda invocation
// (reset on cold start, fresh on each invocation within warm container via TTL).

import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = process.env.S3_BUCKET || 'artnapi-email-processor-kb';
const REGION = process.env.AWS_REGION || 'eu-west-1';

const client = new S3Client({ region: REGION });

// Per-invocation cache (cleared after Lambda timeout or between cold starts)
const _cache = {};
const _cacheAt = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Load a text file from S3 (with caching).
 * @param {string} key — S3 object key (e.g. 'oferta.md')
 * @returns {string} — file contents as UTF-8 text
 */
export async function loadS3File(key) {
  const now = Date.now();
  if (_cache[key] && (now - (_cacheAt[key] || 0)) < CACHE_TTL_MS) {
    return _cache[key];
  }

  const res = await client.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));

  const text = await res.Body.transformToString('utf-8');
  _cache[key] = text;
  _cacheAt[key] = now;
  return text;
}

/**
 * Check if a file in S3 is stale (not updated in more than `maxAgeHours` hours).
 * Returns { stale: boolean, lastModified: Date|null, ageHours: number }.
 * Used for Edge Case 2 detection (stale oferta.md).
 */
export async function checkStaleness(key, maxAgeHours = 48) {
  try {
    const res = await client.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    const lastModified = res.LastModified;
    const ageMs = Date.now() - lastModified.getTime();
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    return {
      stale: ageHours > maxAgeHours,
      lastModified,
      ageHours,
    };
  } catch (err) {
    console.error(`[S3] Failed to check staleness for ${key}:`, err.message);
    return { stale: false, lastModified: null, ageHours: 0 };
  }
}
