# AWS EMAIL PROCESSOR — ARCHITEKTURA MVP

> Autor: @cto | Data: 2026-03-17
> Status: GOTOWE DO WDROZENIA (18.03.2026)
> Tryb: ARTNAPI

---

## A. OVERVIEW

### Cel
Email od leada CRM -> gotowy draft odpowiedzi w Gmail w <2 min, 24/7, bez Maca.

### Model
Hybryda: AWS (autonomous, 24/7) + Mac (interactive, sesje @ceo/@ghost w Claude Code).

### Komponenty
- **API Gateway** — endpoint dla Gmail Push webhook
- **Lambda** — logika przetwarzania (email-processor)
- **S3** — knowledge base (oferta.md, ghost_styl.md)
- **DynamoDB** — state (processedIds, dedup)
- **Bedrock** — Claude Sonnet (generowanie draftow)
- **Secrets Manager** — Gmail OAuth, Notion API, Telegram Bot
- **EventBridge** — fallback polling co 15 min
- **Gmail API** — odczyt inbox, tworzenie draftow
- **Notion API** — CRM (query lead, update Due/kontakt)
- **Telegram API** — alerty do usera

### Diagram Flow (ASCII)

```
                    TRIGGER (jedno z dwoch)
                    ========================

    [Gmail Push Notification]        [EventBridge: co 15 min]
         |  (via Pub/Sub)                      |
         v                                     v
    [API Gateway]                    [Lambda: poller]
         |  POST /webhook                      |
         v                                     v
    =============================================
    |        LAMBDA: email-processor            |
    |                                           |
    | 1. Gmail API: pobierz nowe maile          |
    | 2. DynamoDB: dedup (processedIds)         |
    | 3. Dla kazdego nowego maila:              |
    |    a. DRAFT QUALITY GUARD                 |
    |       Gmail API: sprawdz SENT w watku     |
    |       Juz odpowiedziano? -> SKIP          |
    |    b. KONTEKST                            |
    |       S3: oferta.md + ghost_styl.md       |
    |       Notion API: lead po emailu          |
    |       Gmail API: pelny watek              |
    |    c. KLASYFIKACJA (Bedrock)              |
    |       DECYZJA? -> Telegram alert, no draft|
    |       STANDARD? -> generuj draft          |
    |    d. DRAFT (Bedrock Claude Sonnet)       |
    |       System: ghost_styl.md               |
    |       User: mail + CRM + oferta + watek   |
    |       Guardrail: cena = oferta.md         |
    |    e. DOSTARCZENIE                        |
    |       Gmail API: draft (reply in thread)  |
    |       Notion API: Due +3d, kontakt = dzis |
    |       Telegram: "Draft gotowy: [firma]"   |
    |                                           |
    | 4. DynamoDB: zapisz processedIds          |
    =============================================
```

---

## B. SZCZEGOLY KOMPONENTOW

### B1. S3 Bucket (Knowledge Base)

**Bucket:** `artnapi-email-processor-kb`
**Region:** eu-west-1
**Encryption:** AES-256 (SSE-S3)
**Access:** Tylko Lambda role (IAM policy)

**Pliki:**

| Plik | Zrodlo | Cel | Rozmiar ~  |
|------|--------|-----|-----------|
| `oferta.md` | dane/artnapi/oferta.md | Source of truth: ceny, MOQ, progi, USP | ~10 KB |
| `ghost_styl.md` | dane/ghost_styl.md | System prompt dla Bedrock (sekcja B2B Sprzedaz) | ~5 KB |
| `plan.md` | dane/artnapi/plan.md | Kontekst leadow (opcjonalnie — CRM ma wiecej) | ~15 KB |

**Sync (Git -> S3):**

Opcja A — Reczny (MVP):
```bash
aws s3 cp dane/artnapi/oferta.md s3://artnapi-email-processor-kb/oferta.md
aws s3 cp dane/ghost_styl.md s3://artnapi-email-processor-kb/ghost_styl.md
```

Opcja B — GitHub Actions (po MVP):
```yaml
# .github/workflows/sync-kb.yml
on:
  push:
    paths:
      - 'dane/artnapi/oferta.md'
      - 'dane/ghost_styl.md'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      - run: |
          aws s3 cp dane/artnapi/oferta.md s3://artnapi-email-processor-kb/oferta.md
          aws s3 cp dane/ghost_styl.md s3://artnapi-email-processor-kb/ghost_styl.md
```

---

### B2. Lambda: email-processor

**Runtime:** Node.js 20.x
**Memory:** 512 MB (Bedrock call moze potrzebowac wiecej RAM na response parsing)
**Timeout:** 120 sekund (Bedrock response + Gmail API calls)
**Handler:** `index.handler`
**Layers:** brak (natywny fetch w Node 20, AWS SDK v3 wbudowany)

**Trigger:**
- PRIMARY: API Gateway (Gmail Push webhook) — real-time, <2 min latency
- FALLBACK: EventBridge rule (co 15 min) — na wypadek awarii Push

**Environment Variables (z Secrets Manager):**

| Zmienna | Zrodlo | Opis |
|---------|--------|------|
| GMAIL_CLIENT_ID | Secrets Manager | OAuth Client ID |
| GMAIL_CLIENT_SECRET | Secrets Manager | OAuth Client Secret |
| GMAIL_REFRESH_TOKEN | Secrets Manager | OAuth Refresh Token |
| NOTION_API_KEY | Secrets Manager | Notion Internal Integration Secret |
| TELEGRAM_BOT_TOKEN | Secrets Manager | Bot @MattJarvis_Bot token |
| TELEGRAM_CHAT_ID | env | 1304598782 |
| S3_BUCKET | env | artnapi-email-processor-kb |
| NOTION_CRM_DATASOURCE_ID | env | 26f862e1-4a0c-808f-a249-000b2cee31df |
| BEDROCK_MODEL_ID | env | anthropic.claude-sonnet-4-6-20250514-v1:0 |
| BEDROCK_REGION | env | us-east-1 |
| MY_EMAIL | env | mateusz.sokolski@artnapi.pl |
| DYNAMO_TABLE | env | email-processor-state |

#### Logika Lambda (pseudokod)

```javascript
// index.mjs — Lambda handler
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// --- KLUCZOWE FUNKCJE (portowane z lib.js) ---

// 1. Gmail OAuth — gmailGetAccessToken()
//    Port z lib.js linia 253-291
//    Identyczna logika: refresh_token -> access_token
//    Roznica: sekrety z Secrets Manager zamiast .env

// 2. Gmail API calls — gmailSearchMessages(), gmailGetMessage(), gmailCreateDraft()
//    Port z lib.js linia 293-433
//    BEZ ZMIAN — te same endpointy i formaty

// 3. Notion API — queryCRM(), parseNotionLead()
//    Port z lib.js linia 68-137
//    Roznica: NOTION_API_KEY z Secrets Manager
//    NOTION_VERSION: '2025-09-03'
//    CRM_DATA_SOURCE_ID: '26f862e1-4a0c-808f-a249-000b2cee31df'

// 4. Telegram — sendTelegram()
//    Port z lib.js linia 28-48
//    Chat ID: 1304598782

// 5. Nowe: S3 knowledge base loader
// 6. Nowe: DynamoDB state (zamiast loadState/saveState z filesystem)
// 7. Nowe: Bedrock invoke (klasyfikacja + draft generation)

export async function handler(event) {
  const now = new Date();

  // --- KROK 1: Pobierz sekrety ---
  const secrets = await getSecrets();

  // --- KROK 2: Gmail — nowe maile ---
  const accessToken = await gmailGetAccessToken(secrets);
  const query = `to:${MY_EMAIL} is:inbox newer_than:1h -from:${MY_EMAIL} -category:promotions -category:social -category:updates`;
  const messages = await gmailSearchMessages(accessToken, query, 10);

  if (messages.length === 0) return { statusCode: 200, body: 'No new emails' };

  // --- KROK 3: DynamoDB dedup ---
  const processedIds = await getProcessedIds();
  const newMessages = messages.filter(m => !processedIds.includes(m.id));

  if (newMessages.length === 0) return { statusCode: 200, body: 'All already processed' };

  // --- KROK 4: CRM lookup ---
  const crmLeads = await queryCRM(secrets);
  const emailToLead = buildEmailIndex(crmLeads);

  // --- KROK 5: S3 Knowledge Base ---
  const oferta = await loadS3File('oferta.md');
  const ghostStyl = await loadS3File('ghost_styl.md');

  // --- KROK 6: Przetwarzaj kazdy mail ---
  for (const msg of newMessages) {
    const detail = await gmailGetMessage(accessToken, msg.id, 'full');
    const senderEmail = extractEmail(detail.from);

    if (senderEmail === MY_EMAIL) {
      await markProcessed(msg.id);
      continue;
    }

    // --- A. DRAFT QUALITY GUARD ---
    const sentInThread = await gmailSearchMessages(accessToken,
      `from:${MY_EMAIL} to:${senderEmail} in:sent newer_than:7d`, 5);

    if (sentInThread.length > 0) {
      await sendTelegram(secrets,
        `Mail od ${senderEmail}, ale juz odpowiedziano w watku. SKIP.`);
      await markProcessed(msg.id);
      continue;
    }

    // --- B. KONTEKST ---
    const lead = emailToLead[senderEmail];
    const threadMessages = await getThreadMessages(accessToken, detail.threadId);

    // --- C. KLASYFIKACJA (Bedrock) ---
    const classification = await classifyEmail(detail, lead, oferta);
    // classification.type: 'DECISION' | 'STANDARD'
    // classification.reason: string

    if (classification.type === 'DECISION') {
      const alertMsg = [
        `WYMAGA DECYZJI: ${lead?.name || senderEmail}`,
        `Temat: ${detail.subject}`,
        `Powod: ${classification.reason}`,
        `Snippet: ${detail.snippet?.slice(0, 200)}`,
        '',
        'Nie tworze draftu — przejdz do Gmail lub @ceo sesja.'
      ].join('\n');
      await sendTelegram(secrets, alertMsg);
      await markProcessed(msg.id);
      continue;
    }

    // --- D. DRAFT (Bedrock Claude Sonnet) ---
    const draftBody = await generateDraft({
      ghostStyl,
      oferta,
      email: detail,
      thread: threadMessages,
      lead,
      isForeign: lead ? isForeignLead(lead) : false
    });

    // --- GUARDRAIL: cena musi zgadzac sie z oferta.md ---
    const priceCheck = validatePricesInDraft(draftBody, oferta);
    if (!priceCheck.valid) {
      await sendTelegram(secrets,
        `GUARDRAIL: Draft dla ${senderEmail} zawieral bledna cene (${priceCheck.detail}). Draft NIE utworzony.`);
      await markProcessed(msg.id);
      continue;
    }

    // --- E. DOSTARCZENIE ---
    // Gmail: draft jako reply w watku
    const isEn = lead ? isForeignLead(lead) : false;
    const htmlBody = wrapEmailHTML(draftBody, isEn);
    await gmailCreateDraft(accessToken, senderEmail,
      `Re: ${detail.subject}`, htmlBody, detail.threadId, { html: true });

    // Notion: update lead
    if (lead) {
      await updateNotionLead(secrets, lead.id, {
        lastContact: now.toISOString().slice(0, 10),
        due: addBusinessDays(now, 3).toISOString().slice(0, 10)
      });
    }

    // Telegram: potwierdzenie
    await sendTelegram(secrets,
      `Draft gotowy: ${lead?.name || senderEmail} — "${detail.subject}"`);

    await markProcessed(msg.id);
  }

  return { statusCode: 200, body: `Processed ${newMessages.length} emails` };
}
```

#### Klasyfikacja emaila (Bedrock prompt)

```
SYSTEM: Jestes klasyfikatorem maili B2B. Odpowiadasz TYLKO jednym slowem: DECISION lub STANDARD.

DECISION = mail wymaga ludzkiej decyzji:
- Negocjacja cenowa (klient proponuje inna cene, pyta o rabat)
- Reklamacja / zwrot / problem z towarem
- Nowy partner / dystrybutor (propozycja wspolpracy)
- Pytanie prawne / umowa
- Eskalacja / zlosc klienta

STANDARD = mail na ktory mozna odpowiedziec automatycznie:
- Zapytanie o cene (odpowiedz: cennik z oferta.md)
- Zapytanie o dostepnosc (odpowiedz: tak, mamy na stanie)
- Follow-up / potwierdzenie zamowienia
- Pytanie o wysylke / tracking
- Podziekowanie / potwierdzenie odbioru
- Prosta odpowiedz na wczesniejszego maila

USER:
Mail od: {sender}
Temat: {subject}
Tresc: {body}
Lead CRM: {lead_status} | {lead_segment} | wartosc: {lead_value}
Historia watku: {thread_summary}

Odpowiedz: DECISION lub STANDARD + 1 zdanie powodu.
```

#### Generowanie draftu (Bedrock prompt)

```
SYSTEM: {ghost_styl.md — sekcja B2B Sprzedaz}

Jestes asystentem Mateusza Sokolskiego, Key Account Managera w ArtNapi.
Piszesz odpowiedzi na maile B2B w jego stylu.

REGULY:
1. Ton: profesjonalny ale bezposredni, bez korporacyjnego slowo-toku
2. Jezyk: polski dla leadow PL, angielski dla CEE/zagranicznych
3. Ceny: TYLKO z oferta.md. NIGDY nie wymyslaj cen.
4. MOQ: Zgodne z oferta.md (np. podobrazia od 120 szt)
5. Progi paletowe: Zawsze proponuj dobicie do pelnej palety jesli oplacalne
6. USP: Podkresaj dostepnosc 24h, magazyn w Polsce, ceny all-in z dostawa
7. Dlugosc: Krotko — max 5-8 zdan. Lead chce konkret, nie esej.
8. NIE obiecuj czegos czego nie ma w ofercie
9. Zamknij pytaniem lub propozycja nastepnego kroku
10. NIE dodawaj stopki — jest dodawana automatycznie

USER:
MAIL OD LEADA:
Od: {from}
Temat: {subject}
Tresc: {body}

WATEK (historia):
{thread_messages}

LEAD Z CRM:
Firma: {lead.company}
Osoba: {lead.contact}
Status: {lead.status}
Segment: {lead.segment}
Kraj: {lead.country}
Ostatni kontakt: {lead.lastContact}
Notatki: {lead.notes}

CENNIK (source of truth):
{oferta.md — sekcja CENNIK PALETOWY B2B}

Napisz odpowiedz na tego maila.
```

---

### B3. Gmail API Integration

**OAuth2 Credentials:** Te same co w automatyzacje/lib.js
- Client ID: z .env (`GMAIL_CLIENT_ID`) -> Secrets Manager
- Client Secret: z .env (`GMAIL_CLIENT_SECRET`) -> Secrets Manager
- Refresh Token: z .env (`GMAIL_REFRESH_TOKEN`) -> Secrets Manager

**Scopes wymagane:**
- `gmail.readonly` — odczyt maili
- `gmail.compose` — tworzenie draftow
- `gmail.modify` — modyfikacja labeli (opcjonalnie)

**Gmail Push Notifications (real-time trigger):**

Flow: Gmail -> Google Cloud Pub/Sub -> HTTPS push -> API Gateway -> Lambda

Setup:
```
1. Google Cloud Console -> Pub/Sub -> Create Topic: "artnapi-gmail-push"
2. Create Subscription (Push):
   - Type: Push
   - Endpoint: https://{api-gateway-id}.execute-api.eu-west-1.amazonaws.com/prod/webhook
   - Acknowledgement deadline: 60s
3. Gmail API -> users.watch():
   POST https://www.googleapis.com/gmail/v1/users/me/watch
   Body: {
     "topicName": "projects/{project-id}/topics/artnapi-gmail-push",
     "labelIds": ["INBOX"]
   }
4. Watch trzeba odnawiać co 7 dni (EventBridge scheduled rule)
```

**UWAGA:** Gmail Push Notification dostarczy tylko `historyId`, nie pelny mail. Lambda musi:
1. Odebrac historyId z webhook payload
2. Wywolac `history.list` z `startHistoryId` zeby dowiedziec sie CO sie zmienilo
3. Dla kazdego nowego `messagesAdded` — pobrac pelny mail

Alternatywnie (MVP prostszy): Ignoruj payload z webhook, po prostu odpytaj inbox o `newer_than:15m`.

---

### B4. Notion API Integration

**Token:** Ten sam co w `.env` (`NOTION_API_KEY`) -> Secrets Manager
**Database ID (CRM):** `19a268dd-5467-4f2a-9eb2-a004efc0ac7e`
**Data Source ID (query):** `26f862e1-4a0c-808f-a249-000b2cee31df`
**API Version:** `2025-09-03`

**Operacje:**

1. **Query leada po emailu:**
```javascript
// Identycznie jak w lib.js queryCRM() + parseNotionLead()
// Filter: Email.email equals senderEmail
const filter = {
  property: 'Email',
  email: { equals: senderEmail }
};
```

2. **Update leada po odpowiedzi:**
```javascript
// PATCH /v1/pages/{page_id}
{
  "properties": {
    "ostatni kontakt": { "date": { "start": "2026-03-18" } },
    "Due": { "date": { "start": "2026-03-21" } },  // +3 dni robocze
    "notatki": { "rich_text": [{ "text": { "content": "+ AWS auto-draft 18.03" } }] }
  }
}
```

**Mapowanie pol CRM (z lib.js parseNotionLead):**

| Pole Lambda | Pole Notion | Typ |
|-------------|-------------|-----|
| name | Task name | title |
| company | nazwa klienta | rich_text |
| contact | osoba kontaktowa | rich_text |
| email | Email | email |
| status | Status | select/status |
| segment | segment rynku | select |
| country | kraj | select |
| value | wartosc szansy | number |
| due | Due | date |
| lastContact | ostatni kontakt | date |
| notes | notatki | rich_text |

---

### B5. Bedrock (Claude Sonnet)

**Model:** Claude Sonnet 4.6 — `anthropic.claude-sonnet-4-6-20250514-v1:0`
**Region:** us-east-1 (tańszy, lepszy dostep do modelu)
**Max tokens output:** 1000 (draft nie powinien byc dlugszy niz 5-8 zdan)
**Temperature:** 0.3 (spójnosc z ghost_styl, powtarzalnosc)
**Top-p:** 0.9

**Uzycie:**

1. **Klasyfikacja** — 1 invokacja per mail, ~500 input tokens, ~50 output tokens
2. **Draft** — 1 invokacja per mail (jesli STANDARD), ~2000 input tokens, ~500 output tokens

**Invoke API:**
```javascript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

const response = await client.send(new InvokeModelCommand({
  modelId: 'anthropic.claude-sonnet-4-6-20250514-v1:0',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  })
}));

const result = JSON.parse(new TextDecoder().decode(response.body));
const draft = result.content[0].text;
```

**Guardrails (walidacja cen):**

Po wygenerowaniu draftu, Lambda sprawdza:
1. Wyciagnij wszystkie liczby z draftu ktore wygladaja na ceny (regex: `\d+[,\.]\d{2}\s*(PLN|EUR|zl|euro)`)
2. Porownaj z cenami w oferta.md
3. Jesli cena w drafcie NIE wystepuje w oferta.md -> BLOKADA + Telegram alert
4. Jesli draft odsyla do kalkulatora (https://artnapi.pl/B2B-Price-Calculator) -> OK, nie sprawdzaj cen

---

### B6. DynamoDB (State)

**Table:** `email-processor-state`
**Region:** eu-west-1
**Billing:** On-demand (pay-per-request)
**TTL:** Wlaczony na kolumnie `ttl` (auto-usuwanie po 30 dniach)

**Schema:**

| Attribute | Type | Opis |
|-----------|------|------|
| PK | S (String) | `EMAIL#<message_id>` |
| processedAt | S | ISO timestamp |
| senderEmail | S | email nadawcy |
| action | S | `DRAFT_CREATED` / `SKIPPED_ALREADY_REPLIED` / `SKIPPED_DECISION` / `SKIPPED_GUARDRAIL` |
| ttl | N | Unix timestamp + 30 dni |

**Dedup logic:**
```javascript
// Sprawdz czy juz przetworzony
const existing = await dynamo.send(new GetItemCommand({
  TableName: 'email-processor-state',
  Key: { PK: { S: `EMAIL#${messageId}` } }
}));
if (existing.Item) return; // skip

// Po przetworzeniu
await dynamo.send(new PutItemCommand({
  TableName: 'email-processor-state',
  Item: {
    PK: { S: `EMAIL#${messageId}` },
    processedAt: { S: new Date().toISOString() },
    senderEmail: { S: senderEmail },
    action: { S: actionTaken },
    ttl: { N: String(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) }
  }
}));
```

---

### B7. API Gateway

**Type:** HTTP API (v2) — tanszy, prostszy niz REST API
**Endpoint:** `POST /webhook`
**Auth:** Brak (Gmail Push nie wspiera custom auth — walidacja w Lambda)
**CORS:** Nie potrzebny (server-to-server)

**Lambda validation (w handlerze):**
Webhook od Gmail Push zawiera pole `subscription` z nazwa subskrypcji Pub/Sub.
Lambda weryfikuje ze przychodzi z prawidlowej subskrypcji.

---

### B8. EventBridge (Fallback Polling)

**Rule:** `email-processor-fallback`
**Schedule:** `rate(15 minutes)`
**Target:** Lambda email-processor
**Input:** `{ "source": "eventbridge-fallback" }`

Lambda rozroznia trigger:
- Jesli `event.source === 'eventbridge-fallback'` -> poll Gmail (newer_than:15m)
- Jesli event ma `body` z Pub/Sub -> webhook mode

**Watch Renewal Rule:**
- **Rule:** `gmail-watch-renewal`
- **Schedule:** `rate(6 days)` (watch wygasa po 7 dniach)
- **Target:** Lambda mini-function ktora robi POST do Gmail `users.watch()`

---

### B9. Telegram Alerts

**Bot:** @MattJarvis_Bot (Ultron)
**Chat ID:** 1304598782
**Token:** z Secrets Manager

**Typy alertow:**

| Sytuacja | Format Telegram |
|----------|----------------|
| Draft utworzony | `Draft gotowy: [firma] — "[temat]"` |
| Mail wymaga decyzji | `WYMAGA DECYZJI: [firma] — [powod] — przejdz do Gmail` |
| Juz odpowiedziano w watku | `Mail od [firma], ale juz odpowiedziano. SKIP.` |
| Guardrail: bledna cena | `GUARDRAIL: Draft zawieral bledna cene ([szczegol]). Draft NIE utworzony.` |
| Bedrock timeout | `BEDROCK TIMEOUT: Nie udalo sie wygenerowac draftu dla [firma]. Sprawdz recznie.` |
| Notion niedostepny | `NOTION DOWN: Draft utworzony, ale CRM nie zaktualizowany. Zaktualizuj recznie: [firma] Due [data].` |
| Lambda error | `EMAIL PROCESSOR ERROR: [message]` |

---

## C. KOSZTY (miesieczne)

**Zalozenia:** 20 maili/dzien x 22 dni robocze = 440 maili/msc
Z czego: ~70% STANDARD (308 draftow), ~30% DECISION (132 alerty)

### Bedrock (Claude Sonnet)

| Operacja | Ilosc/msc | Input tokens | Output tokens | Koszt |
|----------|-----------|-------------|---------------|-------|
| Klasyfikacja | 440 | ~500/mail | ~50/mail | ~$0.30 |
| Draft generation | 308 | ~2000/mail | ~500/mail | ~$1.50 |
| **RAZEM Bedrock** | | | | **~$1.80/msc** |

> Ceny Sonnet 4.6: $3/1M input, $15/1M output
> Klasyfikacja: 440 * 500 = 220K input ($0.66) + 440 * 50 = 22K output ($0.33) = ~$1.00
> Drafty: 308 * 2000 = 616K input ($1.85) + 308 * 500 = 154K output ($2.31) = ~$4.16
> **Korekta: ~$5.16/msc** (z dokladniejsza kalkulacja)

Realistycznie (z Sonnet 4.6 pricing $3/$15):

| | Input tokens | Koszt input | Output tokens | Koszt output | Suma |
|-|-------------|-------------|---------------|-------------|------|
| Klasyfikacja (440x) | 220,000 | $0.66 | 22,000 | $0.33 | $0.99 |
| Draft (308x) | 616,000 | $1.85 | 154,000 | $2.31 | $4.16 |
| **RAZEM** | **836,000** | **$2.51** | **176,000** | **$2.64** | **$5.15** |

### Inne uslugi AWS

| Usluga | Uzycie/msc | Koszt |
|--------|-----------|-------|
| Lambda | 440 invocations, ~30s avg | **$0.00** (free tier: 1M req + 400K GB-s) |
| API Gateway | 440 requests | **$0.00** (free tier: 1M req/msc przez 12 msc) |
| DynamoDB | 440 writes + 440 reads | **$0.00** (free tier: 25 WCU + 25 RCU) |
| S3 | ~30 KB stored, 440 reads | **$0.00** (negligible) |
| Secrets Manager | 4 secrets, 440 reads | **~$1.60** ($0.40/secret/msc) |
| EventBridge | ~2880 invocations (co 15 min) | **$0.00** (free tier) |
| CloudWatch Logs | ~50 MB/msc | **$0.00** (free tier: 5 GB) |

### RAZEM

| Skladnik | Koszt/msc |
|----------|-----------|
| Bedrock (Claude Sonnet) | ~$5.15 |
| Secrets Manager | ~$1.60 |
| Lambda + API GW + DynamoDB + S3 + EventBridge | $0.00 |
| **TOTAL** | **~$6.75/msc (~27 PLN/msc)** |

**Porownanie:** Obecny koszt (email-radar alert-only na Mac): $0/msc (ale wymaga Maca online).
**Zysk:** 24/7 autonomia, drafty bez sesji @ceo, <2 min response time.

---

## D. SECURITY

### D1. Secrets Manager

**Secret:** `artnapi-email-processor/credentials`
**Format:** JSON

```json
{
  "GMAIL_CLIENT_ID": "...",
  "GMAIL_CLIENT_SECRET": "...",
  "GMAIL_REFRESH_TOKEN": "...",
  "NOTION_API_KEY": "secret_...",
  "TELEGRAM_BOT_TOKEN": "..."
}
```

**Rotation:** Manual (OAuth refresh token nie rotuje sie automatycznie).
**Access:** Tylko Lambda execution role (IAM policy).

### D2. IAM Role (Lambda)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:eu-west-1:*:secret:artnapi-email-processor/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::artnapi-email-processor-kb/*"
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:eu-west-1:*:table/email-processor-state"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "*"
    }
  ]
}
```

### D3. S3 Bucket Policy

- Block all public access: ON
- Encryption: SSE-S3 (AES-256)
- Versioning: ON (rollback oferta.md jesli bledna wersja)

### D4. Siec

- Lambda NIE potrzebuje VPC (Gmail API, Notion API, Telegram API to publiczne endpointy)
- Brak VPC = prostsze, brak kosztu NAT Gateway (~$32/msc oszczednosci)

### D5. Monitoring

- CloudWatch Alarms:
  - Lambda errors > 5/godzine -> SNS -> Telegram
  - Lambda duration > 90s (blisko timeout) -> warning
  - DynamoDB throttling -> alert

---

### D6. SECURITY DEEP DIVE — AUDIT BEZPIECZENSTWA

> Audit wykonany: 2026-03-17 przez @cto
> Scope: cala architektura MVP (sekcje A-F)
> Metodologia: 12-punktowa checklista + rekomendacje

---

#### 1. OAuth Tokens — przechowywanie i rotacja

**Stan:** Gmail OAuth credentials (Client ID, Client Secret, Refresh Token) w AWS Secrets Manager. OK.

**Ryzyka:**
- **Refresh Token nie rotuje sie automatycznie.** Google moze go uniewaznac w kazdej chwili (np. zmiana hasla, 6 miesiecy nieaktywnosci, Google security review).
- **Brak automatycznej detekcji wygasniecia.** Lambda dostanie 401 i dopiero wtedy wiemy.

**Rekomendacje:**
- [MUST] Lambda MUSI obslugiwac blad 401 z Gmail API -> Telegram alert `GMAIL AUTH FAILED — odnow token recznie`.
- [MUST] Dodaj CloudWatch Metric Filter na "401" w logach Lambda -> CloudWatch Alarm -> SNS -> Telegram.
- [SHOULD] Rozważ: Lambda probuje refresh token -> access token. Jesli refresh FAILED -> Telegram alert + skip (nie retry w nieskonczonosc).
- [NICE] Co 30 dni: EventBridge rule -> Lambda testuje Gmail API (prosty GET profile) -> jesli 401 -> alert ZANIM wygasnie w produkcji.

**Co gdy token wygasnie:**
1. Telegram alert
2. User na Mac: `node automatyzacje/gmail-auth.js` -> nowy refresh token
3. User: `aws secretsmanager update-secret --secret-id artnapi-email-processor/credentials --secret-string '{...}'`
4. Lambda automatycznie uzyje nowego tokena przy nastepnym invocation

---

#### 2. Secrets Manager — kompletnosc

**Stan:** Jeden secret `artnapi-email-processor/credentials` z 5 kluczami.

**Audit:**

| Secret | W Secrets Manager? | Hardcoded gdzies? | Status |
|--------|-------------------|-------------------|--------|
| GMAIL_CLIENT_ID | TAK | NIE | OK |
| GMAIL_CLIENT_SECRET | TAK | NIE | OK |
| GMAIL_REFRESH_TOKEN | TAK | NIE | OK |
| NOTION_API_KEY | TAK | NIE | OK |
| TELEGRAM_BOT_TOKEN | TAK | NIE | OK |
| TELEGRAM_CHAT_ID | W env variable Lambda | NIE | OK (nie jest sekretem — to public channel ID) |
| NOTION_CRM_DATASOURCE_ID | W env variable Lambda | NIE | OK (nie jest sekretem) |
| Google Maps API Key (Faza 5) | BRAK — dodac gdy Faza 5 | — | N/A |

**Rekomendacje:**
- [MUST] NIGDY nie dodawaj secrets do environment variables Lambda — zawsze Secrets Manager.
- [MUST] NIGDY nie commituj secrets do Git (sprawdz .gitignore zawiera `.env`).
- [SHOULD] Secrets Manager rotation policy: manual OK dla MVP (OAuth refresh token nie wspiera auto-rotation).
- [SHOULD] CDK: dodaj `secretsmanager:DescribeSecret` do IAM role (debug bez GetSecretValue).

---

#### 3. S3 Bucket — bezpieczenstwo

**Stan:** Bucket `artnapi-email-processor-kb` z Block All Public Access ON, SSE-S3, Versioning ON.

**Audit:**

| Check | Status | Komentarz |
|-------|--------|-----------|
| Block All Public Access | ON | OK |
| Encryption at rest (SSE-S3) | ON | OK — AES-256 |
| Versioning | ON | OK — rollback mozliwy |
| Bucket Policy | Brak osobnej (tylko IAM role Lambda) | OK — least privilege |
| Access Logging | BRAK | SHOULD dodac |
| Lifecycle Rules | BRAK | SHOULD — usuwaj stare wersje po 90 dniach |
| MFA Delete | BRAK | NICE — dodatkowa ochrona przed przypadkowym delete |

**Rekomendacje:**
- [SHOULD] Wlacz S3 Access Logging -> osobny bucket `artnapi-logs` (kto czytal/zapisywal pliki).
- [SHOULD] Lifecycle Rule: usuwaj stare wersje obiektow po 90 dniach (oszczednosc, porzadek).
- [NICE] Rozważ SSE-KMS zamiast SSE-S3 jesli dane sa wrazliwe (cenniki, styl komunikacji).

---

#### 4. Lambda — IAM Least Privilege

**Stan:** IAM role z 5 statementami (Secrets Manager, S3, DynamoDB, Bedrock, CloudWatch).

**Audit:**

| Permission | Scope | Least Privilege? | Status |
|------------|-------|-----------------|--------|
| secretsmanager:GetSecretValue | Tylko `artnapi-email-processor/*` | TAK | OK |
| s3:GetObject | Tylko `artnapi-email-processor-kb/*` | TAK | OK |
| dynamodb:GetItem/PutItem/Query | Tylko `email-processor-state` | TAK | OK |
| bedrock:InvokeModel | Tylko `anthropic.claude-sonnet-4-6*` | TAK | OK |
| logs:* | Resource: `*` | NIE — za szerokie | POPRAWIC |

**Rekomendacje:**
- [MUST] Zawez CloudWatch Logs permission: `Resource: arn:aws:logs:eu-west-1:*:log-group:/aws/lambda/artnapi-email-processor:*` zamiast `*`.
- [MUST] Lambda NIE MA `s3:PutObject` — dlatego nie moze nadpisac oferta.md/ghost_styl.md. OK. (Faza 2 morning-scan potrzebuje PutObject — osobna Lambda role.)
- [SHOULD] Lambda NIE MA `dynamodb:DeleteItem` — OK (DynamoDB TTL sam kasuje).
- [SHOULD] Dodaj `aws:SourceAccount` condition do IAM trust policy (ochrona przed confused deputy).

---

#### 5. API Gateway — zabezpieczenie webhooka

**Stan:** HTTP API v2, POST /webhook, BRAK autentykacji. Lambda weryfikuje pole `subscription` z Pub/Sub.

**Ryzyka:**
- **Kazdy kto zna URL webhooka moze wyslac POST.** Gmail Push nie wspiera custom auth headers.
- **Lambda przetworzy falszywy webhook** jesli atakujacy wyśle poprawny format JSON.

**Rekomendacje:**
- [MUST] Lambda MUSI walidowac payload: sprawdz ze `message.data` po base64 decode zawiera valid JSON z `emailAddress` == `mateusz.sokolski@artnapi.pl`.
- [MUST] Lambda MUSI sprawdzac `subscription` field: `projects/YOUR_PROJECT/subscriptions/artnapi-gmail-push-sub`. Odrzuc jesli inny.
- [SHOULD] Rate limiting na API Gateway: max 10 req/min (normalnie 1-5 maili na godzine). Ochrona przed DDoS/spam.
- [SHOULD] Dodaj WAF (Web Application Firewall) z basic rules: rate limit + geo blocking (tylko Google Cloud IPs). Koszt: ~$5/msc — rozwaź post-MVP.
- [NICE] Loguj WSZYSTKIE odrzucone requesty do CloudWatch (detection of attack attempts).

**Implementacja walidacji w Lambda:**
```javascript
// W handler(), na samym poczatku:
const body = JSON.parse(event.body);
const subscription = body?.subscription || '';
if (!subscription.includes('artnapi-gmail-push')) {
  console.warn('REJECTED: Invalid subscription', subscription);
  return { statusCode: 403, body: 'Forbidden' };
}
```

---

#### 6. DynamoDB — encryption i access control

**Stan:** Table `email-processor-state`, PAY_PER_REQUEST, TTL wlaczony.

**Audit:**

| Check | Status | Komentarz |
|-------|--------|-----------|
| Encryption at rest | ON (default — AWS owned key) | OK |
| Point-in-Time Recovery | BRAK | SHOULD wlaczyc |
| Access Control | Tylko Lambda IAM role | OK |
| TTL | ON (30 dni) | OK — auto-cleanup |
| Backup | BRAK | NICE — wlacz on-demand backup |

**Rekomendacje:**
- [SHOULD] Wlacz Point-in-Time Recovery (PITR) — ochrona przed przypadkowym delete. Koszt: ~$0.20/msc.
- [NICE] DynamoDB nie przechowuje danych wrazliwych (tylko message IDs i akcje) — encryption default wystarczy.

---

#### 7. Bedrock — guardrails

**Stan:** Claude Sonnet 4.6, temperature 0.3, max_tokens 1000. Guardrail: price validation post-generation.

**Ryzyka:**
- **Model moze wygenerowac tresc niezgodna z oferta** (nie tylko ceny — takze terminy dostaw, gwarancje, zobowiazania prawne).
- **Model moze wygenerowac tresc oskarzajaca/obrażliwą** jesli input mail jest agresywny.
- **Brak Bedrock Guardrails API** (natywna usluga AWS do content filtering).

**Rekomendacje:**
- [MUST] Guardrail cenowy (juz zaimplementowany) — OK.
- [MUST] Dodaj guardrail na zobowiazania: regex sprawdz czy draft NIE zawiera slow: "gwarantujemy", "obiecujemy", "zobowiazujemy sie", "umowa", "kontrakt" + angielskie odpowiedniki. Jesli zawiera -> Telegram alert, draft NIE tworzony.
- [SHOULD] Rozważ AWS Bedrock Guardrails (managed): content filter na PII, hate, insults. Koszt: $0.00 dodatkowego (wliczone w invoke).
- [SHOULD] System prompt: dodaj regule "NIGDY nie obiecuj terminow dostaw, gwarancji, ani zobowiazan prawnych. Odeslij do kontaktu z Mateuszem."
- [NICE] Monitoring: loguj do DynamoDB ile draftow bylo odrzuconych przez guardrails (tracking jakosci modelu).

---

#### 8. Gmail API — scope minimalny

**Stan:** Scopes: `gmail.readonly`, `gmail.compose`, `gmail.modify`.

**Ryzyka:**
- `gmail.compose` pozwala na TWORZENIE draftow — OK, to jest cel.
- `gmail.compose` takze pozwala na **WYSYLANIE maili** (`/messages/send`). Lambda NIE POWINNA tego robic.
- `gmail.modify` pozwala na zmiane labeli, archiwizacje, usuwanie — szeroki scope.

**Rekomendacje:**
- [MUST] Lambda kod: NIGDY nie wywoluj endpointu `POST /gmail/v1/users/me/messages/send`. Tylko `POST /gmail/v1/users/me/drafts`.
- [MUST] Code review check: grep codebase for "messages/send" -> should return 0 results.
- [SHOULD] Usu scope `gmail.modify` jesli nie jest uzywany (nie modyfikujemy labeli w MVP). Zostaw: `gmail.readonly` + `gmail.compose`.
- [SHOULD] Rozważ: osobny OAuth client dla Lambda (inny niz Mac scripts). Wtedy mozna revoke Lambda OAuth bez wplywu na Mac.
- [WARN] ZMIANA SCOPE wymaga ponownego OAuth consent flow (nowy refresh token). Planuj to ZANIM deploy.

---

#### 9. Notion API — uprawnienia tokena

**Stan:** Notion Internal Integration z tokenem `secret_...` w Secrets Manager.

**Ryzyka:**
- Internal Integration ma dostep TYLKO do stron/baz ktore zostaly z nia explicite wspoldzielone ("shared with integration").
- Jesli ktos doda integracje do wrażliwej strony (np. finanse) — Lambda ma dostep.

**Rekomendacje:**
- [MUST] Sprawdz w Notion: integracja jest wspoldzielona TYLKO z CRM database (`19a268dd-...`). NIE z innymi bazami/stronami.
- [SHOULD] Notion API capabilities: sprawdz ze integracja ma TYLKO "Read content" + "Update content" (nie "Insert content" — nie chcemy tworzyc nowych stron z Lambda, chyba ze Faza 5 Recon).
- [NICE] Osobna integracja Notion dla Recon (Faza 5) z uprawnieniem "Insert content" — separation of concerns.

---

#### 10. Telegram — bot token

**Stan:** Bot @MattJarvis_Bot, token w Secrets Manager, Chat ID w env variable.

**Audit:**

| Check | Status |
|-------|--------|
| Token w Secrets Manager | TAK — OK |
| Chat ID w env (nie secret) | OK — Chat ID nie jest wrażliwy |
| Bot moze czytac wiadomosci? | Sprawdzic — jesli privacy mode OFF, bot widzi wszystkie msgs w grupie |

**Rekomendacje:**
- [SHOULD] Sprawdz BotFather: `/setprivacy` -> ENABLED (bot widzi TYLKO komendy skierowane do niego, nie cale czaty).
- [SHOULD] Bot wysyla TYLKO do 1 chat ID (1304598782). Lambda hardcoded. OK — ale jesli ktos zdobedzie token, moze wyslac wiadomosc DO BOTA (nie od bota). Ryzyko niskie.

---

#### 11. CloudWatch Logs — sanityzacja

**Stan:** Lambda loguje do CloudWatch Logs. Brak jawnej sanityzacji.

**Ryzyka:**
- **Lambda moze logowac tresc maili** (snippets, body) — dane osobowe w logach AWS!
- **Lambda moze logowac sekrety** jesli blad w kodzie (np. `console.log(secrets)`).
- CloudWatch Logs retention domyslnie = FOREVER (nigdy nie kasuje).

**Rekomendacje:**
- [MUST] Lambda kod: NIGDY `console.log(secrets)`, NIGDY `console.log(emailBody)`. Loguj TYLKO: messageId, senderEmail (maskowany: `m***@firma.pl`), action taken, timing.
- [MUST] CloudWatch Logs retention: ustaw na 30 dni (nie forever). CDK: `logRetention: logs.RetentionDays.ONE_MONTH`.
- [SHOULD] Dodaj wrapper function `safeLog()` ktory maskuje emaile i usuwa HTML body:
```javascript
function safeLog(msg, data) {
  const safe = { ...data };
  if (safe.email) safe.email = safe.email.replace(/(.{2}).*@/, '$1***@');
  if (safe.body) safe.body = '[REDACTED]';
  if (safe.snippet) safe.snippet = safe.snippet.slice(0, 50) + '...';
  console.log(msg, JSON.stringify(safe));
}
```
- [SHOULD] NIE loguj tresci draftow (wygenerowanych przez Bedrock).
- [NICE] Rozważ CloudWatch Logs data protection policy (automatyczne maskowanie PII). Koszt: $0.00 dodatkowego.

---

#### 12. Dane osobowe (RODO / GDPR)

**Stan:** Lambda przetwarza: email nadawcy, imie/nazwisko z CRM, tresc maila, dane firmy. Bedrock (us-east-1) przetwarza tresc maila.

**Ryzyka:**
- **Tresc maili przechodzi przez Bedrock (us-east-1 = Virginia, USA).** Transfer danych osobowych EU -> US.
- **AWS Bedrock:** Zgodnie z AWS DPA, dane NIE sa uzywane do trenowania modeli. Ale transfer EU->US wymaga podstawy prawnej.
- **DynamoDB przechowuje emaile nadawcow** (pole senderEmail, 30 dni TTL).
- **S3 przechowuje oferta.md i ghost_styl.md** — nie zawieraja danych osobowych. OK.

**Rekomendacje:**
- [MUST] Sprawdz czy masz podpisane AWS DPA (Data Processing Addendum). AWS oferuje standardowe DPA w ramach GDPR — aktywuj w AWS Artifact.
- [MUST] Podstawa prawna transferu EU->US: Standard Contractual Clauses (SCCs) — AWS je oferuje w DPA. Sprawdz czy sa aktywowane.
- [SHOULD] Dodaj do Privacy Policy firmy: informacje o przetwarzaniu maili przez AI (Bedrock) w celu generowania odpowiedzi. Podstawa: uzasadniony interes (Art. 6(1)(f) RODO) — szybsza obsluga klienta.
- [SHOULD] DynamoDB: pole senderEmail -> rozważ haszowanie (SHA-256) zamiast plaintext. Lambda uzywa hasha do dedup, nie potrzebuje oryginalu po pierwszym przetworzeniu.
- [SHOULD] Bedrock: rozważ region eu-west-1 jesli Claude Sonnet bedzie tam dostepny (unikniecie transferu EU->US). Stan na 03.2026: Sonnet dostepny w us-east-1. Sprawdzaj co kwartał.
- [NICE] Data Subject Access Request (DSAR): jesli lead poprosi o dane — DynamoDB ma TTL 30 dni, CloudWatch 30 dni (po rekomendacji). Po 30 dniach dane znikaja automatycznie.
- [NICE] Rozważ: "prawo do bycia zapomnianym" — dodaj endpoint/skrypt ktory kasuje wszystkie rekordy danego emaila z DynamoDB.

---

#### PODSUMOWANIE AUDYTU BEZPIECZENSTWA

| # | Obszar | Status | Najwazniejsza rekomendacja |
|---|--------|--------|---------------------------|
| 1 | OAuth Tokens | WARN | Dodaj detekcje 401 + auto-alert |
| 2 | Secrets Manager | OK | Kompletny, brak hardcoded |
| 3 | S3 Bucket | OK | Dodaj Access Logging |
| 4 | Lambda IAM | WARN | Zawez CloudWatch Logs resource z `*` |
| 5 | API Gateway | WARN | Waliduj subscription + rate limit |
| 6 | DynamoDB | OK | Wlacz PITR |
| 7 | Bedrock | WARN | Dodaj guardrail na zobowiazania |
| 8 | Gmail API | WARN | Usun `gmail.modify` scope, sprawdz brak send |
| 9 | Notion API | OK | Sprawdz shared pages |
| 10 | Telegram | OK | Sprawdz privacy mode |
| 11 | CloudWatch Logs | KRYTYCZNE | Sanityzacja logow + retention 30d |
| 12 | RODO/GDPR | WARN | Aktywuj AWS DPA + SCCs |

**Priorytet napraw:**
1. **TERAZ (przed deploy 18.03):** #11 (logi), #5 (webhook validation), #4 (IAM scope), #8 (Gmail scope check)
2. **TYDZIEN 1 po deploy:** #1 (OAuth monitoring), #7 (Bedrock guardrails), #12 (RODO)
3. **TYDZIEN 2+:** #3 (S3 logging), #6 (PITR), reszta NICE-TO-HAVE

---

## E. DEPLOYMENT

### E1. Infrastructure as Code (AWS CDK — TypeScript)

```typescript
// cdk/lib/email-processor-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class EmailProcessorStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id, { env: { region: 'eu-west-1' } });

    // S3 Knowledge Base
    const kb = new s3.Bucket(this, 'KnowledgeBase', {
      bucketName: 'artnapi-email-processor-kb',
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // DynamoDB State
    const table = new dynamodb.Table(this, 'State', {
      tableName: 'email-processor-state',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Secrets
    const secret = secretsmanager.Secret.fromSecretNameV2(
      this, 'Credentials', 'artnapi-email-processor/credentials'
    );

    // Lambda
    const fn = new lambda.Function(this, 'EmailProcessor', {
      functionName: 'artnapi-email-processor',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/email-processor'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      environment: {
        S3_BUCKET: kb.bucketName,
        DYNAMO_TABLE: table.tableName,
        TELEGRAM_CHAT_ID: '1304598782',
        NOTION_CRM_DATASOURCE_ID: '26f862e1-4a0c-808f-a249-000b2cee31df',
        BEDROCK_MODEL_ID: 'anthropic.claude-sonnet-4-6-20250514-v1:0',
        BEDROCK_REGION: 'us-east-1',
        MY_EMAIL: 'mateusz.sokolski@artnapi.pl',
        SECRET_NAME: 'artnapi-email-processor/credentials',
      },
    });

    // Permissions
    kb.grantRead(fn);
    table.grantReadWriteData(fn);
    secret.grantRead(fn);
    fn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6*'],
    }));

    // API Gateway
    const api = new apigateway.HttpApi(this, 'WebhookApi', {
      apiName: 'email-processor-webhook',
    });
    api.addRoutes({
      path: '/webhook',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway.HttpLambdaIntegration('LambdaIntegration', fn),
    });

    // EventBridge Fallback (co 15 min)
    new events.Rule(this, 'FallbackRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      targets: [new cdk.aws_events_targets.LambdaFunction(fn, {
        event: events.RuleTargetInput.fromObject({ source: 'eventbridge-fallback' }),
      })],
    });

    // Output
    new cdk.CfnOutput(this, 'WebhookUrl', { value: api.url + 'webhook' });
  }
}
```

### E2. Deployment Steps (jutro 18.03)

```
KROK 1: AWS Account setup (10 min)
------
- Zaloguj sie na AWS Console
- Sprawdz region: eu-west-1 (Ireland)
- Bedrock: wlacz model access dla Claude Sonnet w us-east-1
  Console -> Bedrock -> Model access -> Request access -> Anthropic Claude Sonnet

KROK 2: Secrets Manager (5 min)
------
aws secretsmanager create-secret \
  --name artnapi-email-processor/credentials \
  --secret-string '{
    "GMAIL_CLIENT_ID": "<z .env>",
    "GMAIL_CLIENT_SECRET": "<z .env>",
    "GMAIL_REFRESH_TOKEN": "<z .env>",
    "NOTION_API_KEY": "<z .env>",
    "TELEGRAM_BOT_TOKEN": "<z .env>"
  }' \
  --region eu-west-1

KROK 3: CDK Deploy (15 min)
------
cd asystent
mkdir -p cdk && cd cdk
npx cdk init app --language typescript
# Wklej stack z E1
# Stwórz lambda/email-processor/index.mjs (port z B2 pseudokod)
npx cdk deploy

KROK 4: S3 Upload Knowledge Base (2 min)
------
aws s3 cp dane/artnapi/oferta.md s3://artnapi-email-processor-kb/oferta.md
aws s3 cp dane/ghost_styl.md s3://artnapi-email-processor-kb/ghost_styl.md

KROK 5: Gmail Push Setup (15 min)
------
# Google Cloud Console:
# 1. Create Pub/Sub topic: artnapi-gmail-push
# 2. Create Push subscription -> endpoint: <webhook URL z CDK output>
# 3. Grant gmail-api-push@system.gserviceaccount.com publish rights
# 4. Call Gmail watch API:
curl -X POST \
  'https://www.googleapis.com/gmail/v1/users/me/watch' \
  -H "Authorization: Bearer $(node -e "import('./automatyzacje/lib.js').then(m => {m.loadEnv(); m.gmailGetAccessToken().then(t => process.stdout.write(t))})")" \
  -H 'Content-Type: application/json' \
  -d '{"topicName":"projects/YOUR_PROJECT/topics/artnapi-gmail-push","labelIds":["INBOX"]}'

KROK 6: Test (10 min)
------
# Wyslij testowy mail na mateusz.sokolski@artnapi.pl z innego konta
# Sprawdz:
# 1. CloudWatch Logs -> /aws/lambda/artnapi-email-processor
# 2. Telegram -> alert
# 3. Gmail -> drafty
# 4. Notion CRM -> Due update

KROK 7: Wylacz Mac email-radar (opcjonalnie)
------
# Po potwierdzeniu ze AWS dziala, mozesz wylaczyc Mac LaunchAgent:
# launchctl unload ~/Library/LaunchAgents/com.asystent.email-radar.plist
# ALE ZOSTAW morning-scan.js — to inna funkcja (poranny raport)
```

### E3. Struktura plików Lambda

```
lambda/email-processor/
├── index.mjs          # Handler glowny (export handler)
├── gmail.mjs          # Gmail API functions (port z lib.js)
├── notion.mjs         # Notion API functions (port z lib.js)
├── telegram.mjs       # Telegram function (port z lib.js)
├── bedrock.mjs        # Bedrock invoke (klasyfikacja + draft)
├── s3.mjs             # S3 knowledge base loader
├── dynamo.mjs         # DynamoDB state management
├── utils.mjs          # extractEmail, extractName, isForeignLead, wrapEmailHTML
└── package.json       # { "type": "module" }
```

---

## F. FALLBACK & ERROR HANDLING

### F1. Gmail Push Notification nie dziala

**Fallback:** EventBridge polling co 15 min (juz wbudowany).
**Detekcja:** Jesli Lambda nie jest wywolywana przez webhook >30 min -> CloudWatch alarm.
**Naprawa:** Sprawdz watch expiration, odnow recznie lub poczekaj na auto-renewal (co 6 dni).

### F2. Bedrock timeout / error

**Akcja:** Telegram alert `BEDROCK TIMEOUT: [firma]` + skip draft.
**User:** Recznie odpowiada lub odpala sesje @ceo.
**Retry:** Lambda NIE robi retry na Bedrock (aby uniknac podwojnych draftow). Jesli Bedrock nie odpowie w 30s -> skip.

### F3. Notion unavailable

**Akcja:** Draft NADAL jest tworzony w Gmail (bo to wazniejsze).
**Telegram:** `NOTION DOWN: Draft utworzony, ale CRM nie zaktualizowany. Firma: [X], Due: [data].`
**User:** Recznie update CRM.

### F4. Gmail OAuth token expired

**Akcja:** Refresh token jest long-lived (nie wygasa normalnie).
**Jesli wygasnie:** Lambda loguje error, Telegram alert `GMAIL AUTH FAILED`.
**Naprawa:** Recznie odpal `node automatyzacje/gmail-auth.js` na Mac, zaktualizuj Secrets Manager.

### F5. Podwojne drafty (dedup failure)

**Zabezpieczenie:** DynamoDB processedIds z TTL 30 dni.
**Edge case:** Jesli Lambda timeout POMIEDZY stworzeniem draftu a zapisem do DynamoDB -> moze byc podwojny draft przy nastepnym run.
**Mitygacja:** Draft Quality Guard (punkt A) sprawdza SENT w watku. Jesli draft juz wyslany -> nie tworzy nowego.

### F6. Bledna wersja oferta.md w S3

**Zabezpieczenie:** S3 versioning wlaczony. Mozna rollback do poprzedniej wersji.
**Guardrail:** Price validation porownuje ceny w drafcie z oferta.md — wylapie bledy.

---

### F2. EDGE CASES & CONFLICT PREVENTION

> 8 scenariuszy brzegowych zidentyfikowanych przez @cto.
> Dla kazdego: problem, rozwiazanie architektoniczne, implementacja.

---

#### EDGE CASE 1: RACE CONDITION — Mac + AWS jednoczesnie

**Problem:** User jest w sesji Claude Code i pisze draft do leada (np. przez @ghost). W tym samym czasie Lambda otrzymuje nowy mail od tego samego leada i tworzy auto-draft. Wynik: DWA drafty do tego samego leada w Gmail. User wysyla oba — lead dostaje dwie rozne odpowiedzi.

**Rozwiazanie architektoniczne:** **Draft Lock w DynamoDB** — przed utworzeniem draftu, Lambda sprawdza czy nie ma aktywnego "locka" na danego leada.

**Implementacja:**

```
FLOW:
1. Lambda chce stworzyc draft do lead@firma.pl
2. Lambda sprawdza DynamoDB: PK = "LOCK#lead@firma.pl"
   -> Jesli istnieje i TTL > now -> SKIP + Telegram: "Lock aktywny dla [firma]. Draft NIE utworzony."
   -> Jesli nie istnieje -> kontynuuj
3. Lambda tworzy draft
4. Lambda zapisuje lock: PK = "LOCK#lead@firma.pl", TTL = now + 4h

SESJA MAC (Claude Code):
- Skrypt `automatyzacje/create-gmail-draft.js` TWORZY TAKI SAM LOCK w DynamoDB:
  PK = "LOCK#lead@firma.pl", TTL = now + 4h, source = "mac-session"
- Wymaga: dodanie DynamoDB write do Mac scripts (nowa zaleznosc)
- Alternatywa (prostsza): Mac session tworzy Gmail label "DRAFT_IN_PROGRESS"
  na watku. Lambda sprawdza label zamiast DynamoDB.
```

**Najprostrza wersja MVP:** Lambda sprawdza Gmail drafts PRZED tworzeniem nowego. Jesli draft do tego samego threada juz istnieje -> SKIP + Telegram alert. Nie wymaga zmian w Mac scripts.

```javascript
// W email-processor Lambda, przed createDraft():
const existingDrafts = await gmailListDrafts(accessToken);
const hasDraftInThread = existingDrafts.some(d =>
  d.message?.threadId === detail.threadId
);
if (hasDraftInThread) {
  await sendTelegram(secrets, `Draft juz istnieje w watku ${detail.subject}. SKIP.`);
  await markProcessed(msg.id);
  continue;
}
```

---

#### EDGE CASE 2: STALE DATA — oferta.md na S3 vs lokalnie

**Problem:** User zmienil cene w `dane/artnapi/oferta.md` na Macu (np. w sesji @ceo: "podniesiemy cene o 10%"). Ale NIE zsynchowal do S3. Lambda uzywa starych cen z S3. Auto-draft zawiera stara cene. User wysyla. Lead dostaje bledna oferte.

**Rozwiazanie architektoniczne:** **S3 versioning + timestamp check + Telegram warning.**

**Implementacja:**

```
WARSTWA 1 — Prewencja (sync):
- GitHub Actions (juz w planie, sekcja B1): auto-sync oferta.md do S3 przy git push.
- Problem: User moze zmienic plik BEZ git push (edycja lokalna).

WARSTWA 2 — Detekcja (staleness check):
- Lambda przy kazdym invocation sprawdza S3 object metadata:
  LastModified > 48h? -> Telegram warning:
  "oferta.md na S3 nie byl aktualizowany od [X] dni. Sprawdz czy jest aktualny."
- EventBridge rule: co 24h sprawdz LastModified oferta.md -> alert jesli stale.

WARSTWA 3 — Guardrail (juz istnieje):
- Price validation w Lambda: porownuje ceny w drafcie z oferta.md na S3.
- Jesli cena w drafcie NIE istnieje w oferta.md -> blokada.
- TO NIE ZLAPIE sytuacji gdy oferta.md na S3 ma STARA ale POPRAWNA STRUKTURE cen.

WARSTWA 4 — Best practice:
- Dodaj do CLAUDE.md / COO checklist:
  "Po KAZDEJ zmianie cennika -> sync do S3:
  aws s3 cp dane/artnapi/oferta.md s3://artnapi-email-processor-kb/oferta.md"
- @coo morning check: "Czy oferta.md zsyncowana?"
```

**Rekomendacja:** GitHub Actions (Warstwa 1) + Staleness alert (Warstwa 2). To zlapie 95% przypadkow.

---

#### EDGE CASE 3: SPAM LOOP

**Problem:** Lead odpowiada na auto-draft. Lambda widzi nowy mail, generuje kolejny draft. User wysyla. Lead odpowiada. Lambda znowu generuje. Niekontrolowana petla.

**Rozwiazanie architektoniczne:** **Frequency Cap per lead w DynamoDB.**

**Implementacja:**

```
DynamoDB record per lead:
PK: "FREQ#lead@firma.pl"
Attributes:
  - draftCount: number (ile draftow w oknie)
  - windowStart: ISO timestamp (poczatek okna)
  - lastDraftAt: ISO timestamp
  - TTL: windowStart + 24h

LOGIKA:
1. Lambda chce stworzyc draft do lead@firma.pl
2. Sprawdza DynamoDB FREQ#lead@firma.pl
3. Jesli draftCount >= 3 w ciagu 24h:
   -> SKIP + Telegram: "FREQUENCY CAP: [firma] — juz 3 drafty w 24h. Przejdz do Gmail lub @ceo."
4. Jesli draftCount < 3:
   -> Tworz draft, incrementuj counter

PROGI:
- Max 3 drafty / 24h / lead (domyslnie)
- Max 1 draft / 1h / lead (burst protection)
- Konfigurowalny przez env variable: DRAFT_FREQUENCY_CAP_24H=3
```

**Dodatkowy guardrail:** Draft Quality Guard (juz zaimplementowany) sprawdza SENT w watku — jesli user juz odpowiedzial, Lambda nie tworzy nowego draftu. To naturalnie przerywa petle.

---

#### EDGE CASE 4: GHOST MODE CONFLICT — Sonnet vs Opus

**Problem:** Lambda generuje drafty z Claude Sonnet (tansza, szybsza, wystarczajaca jakosc). User w sesji Claude Code uzywa Opus (lepsza jakosc, pelny @ghost kontekst, ghost_styl.md + pelna historia). Dwie rozne jakosci draftow — moze byc niespojnosc stylistyczna.

**Rozwiazanie architektoniczne:** **Dwupoziomowy system jakosci z jawnym oznaczeniem.**

**Implementacja:**

```
POZIOM 1 — AWS AUTO-DRAFT (Sonnet):
- Dla: standardowe odpowiedzi (cennik, dostepnosc, follow-up, potwierdzenia)
- Jakosc: 80% — wystarczajaca do szybkich odpowiedzi B2B
- Oznaczenie w drafcie: Na gorze body dodaj marker:
  "[AUTO-DRAFT — review before sending]"
  -> User widzi ze to auto-draft i moze edytowac przed wyslaniem

POZIOM 2 — MAC SESSION (Opus):
- Dla: DECISION mails (negocjacje, reklamacje, nowi partnerzy)
- Jakosc: 100% — pelny @ghost kontekst + Opus reasoning
- Lambda NIE tworzy draftu -> wysyla Telegram alert -> User odpala sesje @ceo/@ghost

SPÓJNOSC STYLISTYCZNA:
- OBA poziomy uzywaja tego samego ghost_styl.md (sekcja B2B Sprzedaz) jako system prompt.
- Roznica: Sonnet ma ~80% accuracy w stylu, Opus ~95%.
- Akceptowalne: user i tak przegladal KAZDY draft przed wyslaniem.

MANAGEMENT:
- S3: wersja ghost_styl.md MUSI byc identyczna z lokalna (patrz Edge Case 2).
- Dashboard (Faza 6+): tracking "ile draftow auto vs manual" — jesli user edytuje >50% auto-draftow, Sonnet jest za slaby -> rozważ upgrade do Opus w Lambda (drozsze: ~3x).
```

---

#### EDGE CASE 5: CRM DESYNC — Lambda vs User update

**Problem:** Lambda updateuje CRM (Due +3d, ostatni kontakt = dzis). W tym samym czasie user w sesji Claude Code zmienia Due recznie (np. "ustaw Due na za tydzien"). Kto wygrywa? Notion nie ma transakcji — last write wins.

**Rozwiazanie architektoniczne:** **Lambda = append-only + timestamp. User = source of truth.**

**Implementacja:**

```
ZASADA GLOWNA: User write ZAWSZE wygrywa. Lambda write jest "suggestion".

MECHANIZM:
1. Lambda PRZED update CRM: sprawdz `ostatni kontakt` w Notion
   -> Jesli ostatni kontakt == DZIS (user juz zaktualizowal):
      -> SKIP CRM update
      -> Telegram: "CRM juz zaktualizowany dzis dla [firma]. Lambda SKIP."

2. Lambda aktualizuje notatki jako APPEND (nie overwrite):
   -> Notion API: notatki += "\n+ AWS auto-draft [data] [temat]"
   -> NIE nadpisuj istniejacych notatek

3. Lambda aktualizuje Due TYLKO jesli lead.Due < today (overdue) lub lead.Due == null:
   -> Jesli lead.Due > today (user ustawil przyszly Due) -> NIE ZMIENIAJ
   -> Telegram: "[firma] Due juz ustawione na [data] (user). Lambda nie zmienia."

4. Conflict resolution log: DynamoDB
   -> PK: "CRM_UPDATE#[lead_id]#[timestamp]"
   -> source: "lambda" | "mac-session"
   -> action: "due_updated" | "due_skipped" | "contact_updated"
   -> TTL: 30 dni
```

**Efekt:** Lambda jest "delikatna" — aktualizuje CRM tylko gdy user NIE dotkal leada. Jesli user jest aktywny -> Lambda ustepuje.

---

#### EDGE CASE 6: GMAIL PUSH NOTIFICATION FAILURE

**Problem:** Google przestaje wysylac push notifications (np. watch wygaslo, Pub/Sub blad, Google outage). System milczy. Maile przychodza ale Lambda nie jest triggerowana. Nikt nie wie.

**Rozwiazanie architektoniczne:** **Trzy warstwy detekcji.**

**Implementacja:**

```
WARSTWA 1 — EventBridge fallback (JUZ JEST):
- Co 15 min Lambda poll Gmail (newer_than:15m)
- Jesli Push nie dziala — fallback zlapie mail z opoznieniem max 15 min
- PROBLEM: User nie wie ze Push nie dziala (dziala cicho na fallback)

WARSTWA 2 — Heartbeat monitoring:
- DynamoDB record: PK = "HEARTBEAT#webhook"
  - lastWebhookAt: ISO timestamp (aktualizowany przy KAZDYM webhook call)
- EventBridge rule: co 1h Lambda sprawdza heartbeat:
  - Jesli lastWebhookAt > 2h temu -> Telegram:
    "PUSH MONITOR: Gmail webhook nie odezwal sie od [X]h. System dziala na fallback polling (15 min). Sprawdz watch status."
  - Jesli lastWebhookAt > 24h -> Telegram:
    "PUSH KRYTYCZNY: Webhook milczy od 24h. Watch mogl wygasnac. Odnow: curl -X POST gmail watch API."

WARSTWA 3 — Watch auto-renewal (JUZ W PLANIE):
- EventBridge rule: co 6 dni odnow Gmail watch() (watch wygasa po 7 dniach)
- Jesli odnowienie FAILED -> Telegram alert + fallback polling nadal dziala

WARSTWA 4 — Daily health check (Faza 2+):
- Morning-scan Lambda: na poczatku sprawdz heartbeat + watch status
- Dodaj do morning-feed.md: "System health: Push [OK/FALLBACK], Watch expires: [data]"
```

---

#### EDGE CASE 7: COST SPIKE — spam flood

**Problem:** Ktos wysyla 100 spamowych maili na mateusz.sokolski@artnapi.pl. Lambda przetwarza KAZDY przez Bedrock (klasyfikacja + ewentualny draft). Rachunek Bedrock rosnie.

**Rozwiazanie architektoniczne:** **Multi-level throttling + cost ceiling.**

**Implementacja:**

```
POZIOM 1 — Gmail query filter (JUZ JEST):
- Query wyklucza: -category:promotions -category:social -category:updates
- To filtruje WIEKSZOSC spamu (Gmail klasyfikuje automatycznie)

POZIOM 2 — Lambda throttle per invocation:
- Max 10 maili per Lambda invocation (JUZ JEST: limit w gmailSearchMessages)
- Jesli > 10 nowych maili -> przetworz 10, reszta przy nastepnym invocation

POZIOM 3 — Daily Bedrock budget cap:
- DynamoDB counter: PK = "BUDGET#[data]"
  - bedrockCallsToday: number
  - bedrockTokensToday: number
- Progi:
  - bedrockCallsToday >= 50 -> STOP + Telegram:
    "BUDGET CAP: Lambda przetworzyala 50 maili dzis. Limit osiagniety. Dalsze maile na jutro."
  - bedrockTokensToday >= 100,000 -> STOP (koszt ~$0.50/dzien, ~$15/msc)
- Konfigurowalny: env variable DAILY_BEDROCK_CAP=50

POZIOM 4 — Unknown sender throttle:
- Jesli nadawca NIE jest w CRM (nowy/nieznany):
  - Max 3 auto-drafty / dzien do unknown senders
  - Reszta -> Telegram alert only (bez Bedrock call)
  - Powod: spam najczesciej od unknown senders

POZIOM 5 — AWS Budget Alert (infrastruktura):
- AWS Budgets: ustaw alert na $20/msc na caly account
  -> SNS -> email do usera
  -> Wczesne ostrzezenie jesli cos poszlo nie tak

SZACUNEK WORST CASE:
- 100 spam maili * 2 Bedrock calls (klasyfikacja + draft) = 200 calls
- 200 * ~2500 tokens avg = 500K tokens
- Koszt: 500K * $3/1M (input) + 500K * $15/1M (output) = ~$1.50 + ~$7.50 = ~$9.00
- Z daily cap 50: max $4.50/dzien
- Z budget alert $20/msc: wczesne ostrzezenie
```

---

#### EDGE CASE 8: MULTI-BUSINESS — @artnapi.pl vs @system10h.com

**Problem:** Mail przychodzi na @artnapi.pl — Lambda uzywa kontekstu ArtNapi (oferta.md, CRM ArtNapi, ghost_styl B2B Sprzedaz). Ale co jesli w przyszlosci Lambda obsluguje TAKI @system10h.com? Musi wiedziec ktory kontekst zaladowac.

**Rozwiazanie architektoniczne:** **Business context routing na podstawie email address.**

**Implementacja:**

```
ARCHITEKTURA (przyszlosciowa):

OPCJA A — Osobne Lambdy per biznes (REKOMENDOWANA):
  Lambda: artnapi-email-processor  -> S3: artnapi-kb/ -> CRM: artnapi DB
  Lambda: system10h-email-processor -> S3: system10h-kb/ -> CRM: system10h DB
  - Izolacja pelna: osobne sekrety, osobne S3 folders, osobne DynamoDB tables
  - Koszt: $0 dodatkowego (Lambda free tier per function)
  - Zaleta: awaria jednego nie wplywa na drugi
  - Wada: duplikacja kodu (rozwiazanie: wspolna Lambda Layer z utilsami)

OPCJA B — Jedna Lambda z routing (prostsza ale mniej izolowana):
  Lambda: email-processor
    |
    +-- event.recipientEmail == @artnapi.pl
    |     -> S3: artnapi-kb/oferta.md, artnapi-kb/ghost_styl.md
    |     -> CRM: Notion DB 19a268dd...
    |     -> ghost_styl: sekcja "B2B Sprzedaz"
    |
    +-- event.recipientEmail == @system10h.com
          -> S3: system10h-kb/oferta.md, system10h-kb/ghost_styl.md
          -> CRM: Notion DB [system10h_db_id]
          -> ghost_styl: sekcja "LinkedIn DM"

  Config w S3: business-config.json
  {
    "artnapi.pl": {
      "kb_prefix": "artnapi-kb",
      "crm_db_id": "19a268dd-...",
      "ghost_styl_section": "B2B Sprzedaz",
      "my_email": "mateusz.sokolski@artnapi.pl",
      "telegram_chat_id": "1304598782"
    },
    "system10h.com": {
      "kb_prefix": "system10h-kb",
      "crm_db_id": "[TBD]",
      "ghost_styl_section": "LinkedIn DM",
      "my_email": "mateusz@system10h.com",
      "telegram_chat_id": "1304598782"
    }
  }

MVP (TERAZ): Tylko @artnapi.pl. Hardcoded. Nie overengineer.
PRZYSZLOSC: Gdy System 10H dojdzie -> Opcja A (osobne Lambdy, lepsza izolacja).
```

---

#### PODSUMOWANIE EDGE CASES — PRIORYTET IMPLEMENTACJI

| # | Edge Case | Ryzyko | Trudnosc | Kiedy |
|---|-----------|--------|----------|-------|
| 1 | Race condition (Mac + AWS) | SREDNIE | LATWE (sprawdz drafty w Gmail) | MVP (18.03) |
| 3 | Spam loop | SREDNIE | LATWE (frequency cap w DynamoDB) | MVP (18.03) |
| 7 | Cost spike | WYSOKIE | LATWE (daily cap + AWS Budget) | MVP (18.03) |
| 5 | CRM desync | SREDNIE | SREDNIE (conditional update logic) | MVP (18.03) |
| 6 | Push failure | NISKIE (fallback istnieje) | LATWE (heartbeat) | Tydzien 1 |
| 2 | Stale oferta.md | SREDNIE | LATWE (GitHub Actions) | Tydzien 1 |
| 4 | Ghost mode conflict | NISKIE | NONE (oznaczenie [AUTO-DRAFT]) | Tydzien 1 |
| 8 | Multi-business | BRAK (teraz 1 biznes) | N/A | Przyszlosc |

---

## G. FAZY ROZSZERZENIA (SZCZEGOLOWE)

> Kazda faza opisana na poziomie: trigger, Lambda flow, input/output, integracje, koszt szacunkowy.
> Cel: przyszly @cto moze zbudowac kazda faze BEZ dopytywania.

---

### Faza 2: Morning Scan na Lambda (zamiast Mac cron)

**Co:** Przeniesienie morning-scan.js na AWS Lambda. Generuje codzienny raport morning-feed.md z danymi z Gmail + CRM + cross-check.

**Trigger:** EventBridge cron: `cron(0 6 ? * MON-FRI *)` (8:00 CET = 6:00 UTC)

**Lambda:** `artnapi-morning-scan`
**Runtime:** Node.js 20.x | **Memory:** 512 MB | **Timeout:** 180s (wiecej API calls niz email-processor)

**Flow krok po kroku:**

```
EventBridge (8:00 pn-pt)
    |
    v
Lambda: morning-scan
    |
    +-- 1. Secrets Manager: pobierz credentials
    |
    +-- 2. Gmail API: inbox (last 16h) -> lista nowych maili
    |       query: "to:mateusz.sokolski@artnapi.pl is:inbox newer_than:16h"
    |
    +-- 3. Gmail API: sent (last 16h) -> lista wyslanych
    |       query: "from:mateusz.sokolski@artnapi.pl in:sent newer_than:16h"
    |
    +-- 4. Gmail API: drafts -> lista draftow (pending review)
    |       endpoint: /gmail/v1/users/me/drafts
    |
    +-- 5. Notion CRM: full pipeline query
    |       -> wszystkie leady z Status != "Zamknieta-Wygrana" i != "Klient/AM"
    |       -> wyciagnij: firma, osoba, status, Due, ostatni kontakt, email
    |
    +-- 6. CROSS-CHECK: Gmail emails vs CRM emails
    |       -> MISMATCH: mail od kogos kto NIE jest w CRM -> alert
    |       -> OVERDUE: lead z Due < today -> alert z emailem leada
    |       -> NO REPLY: mail wyslany >3d temu bez odpowiedzi -> alert
    |
    +-- 7. Bedrock (opcjonalnie): podsumowanie dnia w 3 zdaniach
    |       -> input: lista maili + pipeline snapshot
    |       -> output: "Dzis najwazniejsze: 1)... 2)... 3)..."
    |
    +-- 8. OUTPUT: Generuj morning-feed.md (structured Markdown)
    |       Sekcje: INBOX | SENT | DRAFTS | MISMATCHE | OVERDUE | PIPELINE | REKOMENDACJE
    |
    +-- 9. S3: upload morning-feed.md do s3://artnapi-email-processor-kb/morning-feed.md
    |
    +-- 10. Telegram: wyslij summary (5-10 linii, najwazniejsze akcje)
    |
    +-- 11. (opcjonalnie) GitHub API: commit morning-feed.md do repo asystent
            -> zeby Claude Code mial swiezy plik na starcie sesji
```

**Input:**
- Gmail OAuth (Secrets Manager)
- Notion API Key (Secrets Manager)
- Telegram Bot Token (Secrets Manager)
- S3: persona.md (opcjonalnie, dla kontekstu rekomendacji)

**Output:**
- `s3://artnapi-email-processor-kb/morning-feed.md` — pelny raport
- Telegram message — summary 5-10 linii
- (opcjonalnie) Git commit do `dane/artnapi/morning-feed.md`

**Integracje:** Gmail API (readonly), Notion API (readonly), Bedrock (opcjonalnie), S3 (write), Telegram (write), GitHub API (opcjonalnie)

**IAM dodatkowe uprawnienia:**
- `s3:PutObject` na `artnapi-email-processor-kb/morning-feed.md`
- Reszta identyczna jak email-processor

**Koszt szacunkowy:**
- Lambda: $0.00 (1 invokacja/dzien, free tier)
- Bedrock (opcjonalnie): ~$0.10/msc (22 invokacje * ~500 input + ~200 output tokens)
- S3 write: $0.00 (negligible)
- **TOTAL Faza 2: ~$0.10/msc** (bez Bedrock: $0.00)

**Port z kodu Mac:**
- Bazuje na `automatyzacje/morning-scan.js`
- Glowna zmiana: output do S3 zamiast lokalnego pliku + Telegram summary
- Sekrety z Secrets Manager zamiast .env

**Deployment:**
- Osobna Lambda (nie w email-processor) — inny trigger, inna logika
- Wspolny Secrets Manager secret
- Wspolny S3 bucket
- CDK: dodaj do istniejacego stacka

---

### Faza 3: Follow-up Guardian na Lambda

**Co:** Przeniesienie followup-guardian.js na AWS. Codziennie o 17:00 skanuje CRM i wysyla alerty o leadach ktore wymagaja follow-upu.

**Trigger:** EventBridge cron: `cron(0 15 ? * MON-FRI *)` (17:00 CET = 15:00 UTC)

**Lambda:** `artnapi-followup-guardian`
**Runtime:** Node.js 20.x | **Memory:** 256 MB | **Timeout:** 60s

**Flow krok po kroku:**

```
EventBridge (17:00 pn-pt)
    |
    v
Lambda: followup-guardian
    |
    +-- 1. Secrets Manager: pobierz credentials
    |
    +-- 2. Notion CRM: query all active leads
    |       Filter: Status IN ["Pierwszy kontakt", "Kwalifikacja", "Wysłana próbka", "Dogrywanie"]
    |       Sort: Due ascending
    |
    +-- 3. ANALIZA per lead:
    |       a. OVERDUE: Due < today -> PILNE
    |       b. DUE TODAY: Due == today -> DO ZROBIENIA
    |       c. DUE TOMORROW: Due == tomorrow -> HEADS UP
    |       d. NO CONTACT >7d: ostatni kontakt > 7 dni temu -> CHLODZENIE SIE
    |       e. HIGH VALUE OVERDUE: wartosc > 5000 PLN AND overdue -> KRYTYCZNE
    |
    +-- 4. PRIORYTETYZACJA:
    |       -> Sortuj: KRYTYCZNE > PILNE > DUE TODAY > CHLODZENIE > HEADS UP
    |       -> Max 10 leadow w alercie (zeby nie zalewac Telegramu)
    |
    +-- 5. Telegram: wyslij alert
    |       Format:
    |       "FOLLOW-UP GUARDIAN (17:00):
    |        KRYTYCZNE (overdue + high value):
    |        - [firma] — Due: [data] — [status] — [wartosc] PLN
    |        PILNE (overdue):
    |        - [firma] — Due: [data] — ostatni kontakt: [data]
    |        DO ZROBIENIA (due today):
    |        - [firma] — [status]
    |        ---
    |        Akcja: @ceo sesja lub reczny follow-up"
    |
    +-- 6. DynamoDB: zapisz snapshot (opcjonalnie, dla tracking trendu)
            -> PK: GUARDIAN#2026-03-18
            -> overdue_count, due_today_count, critical_count
```

**Input:**
- Notion API Key (Secrets Manager)
- Telegram Bot Token (Secrets Manager)

**Output:**
- Telegram message — priorytetyzowany alert
- DynamoDB snapshot (opcjonalnie, dla trendow)

**Integracje:** Notion API (readonly), Telegram (write), DynamoDB (write, opcjonalnie)

**Koszt szacunkowy:**
- Lambda + Notion + Telegram: $0.00 (free tier, minimalne uzycie)
- **TOTAL Faza 3: $0.00/msc**

**Port z kodu Mac:**
- Bazuje na `automatyzacje/followup-guardian.js`
- Glowna zmiana: sekrety z Secrets Manager, brak filesystem state
- Logika priorytetyzacji identyczna

---

### Faza 4: Stock Monitor na Lambda

**Co:** Przeniesienie stock-monitor.js na AWS. Monitoruje stany magazynowe z Google Sheets i wysyla alerty gdy produkt spada ponizej progu.

**Trigger:** EventBridge cron: `cron(0 6,10,14 ? * MON-FRI *)` (8:00, 12:00, 16:00 CET — co 4h w business hours)

**Lambda:** `artnapi-stock-monitor`
**Runtime:** Node.js 20.x | **Memory:** 256 MB | **Timeout:** 60s

**Flow krok po kroku:**

```
EventBridge (co 4h, pn-pt)
    |
    v
Lambda: stock-monitor
    |
    +-- 1. Secrets Manager: pobierz credentials (jesli potrzebne)
    |
    +-- 2. Google Sheets: pobierz dane stockowe
    |       -> Fetch CSV: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv
    |       -> Parse CSV: produkt, stan, prog_alert, prog_reorder
    |       (Sheet ID i URL z api-inventory.md / env variable)
    |
    +-- 3. ANALIZA per produkt:
    |       a. OUT OF STOCK: stan == 0 -> KRYTYCZNE
    |       b. BELOW ALERT: stan < prog_alert -> ALERT
    |       c. BELOW REORDER: stan < prog_reorder -> ZAMOW
    |       d. TRENDING DOWN: stan spadl >20% od ostatniego checku -> TREND
    |
    +-- 4. DynamoDB: porownaj z ostatnim snapshotem
    |       -> PK: STOCK#[produkt_id]
    |       -> Jesli stan sie zmienil -> flaguj
    |       -> Zapisz nowy snapshot
    |
    +-- 5. S3: upload stock.json (aktualny stan — uzywa go email-processor w Faza 6+)
    |       -> s3://artnapi-email-processor-kb/stock.json
    |
    +-- 6. Telegram: wyslij alert TYLKO jesli sa zmiany/problemy
    |       Format:
    |       "STOCK MONITOR:
    |        BRAK NA STANIE: [produkt] — zamow natychmiast!
    |        NISKI STAN: [produkt] — [X] szt (prog: [Y])
    |        TREND: [produkt] spadl z [A] do [B] (-Z%)
    |        ---
    |        Pelny stan: [link do Google Sheets]"
    |
    +-- 7. (opcjonalnie) Notion CRM: update leada jesli zamowil produkt ktory jest OOS
            -> "Produkt [X] niedostepny — poinformuj klienta"
```

**Input:**
- Google Sheets CSV URL (env variable)
- DynamoDB: poprzedni snapshot
- (opcjonalnie) Notion API Key

**Output:**
- Telegram alert (tylko przy zmianach/problemach — nie spamuje)
- DynamoDB: nowy snapshot
- S3: stock.json (dla innych Lambdas)

**Integracje:** Google Sheets (public CSV lub API), DynamoDB (read/write), S3 (write), Telegram (write), Notion (opcjonalnie, write)

**Koszt szacunkowy:**
- Lambda: $0.00 (3 invokacje/dzien, free tier)
- DynamoDB: $0.00 (kilkadziesiat writes/dzien, free tier)
- **TOTAL Faza 4: $0.00/msc**

**Port z kodu Mac:**
- Bazuje na `automatyzacje/stock-monitor.js`
- Glowna zmiana: DynamoDB zamiast lokalnego JSON state, S3 upload stock.json
- Google Sheets fetch identyczny (publiczny CSV nie wymaga OAuth)

---

### Faza 5: Recon Autonomous na Lambda

**Co:** @recon dzialajacy autonomicznie na AWS. Co tydzien generuje listy targetow, scoruje ICP, dodaje do CRM.
**Szczegolowa architektura:** Patrz sekcja H (H1-H6).

**Trigger:** EventBridge cron: `cron(0 5 ? * MON *)` (poniedzialek 7:00 CET = 5:00 UTC)

**Lambda:** `artnapi-recon-engine` (orchestrator) + `artnapi-recon-scorer` (worker)

**Flow krok po kroku:**

```
EventBridge (pon 7:00)
    |
    v
Lambda: recon-orchestrator (timeout: 300s)
    |
    +-- 1. Secrets Manager: pobierz credentials
    |
    +-- 2. S3: zaladuj persona.md (ICP definition)
    |
    +-- 3. DynamoDB: pobierz liste JUZ przetworzonych firm (dedup)
    |       -> PK: RECON#[place_id] — TTL 90 dni
    |
    +-- 4. Google Maps Places API (New):
    |       PER MIASTO (Warszawa, Krakow, Wroclaw, Poznan, Gdansk, Lublin, Katowice):
    |         -> Nearby Search: "sklep plastyczny" / "sklep artystyczny" / "hobby market"
    |         -> radius: 15km od centrum
    |         -> fields: name, address, phone, website, rating, place_id
    |         -> Max 20 wynikow per miasto per fraza
    |       DEDUP: Filtruj firmy ktore juz sa w DynamoDB
    |
    +-- 5. WebFetch (prosty HTTP GET) per nowa firma:
    |       -> Pobierz strone www (jesli istnieje)
    |       -> Regex: szukaj email kontaktowy (info@, kontakt@, biuro@)
    |       -> Regex: szukaj social media (facebook, instagram)
    |       -> Timeout: 5s per strona (nie blokuj na wolnych stronach)
    |
    +-- 6. Bedrock (Claude Sonnet) — ICP Scoring per firma:
    |       System: "Jestes ekspertem od kwalifikacji leadow B2B w branzy art supplies."
    |       User: "{dane firmy} vs {persona.md ICP definition}"
    |       Output (structured JSON):
    |         {
    |           "score": 0-100,
    |           "reasoning": "1 zdanie",
    |           "suggested_approach": "cold email / telefon / pominac",
    |           "segment": "retail / hurtownia / siec / edukacja",
    |           "estimated_value": "niska / srednia / wysoka"
    |         }
    |
    +-- 7. FILTR: score >= 60 -> dodaj do CRM, score < 60 -> zapisz w DynamoDB ale nie dodawaj
    |
    +-- 8. Notion API: dodaj leada do CRM
    |       -> Task name: "[firma]"
    |       -> Status: "Baza"
    |       -> Email: z WebFetch (jesli znaleziony) lub PUSTE
    |       -> notatki: "AWS Recon [data] | ICP: [score] | [reasoning] | [suggested_approach]"
    |       -> segment rynku: z Bedrock output
    |       -> source: "AWS Recon"
    |       RATE LIMIT: max 3 req/s do Notion (ich limit)
    |
    +-- 9. DynamoDB: zapisz przetworzone firmy (dedup na przyszlosc)
    |       -> PK: RECON#[place_id]
    |       -> TTL: 90 dni (rescan po 3 miesiacach)
    |
    +-- 10. Telegram: weekly summary
            "RECON WEEKLY ([data]):
             Przeskanowano [X] miast, znaleziono [Y] nowych firm.
             Dodano [Z] do CRM (ICP >= 60).
             Pominieto [W] (ICP < 60).
             Top 3 targety:
             1. [firma] — [miasto] — ICP: [score] — [segment]
             2. ...
             3. ...
             @cso przygotuj outreach do top 3."
```

**Input:**
- Google Maps API Key (Secrets Manager)
- Notion API Key (Secrets Manager)
- Telegram Bot Token (Secrets Manager)
- S3: persona.md
- DynamoDB: processed firms (dedup)

**Output:**
- Notion CRM: nowe leady (status "Baza")
- DynamoDB: dedup records
- Telegram: weekly summary

**Integracje:** Google Maps Places API (New), Bedrock, Notion API, S3, DynamoDB, Telegram

**IAM dodatkowe uprawnienia:**
- Google Maps API Key w Secrets Manager (nowy secret)

**Koszt szacunkowy (per tydzien, ~50 targetow):**
- Google Maps: 50 nearby ($0.85) + 50 details ($0.85) = ~$1.70/tydzien
- WebFetch: $0.00 (prosty HTTP)
- Bedrock: 50 * ~700 tokens = ~$0.05/tydzien
- Lambda + DynamoDB + Telegram: $0.00
- **TOTAL Faza 5: ~$7.00/msc (~28 PLN/msc)**

---

### Faza 6: Pipeline Intelligence (NOWA)

**Co:** Cotygodniowa analiza pipeline'u z Bedrock. Identyfikuje: stale deale, optymalne next steps, revenue forecast, wzorce wygranych/przegranych dealow.

**Trigger:** EventBridge cron: `cron(0 5 ? * FRI *)` (piatek 7:00 CET = 5:00 UTC)

**Lambda:** `artnapi-pipeline-intelligence`
**Runtime:** Node.js 20.x | **Memory:** 512 MB | **Timeout:** 120s

**Flow krok po kroku:**

```
EventBridge (piatek 7:00)
    |
    v
Lambda: pipeline-intelligence
    |
    +-- 1. Secrets Manager: pobierz credentials
    |
    +-- 2. Notion CRM: pobierz CALY pipeline
    |       -> Wszystkie leady (wszystkie statusy, wlacznie z Zamknieta-Wygrana/Przegrana)
    |       -> Pola: firma, status, wartosc, Due, ostatni kontakt, notatki, segment, kraj, source
    |
    +-- 3. DynamoDB: pobierz historyczne snapshoty (ostatnie 4 tygodnie)
    |       -> PK: PIPELINE#[data] — porownanie tydzien do tygodnia
    |
    +-- 4. Bedrock (Claude Sonnet) — Pipeline Analysis:
    |       System: "Jestes analitykiem pipeline B2B. Analizujesz dane CRM i dajesz rekomendacje."
    |       User: {caly pipeline JSON + historyczne snapshoty}
    |       Output (structured JSON):
    |         {
    |           "pipeline_velocity": {
    |             "avg_days_to_close": X,
    |             "conversion_rate_per_stage": {...},
    |             "bottleneck_stage": "Kwalifikacja",
    |             "trend": "improving / declining / stable"
    |           },
    |           "stale_deals": [
    |             {"firma": "X", "days_since_contact": Y, "recommendation": "breakup email / escalate / archive"}
    |           ],
    |           "revenue_forecast": {
    |             "30d_weighted": X,
    |             "60d_weighted": Y,
    |             "90d_weighted": Z
    |           },
    |           "patterns": {
    |             "winning": "Leady z segmentu [X] konwertuja 2x szybciej",
    |             "losing": "Leady bez probki po 14d maja 80% szanse na strate"
    |           },
    |           "top3_actions": [
    |             "1. Wyslij breakup do [firma] (stale 21d)",
    |             "2. Probka do [firma] (hot lead, high value)",
    |             "3. Follow-up [firma] (Due today, [wartosc] PLN)"
    |           ]
    |         }
    |
    +-- 5. DynamoDB: zapisz tygodniowy snapshot
    |       -> PK: PIPELINE#2026-03-21
    |       -> total_value, lead_count, stage_distribution, velocity
    |       -> TTL: 365 dni (roczna historia)
    |
    +-- 6. S3: upload pipeline-report.md
    |       -> s3://artnapi-email-processor-kb/pipeline-report.md
    |       -> Structured Markdown z wynikami analizy
    |
    +-- 7. Telegram: weekly pipeline brief
            "PIPELINE INTELLIGENCE (pt [data]):
             Pipeline: [X] leadow | [Y] PLN weighted forecast (30d)
             Velocity: [Z] dni avg to close ([trend])
             Bottleneck: [stage] ([conversion_rate]%)
             ---
             TOP 3 AKCJE NA TEN TYDZIEN:
             1. [akcja]
             2. [akcja]
             3. [akcja]
             ---
             Stale deale (>14d bez kontaktu): [N]
             Pelny raport: @ceo sesja -> czytaj pipeline-report.md"
```

**Input:**
- Notion API Key (Secrets Manager)
- Telegram Bot Token (Secrets Manager)
- DynamoDB: historyczne snapshoty pipeline

**Output:**
- S3: pipeline-report.md
- DynamoDB: tygodniowy snapshot
- Telegram: pipeline brief

**Integracje:** Notion API (readonly), Bedrock, S3 (write), DynamoDB (read/write), Telegram (write)

**Koszt szacunkowy:**
- Bedrock: ~$0.05/tydzien (1 invokacja z duzym inputem ~5000 tokens)
- Lambda + DynamoDB + S3: $0.00
- **TOTAL Faza 6: ~$0.20/msc**

---

### PODSUMOWANIE KOSZTOW WSZYSTKICH FAZ

| Faza | Opis | Koszt/msc | Priorytet |
|------|------|-----------|-----------|
| 1 (MVP) | Email Processor | ~$6.75 | TERAZ (18.03) |
| 2 | Morning Scan | ~$0.10 | WYSOKI (tydzien 2) |
| 3 | Follow-up Guardian | $0.00 | WYSOKI (tydzien 2) |
| 4 | Stock Monitor | $0.00 | SREDNI (tydzien 3) |
| 5 | Recon Autonomous | ~$7.00 | NISKI (tydzien 4+) |
| 6 | Pipeline Intelligence | ~$0.20 | SREDNI (tydzien 3) |
| **TOTAL** | **Pelny system** | **~$14.05/msc (~56 PLN)** | |

**Kolejnosc wdrazania:** Faza 1 -> 2+3 (razem, wspolna infrastruktura) -> 4+6 (razem) -> 5 (osobno, wymaga Google Maps API key)

---

## H. RECON ON AWS — ANALIZA

### H1. Cel
@recon dzialajacy w tle na AWS: co tydzien generuje listy targetow, scoruje ICP, wrzuca do Notion CRM.

### H2. Mozliwy Flow

```
EventBridge (poniedzialek 7:00 CET)
    |
    v
Lambda: recon-engine
    |
    +-- Google Maps Places API (nearby search)
    |   -> szukaj: "sklep plastyczny", "sklep artystyczny", "hobby market"
    |   -> per miasto: Warszawa, Krakow, Wroclaw, Poznan, Gdansk, Lublin, Katowice
    |   -> wynik: nazwa, adres, telefon, strona www, ocena Google
    |
    +-- WebFetch: strona www firmy
    |   -> szukaj: email kontaktowy, formularz, social media
    |   -> parsuj: opis firmy, produkty, branża
    |
    +-- Bedrock (Claude Sonnet): ICP Scoring
    |   -> input: dane firmy + nasz ICP z persona.md
    |   -> output: score 0-100 + uzasadnienie + suggested approach
    |
    +-- Notion API: Dodaj leada do CRM
    |   -> status: "Baza"
    |   -> source: "AWS Recon"
    |   -> notatki: ICP score + uzasadnienie
    |
    +-- DynamoDB: Dedup (nie dodawaj firmy ktora juz jest w CRM)
    |
    +-- Telegram: "RECON: Dodano [X] nowych targetow. Top 3: [firmy]"
```

### H3. API potrzebne

| API | Cel | Koszt | Limit |
|-----|-----|-------|-------|
| Google Maps Places API (New) | Nearby search + place details | $17/1000 calls (Nearby) + $17/1000 (Details) | 50,000/dzien |
| Bedrock (Sonnet) | ICP scoring | ~$0.01/lead (500 input + 200 output tokens) | Bez limitu |
| Notion API | Dodanie leadow | Free | 3 req/s |

**Szacunek kosztu:**
- 50 targetow/tydzien × 4 tygodnie = 200/msc
- Google Maps: 200 nearby ($3.40) + 200 details ($3.40) = **~$6.80/msc**
- Bedrock: 200 × $0.01 = **~$2.00/msc**
- Lambda + EventBridge + DynamoDB: **$0.00** (free tier)
- **TOTAL RECON: ~$8.80/msc (~35 PLN/msc)**

### H4. Ograniczenia

**Web scraping z Lambda:**
- Lambda moze robic proste HTTP fetch (strony www firm) — OK dla statycznych stron
- NIE moze robic headless browser (Puppeteer/Playwright) na standardowej Lambda
  - Rozwiazanie: Lambda z Docker image + Chromium layer (~500 MB) — mozliwe ale drogie
  - Lepsze rozwiazanie: AWS Fargate (kontener z headless browser) triggerowany przez Lambda
  - MVP: Pominac scraping stron z JS rendering, uzyc prostego fetch + regex/parse

**BIP (Biuletyn Informacji Publicznej):**
- BIP nie ma API — wymaga scraping HTML stron urzedow
- Kazdy urzad ma INNY format BIP
- Realistycznie: Lambda + prosty fetch wystarczy dla wielu stron BIP (sa statyczne)
- Fallback: CSV z reczna lista urzedow (importowany do Lambda)

**Social Media:**
- LinkedIn: NIE MA publicznego API do scraping profili firm (ToS violation)
- Facebook: Graph API — ograniczony dostep (wymaga app review)
- Instagram: Bardzo ograniczone API
- Realistycznie: Google Maps + strony www = 80% danych. Social jako manual enrichment.

### H5. Recon Architecture (docelowa)

```
                    EventBridge
                    (pon 7:00)
                        |
                        v
               Lambda: recon-orchestrator
                        |
            +-----------+-----------+
            |           |           |
            v           v           v
      Google Maps   WebFetch    BIP Scraper
      (Places API)  (firm www)  (statyczny HTML)
            |           |           |
            +-----------+-----------+
                        |
                        v
               Lambda: recon-scorer
                        |
                        v
                    Bedrock
                (ICP Scoring)
                        |
               +--------+--------+
               |                 |
               v                 v
         Notion CRM        Telegram
       (nowy lead)        (summary)
```

### H6. MVP Recon na AWS

Dla pierwszej wersji: TYLKO Google Maps Places API + Bedrock scoring + Notion.
Bez web scraping, bez BIP, bez social media.
To juz da ~80% wartosci przy minimalnej zlozonosci.

**Dodatkowa wartosc:** Poniedzialkowy Telegram brief:
```
RECON WEEKLY (pon 7:30):
Przeskanowano [X] miast, znaleziono [Y] nowych firm.
Dodano [Z] do CRM (ICP > 60).
Top 3 targety:
1. [firma] — [miasto] — ICP: [score] — [powod]
2. ...
3. ...
@cso przygotuj outreach do top 3.
```

---

## I. POROWNANIE: OBECNY SYSTEM vs AWS

| Aspekt | Obecny (Mac) | AWS MVP |
|--------|-------------|---------|
| Dostepnosc | Tylko gdy Mac online | 24/7/365 |
| Latency (mail -> draft) | 30 min (email-radar poll) | <2 min (Push) lub 15 min (fallback) |
| Jakosc draftow | Brak auto-draftow (alert-only od 11.03) | Claude Sonnet z pelnym kontekstem (CRM + oferta + watek + ghost_styl) |
| CRM update | Reczny (w sesji @ceo) | Automatyczny (Due +3d, kontakt = dzis) |
| Koszt | $0 (ale wymaga Maca) | ~$6.75/msc |
| Guardrails | @ghost w sesji (najlepsza jakosc) | Price validation + klasyfikacja DECISION |
| Poranny raport | morning-scan.js (Mac 8:00) | Faza 2: Lambda (bez Maca) |
| Research targetow | Reczny (@recon w sesji) | Faza 5: Lambda + Google Maps + Bedrock |

### Co ZOSTAJE na Mac (interactive mode)

- Sesje @ceo/@ghost w Claude Code (najwyzsza jakosc odpowiedzi — Opus + pelny kontekst)
- Maile wymagajace DECYZJI (negocjacje, reklamacje, nowi partnerzy)
- Content generation (@content, carousel-generator)
- Strategiczne przeglądy (@coo, @pipeline)

### Co PRZENOSI SIE na AWS (autonomous mode)

- Email Processor (drafty na standardowe maile) — Faza 1
- Morning Scan (poranny raport) — Faza 2
- Follow-up Guardian (alerty o zaleglosci) — Faza 3
- Stock Monitor (kontrola stanow) — Faza 4
- Recon (budowanie list targetow) — Faza 5

---

## J. CHECKLIST WDROZENIOWY (18.03.2026)

- [ ] AWS Account: sprawdz dostep, region eu-west-1
- [ ] Bedrock: request model access dla Claude Sonnet w us-east-1
- [ ] Secrets Manager: utworz secret z credentials z .env
- [ ] CDK: init + deploy stack
- [ ] S3: upload oferta.md + ghost_styl.md
- [ ] Google Cloud: Pub/Sub topic + Push subscription
- [ ] Gmail API: watch() call
- [ ] Test: wyslij testowy mail, sprawdz CloudWatch + Telegram + Gmail drafty
- [ ] Monitoring: CloudWatch alarms (errors, duration, throttling)
- [ ] Dokumentacja: zaktualizuj api-inventory.md o AWS services

---

## K. PORTOWANIE KODU Z lib.js

Istniejacy kod w `automatyzacje/lib.js` (444 linii) zawiera gotowe funkcje ktore Lambda reuzywuje:

| Funkcja lib.js | Linia | Port do Lambda | Zmiana |
|----------------|-------|----------------|--------|
| `gmailGetAccessToken()` | 253-291 | gmail.mjs | Sekrety z Secrets Manager zamiast .env |
| `gmailFetch()` | 293-306 | gmail.mjs | Bez zmian |
| `gmailSearchMessages()` | 308-311 | gmail.mjs | Bez zmian |
| `gmailGetMessage()` | 313-347 | gmail.mjs | Bez zmian |
| `gmailCreateDraft()` | 400-433 | gmail.mjs | Bez zmian |
| `gmailListDrafts()` | 349-367 | gmail.mjs | Bez zmian |
| `notionFetch()` | 72-86 | notion.mjs | Sekrety z Secrets Manager |
| `queryCRM()` | 88-104 | notion.mjs | Bez zmian (ten sam data source ID) |
| `parseNotionLead()` | 106-138 | notion.mjs | Bez zmian |
| `sendTelegram()` | 28-48 | telegram.mjs | Sekrety z Secrets Manager |
| `extractEmail()` | 435-438 | utils.mjs | Bez zmian |
| `extractName()` | 440-443 | utils.mjs | Bez zmian |
| `isForeignLead()` | 141-157 | utils.mjs | Bez zmian |
| `escapeHtml()` | 369-371 | utils.mjs | Bez zmian |
| `wrapEmailHTML()` | 392-398 | utils.mjs | Bez zmian |
| `HTML_SIGNATURE_PL/EN` | 374-384 | utils.mjs | Bez zmian |
| `loadState/saveState` | 160-169 | dynamo.mjs | DynamoDB zamiast filesystem |
| `loadEnv()` | 10-23 | USUNIETY | Nie potrzebny (env z Lambda config) |

**Klucz:** 80% kodu juz istnieje i jest przetestowane. Port to glownie zmiana source sekretow (Secrets Manager zamiast .env) i state (DynamoDB zamiast plikow JSON).

---

*Dokument przygotowany przez @cto na sesji 17.03.2026. Gotowy do implementacji 18.03.2026.*
*Estimated implementation time: 3-4h (CDK + Lambda code + Gmail Push setup + test).*
