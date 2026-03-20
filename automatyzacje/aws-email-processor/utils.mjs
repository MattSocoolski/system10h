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

/**
 * Determine if a lead is foreign (non-Polish) based on country or email TLD.
 */
export function isForeignLead(lead) {
  const country = (lead.country || '').toUpperCase();
  if (country && country !== 'PL' && country !== 'POLSKA' && country !== 'POLAND') {
    return true;
  }
  if (!country && lead.email) {
    const tld = lead.email.split('.').pop().toLowerCase();
    const foreignTLDs = [
      'cz', 'sk', 'hu', 'lt', 'lv', 'ee', 'de', 'nl', 'fr', 'se', 'dk',
      'at', 'ro', 'bg', 'hr', 'si', 'fi', 'no', 'be', 'pt', 'es', 'it', 'ie', 'uk', 'ch'
    ];
    return foreignTLDs.includes(tld);
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

  // If draft links to calculator, prices are dynamic — skip validation
  if (draftBody.includes('B2B-Price-Calculator') || draftBody.includes('artnapi.pl/kalkulator')) {
    return { valid: true };
  }

  // Extract price patterns: digits with comma/dot + currency
  const priceRegex = /(\d+[,\.]\d{1,2})\s*(PLN|EUR|zł|zl|euro|€)/gi;
  const matches = [...draftBody.matchAll(priceRegex)];

  if (matches.length === 0) return { valid: true };

  const badPrices = [];
  for (const m of matches) {
    const priceStr = m[1]; // e.g. "12,50"
    // Normalize: replace comma with dot for comparison, and vice versa
    const withDot = priceStr.replace(',', '.');
    const withComma = priceStr.replace('.', ',');
    // Check if either form appears in oferta
    if (!ofertaText.includes(withDot) && !ofertaText.includes(withComma) && !ofertaText.includes(priceStr)) {
      badPrices.push(m[0]);
    }
  }

  if (badPrices.length > 0) {
    return { valid: false, detail: `Prices not in oferta.md: ${badPrices.join(', ')}` };
  }
  return { valid: true };
}

/**
 * Validate draft does not contain commitment/legal words that require human review.
 */
export function validateNoCommitments(draftBody) {
  if (!draftBody) return { valid: true };
  const forbidden = [
    'gwarantujemy', 'obiecujemy', 'zobowiązujemy się', 'zobowiazujemy sie',
    'umowa', 'kontrakt',
    'we guarantee', 'we promise', 'we commit', 'contract', 'binding agreement'
  ];
  const lower = draftBody.toLowerCase();
  for (const word of forbidden) {
    if (lower.includes(word)) {
      return { valid: false, detail: `Forbidden commitment word: "${word}"` };
    }
  }
  return { valid: true };
}

// --- HTML Email Signatures ---
const HTML_SIGNATURE_PL = `<p style="margin-top: 16px; line-height: 1.6;">
<strong>Sokólski Mateusz</strong><br>
key account manager w <a href="https://artnapi.pl" style="color: #1a73e8; text-decoration: none;">artnapi.pl</a><br>
<a href="mailto:mateusz.sokolski@artnapi.pl" style="color: #1a73e8; text-decoration: none;">mateusz.sokolski@artnapi.pl</a> | <a href="tel:+48534852707" style="color: #1a73e8; text-decoration: none;">+48 534 852 707</a>
</p>`;

const HTML_SIGNATURE_EN = `<p style="margin-top: 16px; line-height: 1.6;">
<strong>Mateusz Sokólski</strong><br>
Key Account Manager at <a href="https://artnapi.pl" style="color: #1a73e8; text-decoration: none;">artnapi.pl</a><br>
<a href="mailto:mateusz.sokolski@artnapi.pl" style="color: #1a73e8; text-decoration: none;">mateusz.sokolski@artnapi.pl</a> | <a href="tel:+48534852707" style="color: #1a73e8; text-decoration: none;">+48 534 852 707</a>
</p>`;

/**
 * Wrap HTML email body with consistent styling and the appropriate signature.
 */
export function wrapEmailHTML(bodyContent, isEnglish = false) {
  const signature = isEnglish ? HTML_SIGNATURE_EN : HTML_SIGNATURE_PL;
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
