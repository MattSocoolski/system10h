// bedrock.mjs — Bedrock Claude Sonnet integration
// Two functions: classifyEmail (DECISION vs STANDARD) and generateDraft.

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-sonnet-4-6-20250514-v1:0';
const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';

const client = new BedrockRuntimeClient({ region: BEDROCK_REGION });

/**
 * Invoke Bedrock Claude with given system + user prompts.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} [options]
 * @param {number} [options.maxTokens=1000]
 * @param {number} [options.temperature=0.3]
 * @returns {string} — model response text
 */
async function invokeBedrock(systemPrompt, userPrompt, { maxTokens = 1000, temperature = 0.3 } = {}) {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    top_p: 0.9,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));

  if (!result.content || !result.content[0]) {
    throw new Error('Bedrock returned empty response');
  }

  return result.content[0].text;
}

// --- Classification ---

const CLASSIFY_SYSTEM = `Jestes klasyfikatorem maili B2B. Odpowiadasz TYLKO w formacie:
TYPE: DECISION lub STANDARD
REASON: 1 zdanie powodu

DECISION = mail wymaga ludzkiej decyzji:
- Negocjacja cenowa (klient proponuje inna cene, pyta o rabat powyzej standardowego progu)
- Reklamacja / zwrot / problem z towarem
- Nowy partner / dystrybutor (propozycja wspolpracy)
- Pytanie prawne / umowa / kontrakt
- Eskalacja / zlosc klienta
- Zamowienie na niestandardowe produkty (spoza cennika)

STANDARD = mail na ktory mozna odpowiedziec automatycznie:
- Zapytanie o cene (odpowiedz: cennik z oferty)
- Zapytanie o dostepnosc / stany magazynowe
- Follow-up / potwierdzenie zamowienia
- Pytanie o wysylke / tracking
- Podziekowanie / potwierdzenie odbioru
- Prosta odpowiedz na wczesniejszego maila
- Pytanie o MOQ / progi paletowe
- Prosby o proformy / faktury (standardowe)`;

/**
 * Classify an incoming email as DECISION or STANDARD.
 * @param {object} email — { from, subject, bodyText, snippet }
 * @param {object|null} lead — parsed CRM lead or null
 * @param {string} ofertaText — contents of oferta.md
 * @returns {{ type: 'DECISION'|'STANDARD', reason: string }}
 */
export async function classifyEmail(email, lead, ofertaText) {
  const leadContext = lead
    ? `Status CRM: ${lead.status} | Segment: ${lead.segment} | Wartosc: ${lead.value || 'brak'} PLN | Kraj: ${lead.country || 'PL'}`
    : 'Lead NIE JEST w CRM (nowy/nieznany nadawca)';

  const body = email.bodyText || email.snippet || '[brak tresci]';

  const userPrompt = `Mail od: ${email.from}
Temat: ${email.subject}
Tresc: ${body.slice(0, 1500)}

Lead CRM: ${leadContext}

Odpowiedz w formacie:
TYPE: DECISION lub STANDARD
REASON: 1 zdanie`;

  const raw = await invokeBedrock(CLASSIFY_SYSTEM, userPrompt, { maxTokens: 100, temperature: 0.1 });

  // Parse response
  const typeMatch = raw.match(/TYPE:\s*(DECISION|STANDARD)/i);
  const reasonMatch = raw.match(/REASON:\s*(.+)/i);

  return {
    type: typeMatch ? typeMatch[1].toUpperCase() : 'DECISION', // default to DECISION (safer)
    reason: reasonMatch ? reasonMatch[1].trim() : raw.trim(),
  };
}

// --- Draft Generation ---

/**
 * Generate a draft reply email using Bedrock Claude Sonnet.
 *
 * @param {object} params
 * @param {string} params.ghostStyl — ghost_styl.md contents (system prompt for writing style)
 * @param {string} params.oferta — oferta.md contents (pricing source of truth)
 * @param {object} params.email — { from, subject, bodyText, snippet }
 * @param {Array} params.thread — thread messages [{ from, subject, date, snippet }]
 * @param {object|null} params.lead — parsed CRM lead
 * @param {boolean} params.isForeign — true if lead is non-Polish
 * @returns {string} — HTML body for the draft (without signature — added by wrapEmailHTML)
 */
export async function generateDraft({ ghostStyl, oferta, email, thread, lead, isForeign }) {
  const lang = isForeign ? 'angielski' : 'polski';

  const systemPrompt = `${ghostStyl}

Jestes asystentem Mateusza Sokolskiego, Key Account Managera w ArtNapi.
Piszesz odpowiedzi na maile B2B w jego stylu.

REGULY:
1. Ton: profesjonalny ale bezposredni, bez korporacyjnego slowo-toku
2. Jezyk: ${lang}
3. Ceny: TYLKO z CENNIKA ponizej. NIGDY nie wymyslaj cen.
4. MOQ: Zgodne z cennikiem (np. podobrazia od 120 szt)
5. Progi paletowe: Zawsze proponuj dobicie do pelnej palety jesli oplacalne
6. USP: Podkresaj dostepnosc 24h, magazyn w Polsce, ceny all-in z dostawa
7. Dlugosc: Krotko — max 5-8 zdan. Lead chce konkret, nie esej.
8. NIE obiecuj czegos czego nie ma w ofercie
9. Zamknij pytaniem lub propozycja nastepnego kroku
10. NIE dodawaj stopki/podpisu — jest dodawana automatycznie
11. NIGDY nie obiecuj terminow dostaw, gwarancji, ani zobowiazan prawnych. Odeslij do kontaktu z Mateuszem.
12. NIGDY nie uzywaj slow: "gwarantujemy", "obiecujemy", "zobowiazujemy sie", "umowa", "kontrakt"
13. Format: pisz w HTML (uzyj <p>, <br>, <strong> itp.). NIE uzywaj Markdown.
14. Na gorze dodaj: <p><em>[AUTO-DRAFT — review before sending]</em></p>`;

  // Build thread summary
  const threadSummary = thread.length > 0
    ? thread.map(m => `[${m.date}] ${m.from}: ${m.snippet}`).join('\n')
    : '(brak historii watku)';

  // Build lead context
  const leadContext = lead
    ? `Firma: ${lead.company || 'brak'}
Osoba: ${lead.contact || 'brak'}
Status: ${lead.status || 'brak'}
Segment: ${lead.segment || 'brak'}
Kraj: ${lead.country || 'PL'}
Ostatni kontakt: ${lead.lastContact ? lead.lastContact.toISOString().slice(0, 10) : 'brak'}
Notatki: ${lead.notes || 'brak'}`
    : 'Lead NIE jest w CRM (nowy nadawca)';

  const body = email.bodyText || email.snippet || '[brak tresci]';

  const userPrompt = `MAIL OD LEADA:
Od: ${email.from}
Temat: ${email.subject}
Tresc:
${body.slice(0, 2000)}

WATEK (historia):
${threadSummary}

LEAD Z CRM:
${leadContext}

CENNIK (source of truth):
${oferta}

Napisz odpowiedz na tego maila w HTML.`;

  const draft = await invokeBedrock(systemPrompt, userPrompt, { maxTokens: 1000, temperature: 0.3 });
  return draft;
}
