// utils.mjs — Pure helper functions (no AWS dependencies)

/**
 * Extract bare email address from a header value like "Name <email@example.com>"
 */
export function extractEmail(headerValue) {
  if (!headerValue) return '';
  const match = headerValue.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : headerValue.toLowerCase().trim();
}

/**
 * Extract display name from a header value like "Name <email@example.com>"
 */
export function extractName(headerValue) {
  if (!headerValue) return '';
  const match = headerValue.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : headerValue.split('@')[0];
}

// Default foreign TLDs (backward compatibility when no tenant config is passed)
const DEFAULT_FOREIGN_TLDS = [
  'cz', 'sk', 'hu', 'lt', 'lv', 'ee', 'de', 'nl', 'fr', 'se', 'dk',
  'at', 'ro', 'bg', 'hr', 'si', 'fi', 'no', 'be', 'pt', 'es', 'it', 'ie', 'uk', 'ch',
];

/**
 * Determine if a lead is foreign (non-Polish) based on country or email TLD.
 * @param {object} lead — parsed CRM lead
 * @param {string[]} [foreignTLDs] — list of foreign TLDs. If omitted, uses default list.
 */
export function isForeignLead(lead, foreignTLDs = null) {
  const tlds = foreignTLDs || DEFAULT_FOREIGN_TLDS;
  const country = (lead.country || '').toUpperCase();
  if (country && country !== 'PL' && country !== 'POLSKA' && country !== 'POLAND') {
    return true;
  }
  if (!country && lead.email) {
    const tld = lead.email.split('.').pop().toLowerCase();
    return tlds.includes(tld);
  }
  return false;
}

/**
 * Add N business days to a date (skip weekends).
 */
export function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/**
 * Validate that any prices mentioned in draft text exist in oferta.md content.
 *
 * Returns { valid: true } or { valid: false, detail: string }
 *
 * Logic:
 * - If draft references the B2B calculator URL, skip price check (calculator handles it).
 * - Extract all price-like patterns from draft (e.g. "12,50 PLN", "3.20 EUR").
 * - Each extracted price must appear somewhere in oferta text.
 */
export function validatePricesInDraft(draftBody, ofertaText) {
  if (!draftBody || !ofertaText) return { valid: true };

  // Extract price patterns: integers and decimals with optional thousand separators + currency
  const priceRegex = /(\d[\d\s]*(?:[,\.]\d{1,2})?)\s*(PLN|EUR|zł|zl|euro|€)/gi;
  const matches = [...draftBody.matchAll(priceRegex)];

  if (matches.length === 0) return { valid: true };

  const badPrices = [];
  for (const m of matches) {
    const priceStr = m[1].replace(/\s/g, ''); // strip thousand separators e.g. "1 250,00" -> "1250,00"
    // Normalize: replace comma with dot for comparison, and vice versa
    const withDot = priceStr.replace(',', '.');
    const withComma = priceStr.replace('.', ',');
    // Also check original (with spaces) and without thousand dots
    const noThousandDot = priceStr.replace(/\.(\d{3})/g, '$1'); // "1.250,00" -> "1250,00"
    // Check if any form appears in oferta
    const found = [priceStr, withDot, withComma, noThousandDot].some(v => ofertaText.includes(v));
    if (!found) {
      badPrices.push(m[0]);
    }
  }

  if (badPrices.length > 0) {
    return { valid: false, detail: `Prices not in oferta.md: ${badPrices.join(', ')}` };
  }
  return { valid: true };
}

// Default forbidden words (backward compatibility when no tenant config is passed)
const DEFAULT_FORBIDDEN_WORDS = [
  // PL commitments
  'gwarantujemy', 'gwarancja', 'obiecujemy', 'zobowiązujemy się', 'zobowiazujemy sie',
  'umowa', 'kontrakt', 'zapewniamy', 'deklarujemy', 'podpisujemy', 'na pewno',
  // EN commitments
  'we guarantee', 'guaranteed', 'we promise', 'we commit', 'we assure', 'we ensure',
  'contract', 'binding agreement', 'agreement',
  // PL discounts (unauthorized offers)
  'rabat', 'zniżka', 'znizka', 'specjalna cena', 'promocja', 'obniżka', 'obnizka',
  // EN discounts
  'discount', 'special price', 'special offer', 'reduced price',
];

const DEFAULT_DELIVERY_TIME_REGEX = '(?:dostarczymy|delivery|wysylka|shipping).{0,30}(?:\\d+\\s*(?:dni|days|hours|godzin|h))';

/**
 * Validate draft does not contain commitment/legal words that require human review.
 * @param {string} draftBody — draft email body text
 * @param {object} [guardrails] — { forbiddenWords: string[], deliveryTimeRegex: string }. If omitted, uses defaults.
 */
export function validateNoCommitments(draftBody, guardrails = null) {
  if (!draftBody) return { valid: true };
  const forbidden = guardrails?.forbiddenWords || DEFAULT_FORBIDDEN_WORDS;
  const deliveryRegexStr = guardrails?.deliveryTimeRegex || DEFAULT_DELIVERY_TIME_REGEX;
  const lower = draftBody.toLowerCase();
  for (const word of forbidden) {
    if (lower.includes(word)) {
      return { valid: false, detail: `Forbidden word: "${word}"` };
    }
  }
  // Check for delivery time commitments (regex)
  if (new RegExp(deliveryRegexStr, 'i').test(draftBody)) {
    return { valid: false, detail: 'Delivery time commitment detected' };
  }
  return { valid: true };
}

// --- HTML Email Signatures ---
// Default signatures (backward compatibility when no tenant config is passed)
const DEFAULT_SIGNATURE_PL = `<p style="margin-top: 16px; line-height: 1.6;">
<strong>Sokólski Mateusz</strong><br>
key account manager w <a href="https://artnapi.pl" style="color: #1a73e8; text-decoration: none;">artnapi.pl</a><br>
<a href="mailto:mateusz.sokolski@artnapi.pl" style="color: #1a73e8; text-decoration: none;">mateusz.sokolski@artnapi.pl</a> | <a href="tel:+48534852707" style="color: #1a73e8; text-decoration: none;">+48 534 852 707</a>
</p>`;

const DEFAULT_SIGNATURE_EN = `<p style="margin-top: 16px; line-height: 1.6;">
<strong>Mateusz Sokólski</strong><br>
Key Account Manager at <a href="https://artnapi.pl" style="color: #1a73e8; text-decoration: none;">artnapi.pl</a><br>
<a href="mailto:mateusz.sokolski@artnapi.pl" style="color: #1a73e8; text-decoration: none;">mateusz.sokolski@artnapi.pl</a> | <a href="tel:+48534852707" style="color: #1a73e8; text-decoration: none;">+48 534 852 707</a>
</p>`;

/**
 * Wrap HTML email body with consistent styling and the appropriate signature.
 * @param {string} bodyContent — HTML body content
 * @param {boolean} [isEnglish=false] — use English signature
 * @param {object} [tenantConfig] — tenant config with signaturePL/signatureEN. If omitted, uses defaults.
 */
export function wrapEmailHTML(bodyContent, isEnglish = false, tenantConfig = null) {
  let signature;
  if (isEnglish) {
    signature = tenantConfig?.signatureEN || DEFAULT_SIGNATURE_EN;
  } else {
    signature = tenantConfig?.signaturePL || DEFAULT_SIGNATURE_PL;
  }
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
${bodyContent}
${signature}
</div>`;
}

/**
 * Mask email for safe logging: "ma***@firma.pl"
 */
export function maskEmail(email) {
  if (!email) return '[unknown]';
  return email.replace(/(.{2}).*@/, '$1***@');
}

/**
 * Safe logger — redacts sensitive fields before console.log.
 */
export function safeLog(msg, data = {}) {
  const safe = { ...data };
  if (safe.email) safe.email = maskEmail(safe.email);
  if (safe.from) safe.from = maskEmail(safe.from);
  if (safe.to) safe.to = maskEmail(safe.to);
  if (safe.body) safe.body = '[REDACTED]';
  if (safe.snippet) safe.snippet = (safe.snippet || '').slice(0, 50) + '...';
  if (safe.draftBody) safe.draftBody = '[REDACTED]';
  console.log(msg, JSON.stringify(safe));
}
