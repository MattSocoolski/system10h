# INWENTARZ NARZĘDZI I KLUCZY API

## ZASADY
- Ten plik to TWÓJ SEJF — nie pokazuj nikomu
- Klucze API traktuj jak hasła do banku
- Gdy usuniesz klucz z narzędzia — usuń go też stąd
- Klucze wpisuj RĘCZNIE (Sposób A) — nie wklejaj ich w rozmowę z AI
- Jeśli używasz Git — upewnij się że `.env` jest w `.gitignore`

---

## PODSUMOWANIE

| Narzędzie | API | MCP | Status | Klucz w .env |
|-----------|-----|-----|--------|-------------|
| Claude API (Anthropic) | TAK | N/A | AKTYWNE | [x] ANTHROPIC_API_KEY |
| MailerLite | TAK | TAK (podłączony) | AKTYWNE | [x] MAILERLITE_API_KEY |
| Resend | TAK | TAK (podłączony) | AKTYWNE | [x] RESEND_API_KEY |
| Gmail | TAK | TAK (podłączony) | AKTYWNE | [x] GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN |
| Notion | TAK | TAK (podłączony) | AKTYWNE | [x] NOTION_API_KEY |
| Cloudflare Workers | TAK | NIE | AKTYWNE | sekrety w Cloudflare Dashboard |
| Cloudflare Turnstile | TAK | NIE | AKTYWNE | sekret w `wrangler secret` |
| Cyber Folks | TAK (DirectAdmin API) | NIE | AKTYWNE | dane logowania panelu |
| LinkedIn | TAK (ograniczone) | NIE (community) | AKTYWNE | — |
| Calendly | TAK | NIE | AKTYWNE | — (ręcznie) |
| Loom | TAK | NIE | AKTYWNE | — (ręcznie) |
| Google AI Studio (Gemini) | TAK | TAK (community, podłączony) | AKTYWNE | [x] GOOGLE_AI_STUDIO_API_KEY |
| AIBL Network | — | — | AKTYWNE | [x] AIBL_NETWORK_TOKEN |
| Telegram Bot (Ultron) | TAK | NIE | AKTYWNE | [x] TELEGRAM_BOT_TOKEN |
| Google Sheets (Prowizje Artnapi) | NIE (publiczny CSV) | NIE — WebFetch | AKTYWNE | — (publiczny URL) |

---

## Claude API (Anthropic)

- **Do czego:** Modele AI (Claude Opus/Sonnet/Haiku) — Live Preview, Self-Discovery, automatyzacje
- **API:** TAK
- **MCP:** N/A (Claude Code sam jest klientem MCP)
- **Dokumentacja API:** https://docs.anthropic.com/en/api/getting-started
- **Endpoint:** `https://api.anthropic.com` → `POST /v1/messages`
- **Gdzie znaleźć klucz:**
  1. Wejdź na https://console.anthropic.com
  2. W panelu bocznym kliknij **"API Keys"**
  3. Kliknij **"Create Key"** → nadaj nazwę → skopiuj (wyświetla się TYLKO RAZ)
- **Klucz API:** w pliku `.env` jako `ANTHROPIC_API_KEY` [JEST]
- **Uwierzytelnianie:** nagłówek `x-api-key` + `anthropic-version`
- **Status:** AKTYWNE
- **Koszt:** Pay-as-you-go (prepaid credits). Opus ~$15/mln input, Sonnet ~$3/mln input, Haiku ~$1/mln input. Ustaw limit wydatków w console.anthropic.com!
- **Limit wydatków:** https://console.anthropic.com → Settings → Spend Limits
- **Użycie w automatyzacjach:** Email Radar (automatyzacje/email-radar.js) — Claude Haiku do generowania draftów odpowiedzi na maile leadów CRM. ~$0.001/mail. Dodane 03.03.2026.

---

## MailerLite

- **Do czego:** Email marketing — newslettery, automatyzacje, formularze, grupy subskrybentów
- **API:** TAK
- **MCP:** TAK — podłączony i działa (zweryfikowane 26.02.2026)
- **Konto:** hello@system10h.com (ID: #2106531)
- **Dokumentacja API:** https://developers.mailerlite.com/docs/
- **Dokumentacja MCP:** https://developers.mailerlite.com/mcp/
- **Endpoint:** `https://connect.mailerlite.com/api`
- **Rate limit:** 120 requestów/minutę
- **Gdzie znaleźć klucz:**
  1. Zaloguj się na MailerLite
  2. Przejdź do **Integrations** (menu główne)
  3. Wybierz **"MailerLite API"**
  4. Kliknij **"Generate new token"** → skopiuj natychmiast
- **Klucz API:** w pliku `.env` jako `MAILERLITE_API_KEY` [JEST]
- **Status:** AKTYWNE
- **Koszt:** Free do 1 000 sub / 12 000 emaili/msc. Growing Business od $10/msc.
- **Stan konta (26.02):** 4 subskrybentów, 2 grupy, 2 automatyzacje aktywne

---

## Resend

- **Do czego:** Maile transakcyjne — potwierdzenia, powiadomienia, emaile z Live Preview / Self-Discovery
- **API:** TAK
- **MCP:** TAK — oficjalny serwer, PODŁĄCZONY 26.02.2026
- **MCP repo:** https://github.com/resend/resend-mcp
- **MCP instalacja:**
  ```
  claude mcp add resend -e RESEND_API_KEY=re_xxxxxxxxx -- npx -y resend-mcp
  ```
- **Dokumentacja API:** https://resend.com/docs/introduction
- **Dokumentacja MCP:** https://resend.com/docs/knowledge-base/mcp-server
- **Endpoint:** `https://api.resend.com`
- **Gdzie znaleźć klucz:**
  1. Zaloguj się na https://resend.com/
  2. W panelu bocznym kliknij **"API Keys"**
  3. Kliknij **"Create API Key"** → skopiuj (zaczyna się od `re_`, wyświetla się TYLKO RAZ)
  4. Wybierz uprawnienia: Full Access lub Sending Access
- **Klucz API:** w pliku `.env` jako `RESEND_API_KEY` [JEST]
- **MCP podłączony:** 26.02.2026 (`claude mcp add resend`)
- **Status:** AKTYWNE (używane przez Live Preview)
- **Koszt:** Free: 3 000 emaili/msc (limit 100/dzień). Pro: $20/msc za 50 000 emaili.

---

## Gmail / Google Workspace

- **Do czego:** Poczta firmowa — mateusz.sokolski@artnapi.pl + hello@system10h.com
- **API:** TAK (OAuth 2.0 Installed App — Desktop Application)
- **MCP:** TAK — podłączony jako zarządzane połączenie Claude (claude_ai_Gmail)
- **Dokumentacja API:** https://developers.google.com/workspace/gmail/api/reference/rest
- **Gdzie znaleźć credentials:**
  1. Wejdź na https://console.cloud.google.com/
  2. Wybierz lub stwórz projekt
  3. **APIs & Services → Library** → szukaj "Gmail API" → Enable
  4. **APIs & Services → Credentials** → **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
  5. Typ aplikacji: **Desktop Application**
  6. Skopiuj Client ID + Client Secret
  7. Wpisz do .env jako GMAIL_CLIENT_ID i GMAIL_CLIENT_SECRET
  8. Odpal `node automatyzacje/gmail-auth.js` → zaloguj się → GMAIL_REFRESH_TOKEN zapisany auto
- **Klucze w .env:**
  - `GMAIL_CLIENT_ID` — OAuth Client ID (Desktop App)
  - `GMAIL_CLIENT_SECRET` — OAuth Client Secret
  - `GMAIL_REFRESH_TOKEN` — auto-generowany przez gmail-auth.js (jednorazowo)
- **MCP (sesja Claude):** Zarządzane połączenie (claude_ai_Gmail) — osobne od OAuth
- **Automatyzacje (skrypty):** OAuth 2.0 z refresh_token → `automatyzacje/lib.js` (gmailGetAccessToken)
- **Status:** AKTYWNE
- **Koszt:** Gmail API jest darmowe. Limity: 250 units/user/sec, 15 000 units/user/dzień.
- **Użycie:**
  - Morning Intelligence Scan (automatyzacje/morning-scan.js) — codziennie 8:00 pn-pt
  - Email Radar (automatyzacje/email-radar.js) — co 30 min 8:00-18:00 pn-pt (read inbox + create drafts)

---

## Notion

- **Do czego:** Notatki, bazy danych, CRM, dokumentacja projektów
- **API:** TAK
- **MCP:** TAK — podłączony jako zarządzane połączenie Claude (claude_ai_Notion)
- **MCP repo (oficjalny):** https://github.com/makenotion/notion-mcp-server
- **Dokumentacja API:** https://developers.notion.com/docs/getting-started
- **Dokumentacja MCP:** https://developers.notion.com/guides/mcp/get-started-with-mcp
- **Endpoint:** `https://api.notion.com`
- **Gdzie znaleźć klucz (jeśli potrzebne do innych integracji):**
  1. Wejdź na https://www.notion.com/my-integrations
  2. Kliknij **"+ New integration"** → nadaj nazwę, wybierz workspace
  3. W zakładce **"Secrets"** skopiuj **Internal Integration Secret** (zaczyna się od `secret_`)
  4. W Notion otwórz stronę → **"..." → "Connections"** → dodaj swoją integrację
- **Klucze:**
  - MCP (sesja Claude): zarządzane połączenie (claude_ai_Notion)
  - Automatyzacje (skrypty): `NOTION_API_KEY` w .env (Internal Integration Secret)
- **Status:** AKTYWNE
- **Koszt:** API darmowe. Rate limit: 3 req/sek. Notion workspace: Free / Plus $12/user/msc.

---

## Cyber Folks (hosting)

- **Do czego:** Hosting stron, domeny, poczta — system10h.com
- **API:** TAK — DirectAdmin API (HTTPS) + Node.js (12-20) / Python / PHP / SSH
- **MCP:** NIE — brak oficjalnego ani community MCP
- **Dokumentacja API:** https://api.cyberfolks.pl/
- **Pomoc API pocztowe:** https://cyberfolks.pl/pomoc/api-w-systemie-pocztowym/
- **DirectAdmin API:** Zarządzanie domenami, e-mailami, bazami danych przez HTTPS
- **Technologie na hostingu:** Node.js (12-20, REST API, webhooks), Python, PHP, SSH
- **Zewnętrzne integracje (dostępne):** Przelewy24, PayPal, Google Analytics, MailerLite (już skonfigurowany)
- **Gdzie znaleźć dane dostępowe:**
  1. Zaloguj się na https://panel.cyberfolks.pl/
  2. DirectAdmin API: dane logowania panelu + klucz API w sekcji **"API"**
  3. SSH: klucze SSH w ustawieniach konta
- **Klucz API:** Dane logowania panelu DirectAdmin (nie w `.env` — używane tylko przez panel)
- **Status:** AKTYWNE (zweryfikowane 26.02.2026)
- **Koszt:** API w ramach hostingu (brak dodatkowych opłat)

---

## LinkedIn

- **Do czego:** Social selling, posty, outreach, networking — główny kanał marketingowy
- **API:** TAK (ograniczony dostęp — wymaga aplikowania o uprawnienia)
- **MCP:** NIE oficjalny. Community serwery istnieją ale mogą naruszać ToS LinkedIn.
- **Dokumentacja API:** https://developer.linkedin.com/
- **Dokumentacja techniczna:** https://learn.microsoft.com/en-us/linkedin/
- **Katalog produktów API:** https://developer.linkedin.com/product-catalog
- **Gdzie znaleźć klucz:**
  1. Wejdź na https://developer.linkedin.com/
  2. Zaloguj się → **"My Apps"** (górny pasek)
  3. **"Create App"** → wypełnij dane
  4. W zakładce **"Auth"** → Client ID + Client Secret
  5. LinkedIn używa OAuth 2.0
  6. Musisz aplikować o dostęp do konkretnych produktów API
- **Klucz API:** `[do konfiguracji jeśli potrzebne]`
- **Status:** AKTYWNE (używane ręcznie, nie przez API)
- **Koszt:** Basic profile / Share = darmowe. Marketing API / Recruiter = enterprise pricing.
- **Uwaga:** Na razie nie potrzebujesz API LinkedIn — posty i outreach robisz ręcznie. Rozważ w przyszłości jeśli zechcesz automatyzować publikację.

---

## Cloudflare Workers

- **Do czego:** Infrastruktura produkcyjna — Live Preview API, Self-Discovery email capture
- **API:** TAK (Workers API + KV Storage)
- **MCP:** NIE
- **Projekt:** `system10h/worker/` → deploy na `system10h.com`
- **Endpointy produkcyjne:**
  - `POST /generate` — Live Preview (streaming, Claude Haiku → skrypty sprzedażowe)
  - `POST /subscribe` — email capture (MailerLite + Resend wyniki)
  - `POST /style-match` — Style Match Test (Claude Haiku non-streaming → przepisany mail + email Resend + MailerLite grupa `style-match-test` + Telegram alert). Dodany 05.03.2026.
- **KV Namespace:** `RATE_LIMIT_KV` — rate limiting (5 req/min, 20/h, 50/dzień)
- **Sekrety (w Cloudflare Dashboard, NIE w .env):**
  - `ANTHROPIC_API_KEY` — do generowania Live Preview + Style Match
  - `MAILERLITE_API_KEY` — do zapisu subskrybentów
  - `RESEND_API_KEY` — do wysyłki emaili z wynikami
  - `TURNSTILE_SECRET_KEY` — do weryfikacji CAPTCHA
  - `TELEGRAM_BOT_TOKEN` — do alertów Style Match (opcjonalny)
- **Gdzie zarządzać:**
  1. Wejdź na https://dash.cloudflare.com/
  2. Workers & Pages → `live-preview-api`
  3. Settings → Variables → Secrets (tam są klucze)
- **Deploy:** `cd system10h/worker && npx wrangler deploy`
- **CORS:** `system10h.com`, `www.system10h.com`
- **Frontend:** `system10h/DEPLOY_EXT/` → Live Preview (`index.html`), Style Match (`style-match/index.html`)
- **Status:** AKTYWNE (produkcja, wrangler 4.71.0)
- **Koszt:** Free: 100k req/dzień. Paid: $5/msc za 10M req. KV: free 100k odczytów/dzień.

---

## Cloudflare Turnstile

- **Do czego:** CAPTCHA (weryfikacja że user to człowiek) na Live Preview
- **API:** TAK — weryfikacja po stronie serwera
- **MCP:** NIE
- **Endpoint:** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
- **Gdzie znaleźć klucze:**
  1. Wejdź na https://dash.cloudflare.com/
  2. Turnstile → wybierz widget
  3. **Site Key** (publiczny, w kodzie frontend) + **Secret Key** (prywatny, w Worker secrets)
- **Klucz:** Secret Key ustawiony przez `wrangler secret put TURNSTILE_SECRET_KEY` (NIE w .env)
- **Status:** AKTYWNE
- **Koszt:** Free: 1M weryfikacji/msc. Enterprise: kontakt.

---

## Calendly

- **Do czego:** Umawianie spotkań demo — 15 min call w lejku sprzedażowym
- **API:** TAK
- **MCP:** NIE
- **Dokumentacja API:** https://developer.calendly.com/
- **Rola w lejku:** SD → Calendly → 15 min call → Close
- **Gdzie znaleźć klucz (jeśli potrzebne do automatyzacji):**
  1. Wejdź na https://calendly.com/
  2. **Integrations** → **API & Webhooks**
  3. Wygeneruj Personal Access Token
- **Klucz API:** Nie potrzebny na razie (używane ręcznie przez link)
- **Status:** AKTYWNE (ręcznie)
- **Koszt:** Free: 1 event type. Standard: $10/msc. Uwaga: Sprawdź czy potrzebujesz webhook do powiadomień o nowym spotkaniu.

---

## Loom

- **Do czego:** Nagrywanie video — szkolenia produktowe, case study, delivery klientom
- **API:** TAK
- **MCP:** NIE
- **Dokumentacja API:** https://developers.loom.com/
- **Użycie w biznesie:**
  - Szkolenie klienta po wdrożeniu (15-20 min)
  - Case study video (Stalton, Zbigniew)
  - Delivery: Loom + handoff materiałów
- **Gdzie znaleźć klucz (jeśli potrzebne):**
  1. Wejdź na https://www.loom.com/
  2. Developer Portal → API Keys
- **Klucz API:** Nie potrzebny na razie (używane ręcznie)
- **Status:** AKTYWNE (ręcznie)
- **Koszt:** Free: 25 video, 5 min limit. Business: $15/user/msc (bez limitów).

---

## Google AI Studio (Gemini)

- **Do czego:** Modele AI Google (Gemini Pro/Flash/Ultra) — deep research, analiza, generowanie obrazów, treści
- **API:** TAK
- **MCP:** TAK — community `@rlabs-inc/gemini-mcp` (podłączony 26.02.2026)
- **MCP pakiet:** `@rlabs-inc/gemini-mcp` v0.8.1 (MIT, 3 zależności: @google/genai, @modelcontextprotocol/sdk, zod)
- **MCP capabilities:** 30+ narzędzi — generowanie obrazów (Nano Banan/Pro), deep research, Google Search grounding, code execution, TTS
- **Dokumentacja API:** https://ai.google.dev/gemini-api/docs
- **Dokumentacja obrazów:** https://ai.google.dev/gemini-api/docs/image-generation
- **Dokumentacja Deep Research:** https://ai.google.dev/gemini-api/docs/deep-research
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/`
- **Panel klucza:** https://aistudio.google.com/apikey
- **Gdzie znaleźć klucz:**
  1. Wejdź na https://aistudio.google.com/apikey
  2. Kliknij **"Create API Key"**
  3. Wybierz projekt Google Cloud → skopiuj klucz (zaczyna się od `AIza`)
- **Klucz API:** w pliku `.env` jako `GOOGLE_AI_STUDIO_API_KEY` [JEST]
- **Uwierzytelnianie:** parametr `?key=` w URL lub nagłówek `x-goog-api-key`
- **Status:** AKTYWNE
- **Modele obrazów:**
  - **Nano Banana 2** (`gemini-3.1-flash-image-preview`) — PRO jakość, Flash cena, ~$0.039/obraz. Aspect ratios: 1:1, 4:5, 16:9, 9:16 itd. Rozdzielczości: 512px, 1K, 2K, 4K. Ref images: do 14.
  - **Nano Banana Pro** (`gemini-3-pro-image-preview`) — jakość studio, 4K, ~$0.08/obraz
  - **Nano Banana 1** (`gemini-2.5-flash-image`) — legacy, szybki
- **Deep Research:** Agent `deep-research-pro-preview-12-2025` — autonomiczny research z Interactions API
- **Koszt:** Free tier: 15 req/min (Flash), 2 req/min (Pro). Obrazy: ~$0.039/obraz (NB2). Deep Research: preview (ograniczone). Grounding: $14-35/1k zapytań. Ustaw limit w Google Cloud Console!
- **Użycie w biznesie:** Deep research (rynek, konkurencja, benchmarki), Nano Banana 2 (grafiki, karuzele LinkedIn, wizualizacje), Radar Szans (WF16)
- **Automatyzacja:** `automatyzacje/carousel-generator.js` — czyta markdown z treścią slajdów → generuje PNG per slajd (Nano Banana 2, 4:5, 2K). Koszt: ~$0.04/slajd. Użycie: `node automatyzacje/carousel-generator.js materialy/PLIK.md [--pro] [--dry-run]`

---

## AIBL Network

- **Do czego:** AI Biznes Lab Network — matchmaking, profil networkingowy
- **API:** Wewnętrzne (skill Claude Code)
- **MCP:** NIE (skill)
- **Klucz:** w pliku `.env` jako `AIBL_NETWORK_TOKEN` [JEST]
- **Status:** AKTYWNE

---

## Telegram Bot (Ultron)

- **Do czego:** Powiadomienia push — alerty pipeline, Speed-to-Lead, automatyzacje, briefingi
- **API:** TAK (Bot API — REST, zero bibliotek)
- **MCP:** NIE
- **Bot:** @MattJarvis_Bot (Ultron)
- **Chat ID:** 1304598782
- **Dokumentacja API:** https://core.telegram.org/bots/api
- **Endpoint:** `https://api.telegram.org/bot{token}/sendMessage`
- **Gdzie znaleźć token:**
  1. Otwórz Telegram → szukaj @BotFather
  2. Wyślij `/mybots` → wybierz bota → API Token
- **Klucz API:** w pliku `.env` jako `TELEGRAM_BOT_TOKEN` [JEST]
- **Status:** AKTYWNE (zweryfikowane 26.02.2026 — test wysyłki OK)
- **Koszt:** Darmowe. Limit: 30 wiadomości/sek (per bot), bez limitu dziennego.
- **Użycie w biznesie:**
  - Speed-to-Lead alert (MailerLite webhook → Telegram push)
  - Poranny Pipeline Brief (cron 9:30 → Notion CRM → Telegram)
  - Deal Flow alert (Calendly booking → Telegram)
  - Automatyzacje od agentów (@pipeline, @cso, @content)

---

## GDZIE BEZPIECZNIE DODAWAĆ KLUCZE

### Plik `.env` (ZALECANY)

Lokalizacja: `/Users/mateuszsokolski/asystent/.env`

```
# Klucze API — NIE POKAZUJ NIKOMU
RESEND_API_KEY=re_xxxxx               # [JEST] ✅
AIBL_NETWORK_TOKEN=xxxxx              # [JEST] ✅
MAILERLITE_API_KEY=ml_xxxxx           # [JEST] ✅
ANTHROPIC_API_KEY=sk-ant-xxxxx        # [JEST] ✅
GOOGLE_AI_STUDIO_API_KEY=AIza_xxxxx   # [JEST] ✅
TELEGRAM_BOT_TOKEN=xxxxx              # [JEST] ✅
```

### Jak dodać nowy klucz:
1. Otwórz plik `.env` w edytorze tekstu (np. VSCode, nano)
2. Dodaj nową linię: `NAZWA_KLUCZA=wartość`
3. Zapisz plik
4. NIE wklejaj kluczy w rozmowę z AI

### Bezpieczeństwo:
- `.env` MUSI być w `.gitignore`
- NIE synchronizuj `.env` przez Dropbox/Google Drive
- Klucze z datą ważności — sprawdzaj co 90 dni
- Jeśli podejrzewasz wyciek — odwołaj klucz i wygeneruj nowy

---

## Google Sheets — Prowizje Artnapi (WebFetch, CSV)

- **Do czego:** Arkusz prowizji per miesiąc (tryb ARTNAPI). Ściągaj przez WebFetch jako CSV.
- **API:** NIE (publiczny URL)
- **MCP:** NIE — WebFetch bezpośredni
- **Kontekst:** Tylko tryb ARTNAPI
- **Base URL:** `https://docs.google.com/spreadsheets/d/e/2PACX-1vR-SUkz1MISFvx0tQGwO02bZenANU-90GYQT1OqxQDia4blrhg0_R7egEm4sqhMdi47HhcuipNo0z3i/pub?output=csv`
- **Zakładki (dodaj &gid=X do URL):**
  - `gid=0` → 10/25 | `gid=1421765063` → 11/25 | `gid=1654399783` → 12/25
  - `gid=1964597183` → 1/26 | `gid=2096709391` → 2/26 | `gid=32746766` → 3/26
- **UWAGA:** URL robi redirect 307 — trzeba zrobić drugi WebFetch na redirect URL
- **Status:** AKTYWNE
- **Koszt:** Free (publiczny arkusz)

---

## DO ZROBIENIA

- [x] Dodać RESEND_API_KEY do .env → podłączyć MCP Resend ✅ 26.02
- [x] Dodać ANTHROPIC_API_KEY do .env ✅ 26.02 (Live Preview)
- [x] Zweryfikować dostępność API w panelu Cyber Folks ✅ 26.02 (DirectAdmin API, Node.js, Python, PHP, SSH)
- [x] Sprawdzić czy .env jest w .gitignore ✅ 26.02 (.gitignore stworzony)
- [x] Dodać Cloudflare Workers/Turnstile do inwentarza ✅ 26.02
- [x] Dodać Calendly/Loom do inwentarza ✅ 26.02
- [ ] Zapisać klucze API w menedżerze haseł (Keychain / 1Password / Bitwarden) — BACKUP
- [ ] Przetestować Resend MCP po restarcie sesji (wysłać testowy email)

---

*Ostatnia aktualizacja: 05.03.2026 (+Style Match endpoint, Telegram secret, wrangler 4.71.0, security audit A)*
*Źródło: @cto sesja — konsolidacja systemów, merge z ARTNAPI_OS api-inventory*
