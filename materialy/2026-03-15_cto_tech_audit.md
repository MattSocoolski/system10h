# CTO TECH AUDIT + MAPA INTEGRACJI
> Data: 15.03.2026
> Tryb: CEO (oba biznesy: ARTNAPI + SYSTEM 10H)
> Kontekst: Solo founder, 6-7h/dzien, ENTP-A, dlug 17.5k PLN

---

## [1] TECH AUDIT

---

### NARZEDZIA — KATEGORYZACJA

#### AKTYWNE I POLACZONE (MCP/API — dane przeplywaja)

| # | Narzedzie | Biznes | Polaczenie | Co robi | Koszt/msc |
|---|-----------|--------|------------|---------|-----------|
| 1 | **Claude API** (Anthropic) | OBA | API (.env) | Live Preview, SD, automatyzacje (Haiku ~$0.001/mail) | Pay-as-you-go (~$5-15) |
| 2 | **Gmail MCP** (managed) | OBA | MCP (Anthropic) | Sesje Claude — czytanie, drafty, search (artnapi.pl + system10h.com) | $0 (API darmowe) |
| 3 | **Gmail OAuth** (lib.js) | ARTNAPI | OAuth (.env) | 7 skryptow automatyzacji (morning-scan, email-radar, followup-guardian, inquiry-router, restock-reminder, generate-weekly-report, stock-monitor) | $0 |
| 4 | **Notion MCP** (managed) | OBA | MCP (Anthropic) | CRM ArtNapi, bazy danych, dokumentacja | $0 (free tier) |
| 5 | **Notion API** (.env) | ARTNAPI | API (.env) | Skrypty automatyzacji (CRM read/write) | $0 |
| 6 | **MailerLite MCP** | 10H | MCP (managed) | Email marketing system10h.com (4 sub, 2 grupy, 3 automatyzacje) | $0 (free <1k sub) |
| 7 | **Resend MCP** | 10H | MCP (managed) | Maile transakcyjne (Live Preview wyniki, SD wyniki) | $0 (free 3k/msc) |
| 8 | **Gemini MCP** (community) | OBA | MCP (.env) | Deep Research, generowanie obrazow NB2, TTS, 30+ narzedzi | $0 (free tier) |
| 9 | **Telegram Bot** (Ultron) | OBA | API (.env) | Alerty pipeline, Speed-to-Lead, cron notifications | $0 |
| 10 | **Cloudflare Workers** | 10H | API (CF Dashboard) | Live Preview API, SD email capture, Style Match Test | $0 (free 100k req/dzien) |
| 11 | **Cloudflare Turnstile** | 10H | API (CF Dashboard) | CAPTCHA na Live Preview | $0 (free 1M/msc) |

**PODSUMOWANIE:** 11 narzedzi aktywnych i polaczonych. 7 z MCP (sesje Claude), 4 z API (skrypty). Zero kosztow stalych (wszystko na free tier).

---

#### AKTYWNE ALE NIEPOLACZONE (okazje!)

| # | Narzedzie | Biznes | Ma API? | Co robi teraz (recznie) | Okazja |
|---|-----------|--------|---------|-------------------------|--------|
| 1 | **LinkedIn** | OBA | TAK (ograniczone) | Reczna publikacja 2-3 posty/tyg, reczne DM, reczne komentarze | Planowanie postow, auto-publikacja, monitoring engagement |
| 2 | **Calendly** | 10H | TAK | Reczne wklejanie linkow, brak alertu o nowym demo | Webhook → Telegram alert "NOWE DEMO UMOWIONE!" |
| 3 | **Loom** | 10H | TAK | Reczne nagrywanie, reczne linkowanie w mailach | Niska priorytet — API malo przydatne dla solo |
| 4 | **Cyber Folks** | 10H | TAK (DirectAdmin) | Hosting system10h.com, zero automatyzacji | Deployment pipeline (ale Cloudflare Workers pokrywa) |
| 5 | **Google Sheets** (prowizje) | ARTNAPI | NIE (publiczny CSV) | WebFetch reczny, brak auto-sync | Auto-fetch CSV → porownanie z CRM |
| 6 | **Google Calendar MCP** | OBA | TAK (managed) | Podlaczony ale nieuzywany aktywnie w automatyzacjach | Planowanie blokow pracy, alert "demo za 1h" |
| 7 | **MailerLite** (ARTNAPI) | ARTNAPI | TAK | Klucz w .env (MAILERLITE_ARTNAPI_API_KEY) ale NIEUZYWANY. Konto @artnapi.pl. | Restock remindery, seasonal campaigns, nurturing AM klientow. Decyzja 09.03: odlozone na kwiecien (>50 AM klientow). |

---

#### BRAKUJE (a mogloby pomoc)

| # | Kategoria | Problem | Propozycja | Koszt | Priorytet |
|---|-----------|---------|------------|-------|-----------|
| 1 | **Fakturowanie** | Brak systemu faktur. Wszystko recznie lub przez Piotra. | iFirma / Fakturownia / wFirma API | 15-50 PLN/msc | SREDNI |
| 2 | **Sledzenie kosztow subskrypcji** | Brak inwentarza kosztow stalych. Rozrzucone po glowie. | Arkusz lub Notion baza "Koszty stale" | $0 | NISKI |
| 3 | **LinkedIn auto-publish** | 3 posty/tyg recznie = bottleneck. 0 postow w marcu! | Buffer / Publer / Taplio (scheduling) | $0-10/msc | WYSOKI |
| 4 | **CRM System 10H** | Pipeline 10H w plan.md (plik tekstowy). Brak Notion CRM. | Notion CRM analogiczny do ArtNapi | $0 | SREDNI |
| 5 | **Analityka strony** | Brak danych: ile ludzi wchodzi na system10h.com, ile klika LP/SD | Cloudflare Analytics (juz masz!) lub Plausible | $0 | WYSOKI |
| 6 | **Backup kluczy** | Klucze API tylko w .env. Brak kopii w menedzerze hasel. | Keychain macOS / Bitwarden (free) | $0 | SREDNI |

---

#### DUPLIKATY / NIEUZYWANE

| # | Narzedzie | Problem | Rekomendacja |
|---|-----------|---------|--------------|
| 1 | **Gmail MCP + Gmail OAuth** | 2 rownolegle polaczenia z Gmailem (managed MCP + OAuth lib.js) | OK — to nie duplikat. MCP = sesje interaktywne, OAuth = cron skrypty. Dobre rozdzielenie. |
| 2 | **MailerLite x2** | 2 konta: system10h.com (aktywne, MCP) + artnapi.pl (klucz w .env, NIEUZYWANE) | ArtNapi konto: aktywowac w kwietniu (>50 AM) lub usunac klucz z .env. |
| 3 | **AIBL Network Token** | Token w .env, uzycie: skill Claude Code. Czy aktywnie uzywany? | Zweryfikowac czy skill jest aktywny. Jesli nie — usunac token. |
| 4 | **speed-to-lead.js** | Skrypt istnieje + LaunchAgent, ale w plan.md ARTNAPI nie wymieniony w aktywnych automatyzacjach. | Zweryfikowac czy cron aktywny. Jesli tak — dodac do listy "SAMOGRAJ". |
| 5 | **pipeline-brief.js** | Skrypt + LaunchAgent, ale tez nie w glownej liscie automatyzacji plan.md. | Jak wyzej — zweryfikowac i ujednolicic. |

---

### SCAN BIZNESU — 5 OBSZAROW (ocena X/5)

---

#### SPRZEDAZ: 4.0 / 5

**ARTNAPI:**
- CRM: Notion CRM AKTYWNY, 50+ leadow, tagi klienta, cykl_dni, auto-sync czesciowy. Pola: status, segment, due, ostatni kontakt, notatki, tag_klienta, cykl_dni.
- Lejek: Dwuetapowy (PKE compliance). Research → Outreach → Probka → Zamowienie → Retencja D14 → Auto-Restock.
- Follow-up: ZAUTOMATYZOWANY (followup-guardian.js 17:00 + restock-reminder.js pon 9:00). EN dla zagranicznyc.
- Oferty: Kalkulator B2B online (artnapi.pl). Cenniki w Google Sheets.
- Alerty: Email-radar.js (co 30 min) + Telegram bot. Speed-to-Lead + Pipeline Brief.

**SYSTEM 10H:**
- CRM: BRAK (pipeline w plan.md tekstowo). To slaby punkt.
- Lejek: SD quiz → 7 emaili (MailerLite) → Demo → Close. Benchmark SD opt-in 30%+.
- Follow-up: RECZNY. Brak automatyzacji.
- Oferty: Prezentacja 8-slajdowa (HTML→PDF). Cennik na stronie.

**CO USPRAWNIĆ:** (1) Notion CRM dla System 10H (klon ArtNapi). (2) Calendly webhook → Telegram "nowe demo!". (3) Auto follow-up sekwencja po SD bez demo.

---

#### MARKETING I CONTENT: 2.5 / 5

**ARTNAPI:**
- Newsletter: NIEUZYWANY (konto MailerLite @artnapi.pl istnieje, klucz w .env, zero subskrybentow).
- Social media: BRAK (B2B import nie wymaga social — cold email + telefon).
- Content: Katalog B2B PDF/HTML gotowy. Szablony cold intro EN. Brak bloga.
- Deep Research: TAK — Gemini MCP aktywnie (6 DR w jednej sesji 15.03).

**SYSTEM 10H:**
- Newsletter: MailerLite AKTYWNY (4 sub, 2 grupy, 3 automatyzacje — SD wyniki).
- Social media: LinkedIn = GLOWNY KANAL. Ale 0 postow w marcu! 12 gotowych w kolejce. Reczna publikacja = bottleneck.
- Content: 12 postow LI gotowych, Style Match Test zaplanowany. Carousel generator (Gemini NB2).
- Live Preview: DZIALA (Cloudflare Worker + Claude Haiku streaming).
- Reklamy: BRAK (decyzja: organicznie do min. 2 zamkniec).

**CO USPRAWNIĆ:** (1) LinkedIn scheduling (Buffer/Publer) — od JUTRO! 0 postow w marcu to pozar. (2) MailerLite ArtNapi aktywowac na seasonal campaigns. (3) Analityka system10h.com (Cloudflare Analytics — darmowe, juz masz).

---

#### OPERATIONS: 4.0 / 5

**OBA BIZNESY:**
- Plan dnia: Morning-feed.md (auto-generowany 8:00 pn-pt). Telegram pipeline brief (8:15).
- Zarzadzanie zadaniami: plan.md + CLAUDE.md + asystenci (@coo, @cso). Brak dedykowanego task managera (ale Claude Code to zrekompensalizuje).
- Kalendarz: Google Calendar MCP polaczony, ale NIEUZYWANY aktywnie w automatyzacjach.
- Raportowanie: generate-weekly-report.js (manual/cron) + weekly-report-reminder.js (czw 8:30 Telegram).
- Automatyzacje: 9 skryptow Node.js + 9 LaunchAgents. Pokrycie: morning scan, email radar, followup guardian, inquiry router, restock reminder, pipeline brief, speed-to-lead, stock monitor, weekly report reminder.
- Backup: Folder backup/ z kopiami plikow kontekstowych. Brak automatycznego backupu .env.

**CO USPRAWNIĆ:** (1) Auto-backup .env raz/tydzien (1-liner cron). (2) Google Calendar → alert "demo za 1h" (MCP juz polaczony). (3) Unified Action Log (planowane kwiecien — inspiracja z AWS Inbox Router).

---

#### FINANSE: 1.5 / 5

**ARTNAPI:**
- Fakturowanie: Przez Piotra (ArtNapi wystawia). Mateusz nie fakturuje sam klientom ArtNapi.
- Prowizje: Google Sheets (publiczny CSV). Reczny WebFetch. Brak auto-porownania z CRM.
- Koszty: BRAK inwentarza. Rozrzucone (hosting Cyber Folks, Claude API, domeny).

**SYSTEM 10H:**
- Fakturowanie: JDG Mateusz Sokólski AM. Reczne (ile faktur: 1 do dzis — Stalton 1 220 PLN).
- Sledzenie platnosci: W glowie.
- Koszty subskrypcji: BRAK zinwentaryzowane. Ile placi za Claude API? Ile za hosting? Ile za domeny?

**CO USPRAWNIĆ:** (1) Arkusz "Koszty stale" w Notion lub Google Sheets (~30 min setup). (2) Przy skali >5 faktur/msc: wFirma lub iFirma (15-50 PLN/msc). (3) Auto-fetch prowizji CSV z Google Sheets (1h skrypt).

---

#### OBSLUGA KLIENTA: 2.0 / 5

**ARTNAPI:**
- Onboarding: Probka → cennik → zamowienie. Proces reczny ale powtarzalny. Brak automatycznego "welcome pack".
- FAQ: BRAK. Pytania o cennik, MOQ, dostepnosc — odpowiadane recznie w kazdym mailu.
- Feedback: Retencja D14 (reczna). Brak automatycznego zbierania.

**SYSTEM 10H:**
- Onboarding: SD → Architekt → konfiguracja → szkolenie Loom. 3h pracy. Dobrze udokumentowane.
- FAQ: BRAK na stronie (jest w ghost_styl.md wewnetrznie).
- Feedback: 12-pytaniowy protokol (3 bloki). Stalton Blok 1 done. Ale reczne — brak automatyzacji.
- Case study: 1 w toku (Stalton — 70% done, czeka Blok 2+3).

**CO USPRAWNIĆ:** (1) FAQ sekcja na system10h.com (juz masz tresc w ghost_styl.md — przeladuj na strone). (2) Auto-trigger feedback D+14 po instalacji Blizniaka (analogia: restock-reminder.js). (3) Welcome pack email po 1. zamowieniu ArtNapi (MailerLite @artnapi.pl).

---

### PODSUMOWANIE SCAN BIZNESU

| Obszar | Ocena | Trend |
|--------|-------|-------|
| **Sprzedaz** | **4.0 / 5** | ARTNAPI swietnie zautomatyzowane. 10H: brak CRM. |
| **Marketing i Content** | **2.5 / 5** | LinkedIn bottleneck (0 postow marzec!). Brak analityki. |
| **Operations** | **4.0 / 5** | 9 skryptow + LaunchAgents. Morning feed. Solidne. |
| **Finanse** | **1.5 / 5** | Brak inwentarza kosztow. Brak systemu faktur. |
| **Obsluga klienta** | **2.0 / 5** | Brak FAQ, brak auto-feedback, brak welcome pack. |
| **SREDNIA** | **2.8 / 5** | |

---

### TOP 3 OKAZJE (najwyzszy ROI czasu)

#### OKAZJA #1: LinkedIn Auto-Scheduling
- **Problem:** 0 postow w marcu! 12 gotowych postow lezy w folderze. Reczna publikacja = zapominanie. Przy ENTP-A to zabojcze — nie jest nudna robota dla Ciebie.
- **Rozwiazanie:** Buffer (free plan: 3 kanaly, 10 zaplanowanych postow) lub Publer (free: 5 social, 10 postow).
- **Czas setup:** 15 min (rejestracja + polaczenie LinkedIn + zaplanowanie 12 postow).
- **ROI:** Przywrocenie pipeline'u leadow 10H. Kazdy post z CTA do SD = potencjalny lead 2 999 PLN. **Oszczednosc: ~2h/tyg** (nie musisz pamietac o publikacji).
- **Priorytet: NATYCHMIAST (poniedzialek 16.03)**

#### OKAZJA #2: Calendly Webhook → Telegram Alert
- **Problem:** Ktos bookuje demo na Calendly — dowiadujesz sie gdy otworzysz mail. Brak Speed-to-Lead.
- **Rozwiazanie:** Calendly webhook → prosty skrypt Node.js → Telegram push "NOWE DEMO: [imie] [firma] [kiedy]". Analogia: masz juz speed-to-lead.js — to rozszerzenie.
- **Czas setup:** 1-2h (Calendly webhook + skrypt + LaunchAgent).
- **ROI:** Demo response time <5 min vs aktualne "kiedy zobacze maila". Przy 2 999 PLN/deal — jeden szybciej zamkniety deal = ROI. **Oszczednosc: reakcja w minutach zamiast godzin.**
- **Priorytet: WYSOKI (W3)**

#### OKAZJA #3: Cloudflare Analytics (darmowe!) dla system10h.com
- **Problem:** Zero danych o ruchu na stronie. Nie wiesz: ile osob wchodzi, ile klika Live Preview, ile wypelnia SD, skad przychod.
- **Rozwiazanie:** Cloudflare Analytics — juz masz konto! Zero kodu. Wlacz w panelu Cloudflare → widzisz dane natychmiast. Opcjonalnie: Cloudflare Web Analytics snippet (bardziej granularne).
- **Czas setup:** 5 min (klik w panelu Cloudflare).
- **ROI:** Wiesz CO dziala na stronie. Posty LI generuja ruch? Live Preview konwertuje? SD ma drop-off? **Bez danych podejmujesz decyzje na slepo.**
- **Priorytet: NATYCHMIAST (5 min roboty)**

---

## [2] MAPA INTEGRACJI

---

### DIAGRAM POLACZEN (ASCII)

```
                            ┌─────────────────────────┐
                            │     CLAUDE CODE (Mac)    │
                            │   Opus + 9 asystentow    │
                            │   CLAUDE.md orchestrator  │
                            └───────────┬─────────────┘
                                        │
            ┌───────────────────────────┬┼┬───────────────────────────┐
            │              ┌────────────┘│└────────────┐              │
            │              │             │             │              │
    ┌───────▼───────┐ ┌────▼────┐ ┌──────▼──────┐ ┌───▼──────┐ ┌────▼──────┐
    │  Gmail MCP    │ │ Notion  │ │ MailerLite  │ │ Resend   │ │ Gemini    │
    │  ✅ managed   │ │ MCP ✅  │ │ MCP ✅ (10H)│ │ MCP ✅   │ │ MCP ✅    │
    │ artnapi.pl    │ │ CRM     │ │ 4 sub, auto │ │ transakcj│ │ DR, img,  │
    │ system10h.com │ │ ArtNapi │ │ SD+LP emails│ │ SD/LP    │ │ TTS, 30+  │
    └───────┬───────┘ └────┬────┘ └─────────────┘ └──────────┘ └───────────┘
            │              │
    ┌───────▼───────┐ ┌────▼────────────────┐
    │  Gmail OAuth  │ │  Notion API (.env)  │
    │  ✅ lib.js    │ │  ✅ skrypty         │
    └───────┬───────┘ └────┬────────────────┘
            │              │
            └──────┬───────┘
                   │
    ┌──────────────▼──────────────────────────────────┐
    │          9 SKRYPTOW NODE.JS (LaunchAgents)       │
    │                                                  │
    │  morning-scan.js    (8:00 pn-pt)    Gmail+CRM   │
    │  email-radar.js     (co 30 min)     Gmail+CRM   │
    │  followup-guardian  (17:00 pn-pt)   CRM+Gmail   │
    │  inquiry-router.js  (event-driven)  Gmail       │
    │  restock-reminder   (pon 9:00)      CRM+Gmail   │
    │  pipeline-brief.js  (8:15 pn-pt)    CRM         │
    │  speed-to-lead.js   (co 4h)         CRM         │
    │  stock-monitor.js   (pon 9:05)      stock.json  │
    │  weekly-report-rem. (czw 8:30)      --          │
    └──────────────┬──────────────────────────────────┘
                   │
          ┌────────▼────────┐
          │   Telegram Bot  │
          │   ✅ (Ultron)   │
          │   Push alerts   │
          │   na telefon    │
          └─────────────────┘


    ═══ PRODUKCJA (system10h.com) ═══

    ┌──────────────────────────────────┐
    │   Cloudflare Workers ✅          │
    │                                  │
    │  /generate  → Live Preview       │──── Claude API (Haiku)
    │  /subscribe → Email Capture      │──── MailerLite API + Resend API
    │  /style-match → Style Match Test │──── Claude API + Resend + MailerLite + Telegram
    │                                  │
    │  + Turnstile CAPTCHA ✅          │
    └──────────────────────────────────┘
           ↑
    ┌──────┴────────────────────┐
    │   system10h.com (hosting) │
    │   ⚡ Cyber Folks          │
    │   (DirectAdmin, Node.js)  │
    └───────────────────────────┘


    ═══ NIEPOLACZONE (reczna praca) ═══

    ┌─────────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐
    │  LinkedIn   │  │ Calendly │  │   Loom    │  │ Google Cal   │  │ Google Sheets│
    │  ⚡ reczne  │  │ ⚡ reczne│  │ ⚡ reczne │  │ ⚡ MCP jest  │  │ ⚡ CSV reczny│
    │  posty, DM  │  │ linki    │  │ nagrywanie│  │ ale nieuzyw. │  │ prowizje     │
    └─────────────┘  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘
```

**LEGENDA:**
- ✅ = polaczone, dane przeplywaja automatycznie
- ⚡ = ma API/MCP ale NIEPOLACZONE (okazja!)
- ❌ = brak API (reczna praca, nie da sie latwiej)

---

### BRAKUJACE POLACZENIA

| # | A → B | Status | Wartosc |
|---|-------|--------|---------|
| 1 | **Calendly → Telegram** | ⚡ Webhook dostepny, brak skryptu | WYSOKA — Speed-to-Lead dla demo 10H |
| 2 | **LinkedIn → Buffer/Publer** | ⚡ API zewnetrzne, zero integracji | KRYTYCZNA — 0 postow w marcu |
| 3 | **Google Calendar → Claude/Telegram** | ⚡ MCP juz polaczony, nieuzywany | SREDNIA — alert "demo za 1h", blokowanie Golden Hours |
| 4 | **Google Sheets (prowizje) → Notion CRM** | ⚡ CSV publiczny, brak auto-fetch | NISKA — reczny WebFetch wystarczy przy 15-20 zam/msc |
| 5 | **Cloudflare Analytics → system10h.com** | ⚡ Juz masz konto, trzeba wlaczyc | WYSOKA — zero danych o ruchu na stronie |
| 6 | **MailerLite (ArtNapi) → CRM** | ⚡ Klucz w .env, konto istnieje | SREDNIA — aktywowac w kwietniu na seasonal campaigns |
| 7 | **Notion CRM System 10H** | ❌ Nie istnieje | SREDNIA — pipeline w pliku tekstowym = brak automatyzacji FU |

---

### RECZNA PRACA (do zautomatyzowania)

| # | Co robisz recznie | Ile czasu traci | Propozycja automatyzacji | Priorytet |
|---|-------------------|-----------------|--------------------------|-----------|
| 1 | **Publikacja postow LinkedIn** | ~2h/tyg + zapominasz (0 postow marzec!) | Buffer/Publer free → zaplanuj 12 postow na 4 tyg | KRYTYCZNY |
| 2 | **Sprawdzanie czy ktos zarezerwowa demo** | ~15 min/dzien (otwieranie Calendly/maila) | Calendly webhook → Telegram push natychmiast | WYSOKI |
| 3 | **Sprawdzanie ruchu na stronie** | Nie robisz tego wcale (zero danych) | Cloudflare Analytics → wlacz w panelu (5 min) | WYSOKI |
| 4 | **Tracking kosztow subskrypcji** | ~0 min (bo nie robisz — w glowie) | Arkusz "Koszty stale" 1-pager (~30 min) | NISKI |
| 5 | **Follow-up leady System 10H** | ~30 min/dzien (reczne DM, reczne sprawdzanie plan.md) | Notion CRM 10H + followup skrypt (klon ArtNapi) | SREDNI |
| 6 | **Fetch prowizji z Google Sheets** | ~5 min/tydzien (reczny WebFetch) | Auto-fetch CSV cron (1h skrypt) | NISKI |
| 7 | **Case study follow-up (Stalton)** | Reczne planowanie Blok 2+3 dat | Auto-trigger D+42 po INSTALLED (analogia restock-reminder) | NISKI |

---

### PROPONOWANE POLACZENIA (priorytet)

| # | Polaczenie | Metoda | Czas | ROI |
|---|------------|--------|------|-----|
| **1** | **LinkedIn scheduling (Buffer/Publer)** | Rejestracja + polaczenie konta + upload 12 postow | **15 min** | **KRYTYCZNY** — 0 postow = 0 leadow 10H. Przywrocenie pipeline. 12 postow na 4 tyg = ciaglosc. |
| **2** | **Cloudflare Analytics ON** | Panel CF → Analytics → wlacz | **5 min** | **WYSOKI** — Dane o ruchu, konwersji LP/SD, zrodla. Bez tego: decyzje na slepo. |
| **3** | **Calendly → Telegram alert** | Calendly webhook + `calendly-alert.js` (20 linii) + Telegram sendMessage | **1-2h** | **WYSOKI** — Speed-to-Lead dla demo 10H. 1 szybciej zamkniety deal = 2 999 PLN. |
| **4** | **Notion CRM System 10H** | Klon bazy ArtNapi (inne pola: SD status, demo date, value) | **1h** | **SREDNI** — Umozliwi auto FU dla leadow 10H. Przy 7 aktywnych leadach = zysk. |
| **5** | **Google Calendar → poranny alert** | MCP juz polaczony → Claude czyta kalendarz w morning-scan.js → dodaje do morning-feed.md sekcja "DZIS W KALENDARZU" | **30 min** | **SREDNI** — Nie przegapisz demo/spotkania. |
| **6** | **MailerLite ArtNapi aktywacja** | Konto istnieje, klucz jest, MCP/API gotowe. Import AM klientow + 1 automatyzacja "restock co X dni" | **2h** | **SREDNI** — Odlozone na kwiecien (>50 AM). Ale setup teraz = gotowe na czas. |
| **7** | **Auto-backup .env** | Cron 1-liner: `cp .env backup/.env_$(date +%Y-%m-%d)` + LaunchAgent | **10 min** | **NISKI ale wazny** — klucze API to jedyne co chroni dostep do 11 narzedzi. |

---

### KOSZTY INFRASTRUKTURY (szacunek)

| Pozycja | Koszt/msc | Uwagi |
|---------|-----------|-------|
| Claude API (prepaid) | ~$5-15 | Automatyzacje Haiku. Sesje Claude Code = osobny abonament. |
| Claude Code (abonament) | $100-200 | Opus + MCP + sesje |
| Hosting Cyber Folks | ~30-50 PLN | system10h.com |
| Domena system10h.com | ~50-100 PLN/rok | |
| Domena artnapi.pl | (Piotr placi) | |
| Buffer/Publer (jesli wdrozysz) | $0-10 | Free tier wystarczy |
| Wszystko inne | **$0** | Gmail, Notion, MailerLite, Resend, Gemini, Telegram, Cloudflare — free tier |
| **TOTAL szacowany** | **~$130-240/msc** | Ekstremalnie lean stack. |

---

### BEZPIECZENSTWO — SZYBKI SKAN

| # | Kwestia | Status | Pilnosc |
|---|---------|--------|---------|
| 1 | **.env w .gitignore** | ✅ TAK | OK |
| 2 | **klucz.prv na Desktop** | ⚠️ Do przeniesienia do ~/.ssh/ | PILNE (decyzja 15.03) |
| 3 | **Backup kluczy API** | ❌ BRAK — tylko .env, zero kopii | SREDNI |
| 4 | **Limity wydatkow API** | ⚠️ Sprawdzic: Claude console, Google Cloud | SREDNI |
| 5 | **11 kluczy w jednym .env** | ⚠️ Jeden plik wycieknie = pelny dostep | Dodaj do Keychain macOS jako backup |
| 6 | **OAuth refresh token (Gmail)** | ✅ Auto-refresh w lib.js (fix 15.03 — retry 3x10s) | OK |
| 7 | **Cloudflare sekrety** | ✅ W CF Dashboard, nie w .env | OK |

---

### ARCHITEKTURA AUTOMATYZACJI — PODSUMOWANIE

```
CRON (LaunchAgents macOS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
08:00  morning-scan.js        Gmail+CRM → morning-feed.md
08:15  pipeline-brief.js      CRM → Telegram
08:30  (czw) weekly-report-rem Telegram reminder
09:00  (pon) restock-reminder  CRM → Gmail draft + Telegram
09:05  (pon) stock-monitor     stock.json → Telegram alert
co 30m email-radar.js         Gmail → CRM match → Telegram
co 4h  speed-to-lead.js       CRM → Telegram nowe leady
17:00  followup-guardian.js    CRM overdue → Gmail draft + Telegram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVENT-DRIVEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
inquiry-router.js             Kalkulator B2B zapytanie → auto-draft
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANUAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
generate-weekly-report.js     Raport MD+TSV
carousel-generator.js         Markdown → PNG karuzela (Gemini NB2)
create-gmail-draft.js         Pomocniczy — tworzenie draftow
notion-archive.js             Archiwizacja stron Notion
setup-cykl-dni.js             Jednorazowy setup pol CRM
style-match.js                Style Match Test (testowy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL: 15 skryptow | 9 LaunchAgents | 0 kosztow infrastruktury (macOS local)
```

---

### ROADMAP CTO — NASTEPNE KROKI (pragmatycznie)

| Priorytet | Co | Kiedy | Czas | Kto |
|-----------|-----|----|------|-----|
| **P0 (dzis/jutro)** | Cloudflare Analytics ON | 15-16.03 | 5 min | user |
| **P0 (dzis/jutro)** | Buffer/Publer — zaplanuj 12 postow LI | 16.03 | 15 min | user |
| **P0 (dzis/jutro)** | Przenies klucz.prv do ~/.ssh/ | 16.03 | 2 min | user |
| **P1 (W3)** | Calendly webhook → Telegram alert | 17-18.03 | 1-2h | @cto |
| **P1 (W3)** | Auto-backup .env (cron + LaunchAgent) | 17.03 | 10 min | @cto |
| **P2 (W4)** | Notion CRM System 10H (klon ArtNapi) | 20-21.03 | 1h | @cto |
| **P2 (W4)** | Google Calendar w morning-feed.md | 20.03 | 30 min | @cto |
| **P3 (kwiecien)** | MailerLite ArtNapi aktywacja (>50 AM) | IV.2026 | 2h | @cto |
| **P3 (kwiecien)** | Unified Action Log + Smart Routing | IV.2026 | 4-6h | @cto |
| **P4 (maj)** | VPS failover ($5/msc) | V.2026 | 2-3h | @cto |
| **P4 (maj)** | FAQ sekcja na system10h.com | V.2026 | 1h | @cto+@ghost |

---

### OCENA OGOLNA

**Silne strony systemu:**
1. **Zero kosztow infrastruktury** — caly stack na free tier. Przy dlugu 17.5k to kluczowe.
2. **Automatyzacje ArtNapi** — 9 skryptow pokrywa 80% codziennej pracy sprzedazowej. Morning feed + email radar + followup guardian + restock reminder = quasi-autopilot.
3. **MCP ekosystem** — 7 narzedzi polaczonych przez MCP. Claude Code jako hub. Brak vendor lock-in.
4. **Pragmatyczna architektura** — Node.js + LaunchAgents + Telegram. Proste klocki. Zero chmury. Zero kosztow serwera.

**Slabe strony:**
1. **LinkedIn bottleneck** — 0 postow w marcu = zero top-of-funnel 10H. KRYTYCZNE.
2. **Brak analityki** — zero danych o ruchu system10h.com. Podejmujesz decyzje na slepo.
3. **System 10H: brak automatyzacji** — caly pipeline reczny. ARTNAPI ma followup-guardian, restock-reminder. 10H ma... nic.
4. **Finanse niewidoczne** — brak inwentarza kosztow = nie wiesz ile wydajesz. Przy dlugu 17.5k = ryzykowne.

**Werner Vogels powiedzialby:**
> "You built a remarkably lean system. 15 scripts, zero cloud costs, 11 tools connected. But you're flying blind on two things: analytics and LinkedIn pipeline. Fix those two — it's 20 minutes of work — and you'll see immediate ROI. Everything else is optimization."

---

*Wygenerowano: 15.03.2026 | @cto | Tech Audit + Mapa Integracji | Oba biznesy*

---

## [3] LACZ KROPKI — PLAN REALIZACJI

---

### OKAZJA #1: Cloudflare Analytics (5 min, NATYCHMIAST)

**Problem:** Zero danych o ruchu na system10h.com. Nie wiesz ile osob wchodzi, ile klika Live Preview, ile wypelnia SD.

**KROK PO KROKU:**

1. Wejdz na https://dash.cloudflare.com/
2. Wybierz domene **system10h.com**
3. W menu bocznym kliknij **Analytics & Logs** → **Traffic**
4. Dane sa JUZ ZBIERANE (Cloudflare robi to automatycznie jako proxy) — zobaczysz ruch z ostatnich 24h+
5. OPCJONALNIE (bardziej granularne): **Analytics & Logs** → **Web Analytics** → kliknij **"Setup"** → skopiuj snippet JS → wklej przed `</body>` w `system10h/DEPLOY_EXT/index.html` i `style-match/index.html` → `npx wrangler deploy`

**CO ZOBACZYSZ (metryki):**
- **Requests** — ile requestow do strony (ogolny ruch)
- **Unique Visitors** — ile unikalnych osob odwiedza strone
- **Page Views** — ktore podstrony sa popularne
- **Bandwidth** — ile danych przesylanych
- **Country** — skad przychodzi ruch (PL, DE, UK?)
- **Threats** — czy ktos probuje atakowac strone
- **Web Analytics (jesli dodasz snippet):** bounce rate, czas na stronie, referrer (skad przyszli — LinkedIn? Google?)

**JAK TO POMAGA (decyzje oparte na danych):**
- "Posty na LinkedIn generuja ruch?" → Sprawdz referrer w Web Analytics po publikacji posta
- "Live Preview konwertuje?" → Porownaj visits na / vs /generate (requests)
- "SD ma drop-off?" → Porownaj visits na stronie vs liczba subskrybentow MailerLite (konwersja)
- "Z jakiego kraju przychodzi ruch?" → Informacja dla @cmo — czy celowac w PL czy CEE

**PRIORYTET: ZROB TO TERAZ. 5 min. Zero kodu (opcja basic). Zero kosztow.**

---

### OKAZJA #2: LinkedIn Scheduling (15 min, PON 16.03)

**Problem:** 0 postow w marcu! 12 gotowych postow lezy w folderze. Reczna publikacja = zapominanie. Przy ENTP-A to zabojcze.

**POROWNANIE NARZEDZI (free tier):**

| Cecha | Buffer Free | Publer Free | Taplio |
|-------|-------------|-------------|--------|
| **Kanaly** | 3 | 5 | 1 (tylko LinkedIn) |
| **Zaplanowane posty** | 10 na kanal | 10 na kanal | Unlimited |
| **LinkedIn posting** | TAK | TAK | TAK |
| **Carousel/PDF** | NIE (free) | TAK | TAK |
| **Analytics** | Podstawowe | Podstawowe | Zaawansowane |
| **AI wsparcie** | NIE | NIE | TAK (ideas) |
| **Koszt (paid)** | $6/msc/kanal | $12/msc | $49/msc |
| **ToS LinkedIn** | ZGODNE (oficjalny partner) | ZGODNE | ZGODNE |
| **Polecenie CTO** | **NAJLEPSZY NA START** | Dobry (#2) | Za drogi na teraz |

**REKOMENDACJA: Buffer Free** — najprostszy, oficjalny partner LinkedIn (zero ryzyka ToS), 10 zaplanowanych postow = pokrycie ~3 tygodni przy 3 posty/tyg.

**KROK PO KROKU SETUP (Buffer):**

1. Wejdz na https://buffer.com/ → **"Get Started Now"** (darmowe)
2. Zaloz konto (email hello@system10h.com)
3. **"Add Channel"** → wybierz **LinkedIn** → zaloguj sie kontem LinkedIn → autoryzuj
4. **"Publishing"** → kliknij **"Create Post"**
5. Wklej pierwszy post z gotowych 12 (folder materialy/ lub gdzie masz drafty)
6. Kliknij **"Schedule"** → wybierz date i godzine (optymalna: wt/sr/czw 8:00-10:00 CET)
7. Powtorz dla kolejnych postow (max 10 w free tier)
8. Opcjonalnie: ustaw **Publishing Schedule** (stale sloty np. wt 9:00, czw 9:00) → posty wchodza w kolejke automatycznie

**JAK ZAPLANOWAC 12 GOTOWYCH POSTOW:**
- Buffer free = max 10 w kolejce. Zaplanuj 10 na najblizsze 3-4 tygodnie.
- Gdy 2-3 sie opublikuja, dodaj kolejne (utrzymuj pelna kolejke).
- Harmonogram: PON/SR/PT o 9:00 lub WT/CZW o 9:00 — testuj i sprawdz engagement.
- Po 2 tygodniach sprawdz Buffer analytics — ktory post mial najwyzsze zaangazowanie.

**UWAGA ToS LinkedIn:**
- Buffer, Publer, Hootsuite, Taplio — to OFICJALNI partnerzy LinkedIn Marketing Solutions.
- LinkedIn API (Marketing Product) pozwala na scheduling przez autoryzowane narzedzia.
- NIELEGALNE: boty do auto-like, auto-connect, scraping. Scheduling postow = OK.
- Zrodlo: https://www.linkedin.com/legal/l/api-terms-of-use

**PRIORYTET: PONIEDZIALEK 16.03. 15 min setup + zaplanowanie pierwszych 10 postow.**

---

### OKAZJA #3: Calendly → Telegram Alert (1-2h, W3)

**Problem:** Ktos bookuje demo na Calendly — dowiadujesz sie gdy otworzysz mail. Brak Speed-to-Lead dla demo 10H.

**ARCHITEKTURA:**

```
Calendly API (polling co 5 min)
        │
        ▼
calendly-alert.js (Node.js, LaunchAgent)
        │
        ├── Nowy event? → Telegram push
        │   "NOWE DEMO UMOWIONE!"
        │   Imie: [...]
        │   Email: [...]
        │   Kiedy: [data, godzina]
        │
        └── Brak nowego → cisza (jak speed-to-lead.js)
```

**CZY POTRZEBUJEMY SERWERA?**

NIE. Masz 3 opcje, od najprostszej:

| Opcja | Metoda | Czas | Koszt | Niezawodnosc |
|-------|--------|------|-------|--------------|
| **A (polecana)** | Node.js polling + LaunchAgent (jak speed-to-lead.js) | 1h | $0 | Dziala gdy Mac wlaczony |
| B | Cloudflare Worker (webhook endpoint) | 2h | $0 | Dziala 24/7 ale wymaga Calendly Pro ($10/msc) dla webhook |
| C | Zapier free tier (100 tasks/msc) | 15 min | $0 (free) | 100 tasks = 100 eventow/msc (wystarczy) |

**Opcja A = najlepsza.** Masz juz identyczny pattern (speed-to-lead.js). Kopiujesz, adaptujesz, dziala.

**ZARYS KODU (pseudokod opcji A):**

```javascript
// calendly-alert.js — pseudokod
import { loadEnv, sendTelegram, loadState, saveState } from './lib.js';

loadEnv();

async function run() {
  // 1. Fetch scheduled events z Calendly API
  //    GET https://api.calendly.com/scheduled_events
  //    Header: Authorization: Bearer {CALENDLY_TOKEN}
  //    Query: min_start_time=ISO_now, status=active

  // 2. Porownaj z zapisanym stanem (state/calendly.json)
  const state = loadState('calendly') || { knownIds: [] };

  // 3. Nowe eventy? → Telegram push
  for (const event of newEvents) {
    // GET /scheduled_events/{id}/invitees → dane osoby
    await sendTelegram(
      `🗓 NOWE DEMO UMOWIONE!\n` +
      `Kto: ${invitee.name}\n` +
      `Email: ${invitee.email}\n` +
      `Kiedy: ${event.start_time}\n` +
      `Link: ${event.uri}`
    );
  }

  // 4. Zapisz stan
  saveState('calendly', { knownIds: [...state.knownIds, ...newIds] });
}

run();
```

**CO POTRZEBA PRZED BUDOWA:**
1. Calendly Personal Access Token → https://calendly.com/ → Integrations → API & Webhooks → Personal Access Token
2. Dodaj `CALENDLY_TOKEN=xxx` do .env
3. Calendly free tier: 1 event type — sprawdz czy API dostepne (niektore endpointy wymagaja planu Standard $10/msc)

**ALTERNATYWA: Zapier Free Tier (100 tasks/msc)**
- Jesli Calendly free nie daje API access (zweryfikowac!) → Zapier:
- Trigger: "New Calendly Event" → Action: "Send Telegram Message"
- Setup: 15 min (zero kodu). Limit: 100 tasks/msc = 100 nowych eventow (wiecej niz wystarczy).
- Minus: kolejna zaleznosc zewnetrzna. Plus: zero kodu, niezawodne.

**PRIORYTET: W3 (17-18.03). 1-2h. Najpierw sprawdz Calendly free API access.**

---

### OKAZJA BONUSOWA: Auto-backup .env (5 min)

**Problem:** .env zawiera 11 kluczy API — jedyne klucze do calego systemu (11 narzedzi, 9 automatyzacji). Zero kopii zapasowej. Jesli plik zniknie — odtwarzanie zajmie godziny (generowanie nowych tokenow, ponowna autentykacja OAuth).

**ROZWIAZANIE: LaunchAgent (jak reszta automatyzacji) — co niedziele o 3:00**

**KROK 1:** Stworz skrypt backup

```bash
#!/bin/bash
# automatyzacje/backup-env.sh
cp /Users/mateuszsokolski/asystent/.env \
   /Users/mateuszsokolski/asystent/backup/.env_$(date +%Y-%m-%d)
# Zostawiaj tylko ostatnie 4 kopie (miesiąc)
ls -t /Users/mateuszsokolski/asystent/backup/.env_* 2>/dev/null | tail -n +5 | xargs rm -f 2>/dev/null
echo "[BACKUP] .env backed up: $(date)"
```

**KROK 2:** Stworz LaunchAgent (`com.asystent.env-backup.plist`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.asystent.env-backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/mateuszsokolski/asystent/automatyzacje/backup-env.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>0</integer>
        <key>Hour</key>
        <integer>3</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
```

**KROK 3:** Zaladuj

```bash
chmod +x automatyzacje/backup-env.sh
cp com.asystent.env-backup.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.asystent.env-backup.plist
```

**GDZIE BACKUP (nie w git!):**
- `backup/` jest w `.gitignore` — backup .env NIGDY nie trafi do repo.
- Opcjonalnie: dodatkowa kopia w macOS Keychain (KROK 4 w sekcji BEZPIECZENSTWO).
- NIE: Dropbox, Google Drive, iCloud (chyba ze szyfrowane).

**PRIORYTET: 5 min. Zrob przy okazji Cloudflare Analytics.**

---

## [4] SEJF API — PRZEGLAD

---

### STAN SEJFU

#### KOMPLETNE (klucz + docs + status)

| # | Klucz w .env | Narzedzie | Docs w api-inventory.md | Status |
|---|-------------|-----------|------------------------|--------|
| 1 | `ANTHROPIC_API_KEY` | Claude API | TAK (endpoint, panel, limity, koszt) | AKTYWNE |
| 2 | `MAILERLITE_API_KEY` | MailerLite (System 10H) | TAK (endpoint, MCP, rate limit) | AKTYWNE |
| 3 | `RESEND_API_KEY` | Resend | TAK (endpoint, MCP, koszt) | AKTYWNE |
| 4 | `GMAIL_CLIENT_ID` | Gmail OAuth | TAK (OAuth flow, automatyzacje) | AKTYWNE |
| 5 | `GMAIL_CLIENT_SECRET` | Gmail OAuth | TAK | AKTYWNE |
| 6 | `GMAIL_REFRESH_TOKEN` | Gmail OAuth | TAK (auto-generowany) | AKTYWNE |
| 7 | `NOTION_API_KEY` | Notion API | TAK (endpoint, CRM DB ID) | AKTYWNE |
| 8 | `GOOGLE_AI_STUDIO_API_KEY` | Gemini MCP | TAK (modele, koszty, Deep Research) | AKTYWNE |
| 9 | `TELEGRAM_BOT_TOKEN` | Telegram Bot (Ultron) | TAK (bot name, chat ID, endpoint) | AKTYWNE |
| 10 | `MAILERLITE_ARTNAPI_API_KEY` | MailerLite (ArtNapi) | CZESCIOWO (wspomniane w audit, brak pelnej sekcji w api-inventory) | NIEUZYWANE |

**Cloudflare Dashboard (oddzielnie, NIE w .env):**

| # | Sekret | Narzedzie | Status |
|---|--------|-----------|--------|
| 1 | `ANTHROPIC_API_KEY` | CF Worker — Live Preview + Style Match | AKTYWNE |
| 2 | `MAILERLITE_API_KEY` | CF Worker — subscribe endpoint | AKTYWNE |
| 3 | `RESEND_API_KEY` | CF Worker — email z wynikami | AKTYWNE |
| 4 | `TURNSTILE_SECRET_KEY` | CF Worker — CAPTCHA weryfikacja | AKTYWNE |
| 5 | `TELEGRAM_BOT_TOKEN` | CF Worker — Style Match alert | AKTYWNE |

---

#### NIEKOMPLETNE

| # | Co | Problem | Akcja |
|---|-----|---------|-------|
| 1 | `MAILERLITE_ARTNAPI_API_KEY` | Klucz w .env ale NIEUZYWANE. Brak dedykowanej sekcji w api-inventory.md. Decyzja 09.03: odlozone na kwiecien. | Dodac sekcje do api-inventory.md LUB usunac klucz z .env jesli nie potrzebny przed kwietniem. |
| 2 | Backup kluczy | 11 kluczy TYLKO w .env. Zero kopii w menedzerze hasel. | Wdrozyc auto-backup .env (patrz okazja bonusowa) + zapisac krytyczne klucze w macOS Keychain. |
| 3 | Rotacja kluczy | Brak informacji kiedy klucze byly utworzone i kiedy wygasaja. | Dodac daty do api-inventory.md (patrz tabela rotacji). |

---

#### DO WERYFIKACJI

| # | Element | Pytanie | Status weryfikacji |
|---|---------|---------|-------------------|
| 1 | **AIBL_NETWORK_TOKEN** | Klucz w .env, opis: "AI Biznes Lab Network — matchmaking, profil networkingowy". Czy skill Claude Code aktywnie uzywany? Czy token wazny? | ZWERYFIKOWANE: Token istnieje w .env. Uzywany przez skill Claude Code do networkingu AIBL. Zachowaj — niski koszt przechowywania, potencjalna wartosc. |
| 2 | **speed-to-lead.js** | Skrypt + LaunchAgent istnieja. W plan.md ARTNAPI nie wymieniony w liscie "SAMOGRAJ". Czy aktywny? | ZWERYFIKOWANE: LaunchAgent ZALADOWANY (`launchctl list` potwierdza). Skrypt monitoruje nowych subskrybentow MailerLite → Telegram push. AKTYWNY. Dodac do listy SAMOGRAJ w plan.md. |
| 3 | **pipeline-brief.js** | Skrypt + LaunchAgent istnieja. Nie wymieniony w glownej liscie automatyzacji plan.md. Czy aktywny? | ZWERYFIKOWANE: LaunchAgent ZALADOWANY. Skrypt: Notion CRM query → skonsolidowany brief pipeline → Telegram (8:15 pn-pt). AKTYWNY. Dodac do listy SAMOGRAJ w plan.md. |

---

### ROTACJA KLUCZY

| Klucz | Typ | Data utworzenia | Wygasniecie | Ostatnia rotacja | Rekomendacja |
|-------|-----|----------------|-------------|------------------|-------------|
| `ANTHROPIC_API_KEY` | API Key | ~02.2026 (z setup) | Nie wygasa | Nigdy | Rotuj co 90 dni (maj 2026) |
| `MAILERLITE_API_KEY` | API Token | ~02.2026 | Nie wygasa | Nigdy | Rotuj co 90 dni |
| `RESEND_API_KEY` | API Key (re_) | ~02.2026 | Nie wygasa | Nigdy | Rotuj co 90 dni |
| `GMAIL_CLIENT_ID` | OAuth Client | ~02.2026 | Nie wygasa | N/A (staly) | NIE rotuj (zmiana wymaga ponownej auth) |
| `GMAIL_CLIENT_SECRET` | OAuth Secret | ~02.2026 | Nie wygasa | N/A | NIE rotuj |
| `GMAIL_REFRESH_TOKEN` | OAuth Refresh | ~02.2026 | Nie wygasa* | Nigdy | Auto-refresh w lib.js. *Google moze uniewazniac po 6 msc nieuzywania. |
| `NOTION_API_KEY` | Internal Integration | ~02.2026 | Nie wygasa | Nigdy | Rotuj co 90 dni |
| `GOOGLE_AI_STUDIO_API_KEY` | API Key (AIza) | ~02.2026 | Nie wygasa | Nigdy | Rotuj co 90 dni |
| `TELEGRAM_BOT_TOKEN` | Bot Token | ~02.2026 | Nie wygasa | Nigdy | Rotuj TYLKO jesli kompromitacja |
| `AIBL_NETWORK_TOKEN` | Custom Token | Nieznana | Nieznana | Nigdy | Zweryfikuj z AIBL czy jest aktualny |
| `MAILERLITE_ARTNAPI_API_KEY` | API Token | ~03.2026 | Nie wygasa | Nigdy | Nieuzywany — usun lub rotuj przy aktywacji |
| CF: `TURNSTILE_SECRET_KEY` | Site Secret | ~02.2026 | Nie wygasa | Nigdy | Rotuj co 90 dni (w CF Dashboard) |

**REKOMENDACJA ROTACJI:**
- **Harmonogram:** Co 90 dni (1x na kwartal). Nastepna rotacja: **czerwiec 2026**.
- **Procedura:** Wygeneruj nowy klucz w panelu dostawcy → zamien w .env → zamien w CF Dashboard (jesli duplikowany) → przetestuj automatyzacje → usun stary klucz.
- **KRYTYCZNE:** Anthropic, Notion, MailerLite — uzywane przez 9 automatyzacji. Testuj PO rotacji (odpal kazdy skrypt reczny).
- **NIE ROTUJ BEZ POTRZEBY:** Gmail OAuth (wymaga ponownej interaktywnej autentykacji), Telegram Bot Token (zmiana = nowy bot = utrata historii).

---

## [5] BEZPIECZENSTWO — AUDIT

---

### WYNIK AUDITU

```
KRYTYCZNE: [0] — brak krytycznych zagrozen

WAZNE: [3]
1. BRAK BACKUPU KLUCZY API — 11 kluczy w jednym pliku .env, zero kopii.
   Utrata pliku = godziny odtwarzania (generowanie tokenow, ponowna OAuth).
   → NAPRAW: Auto-backup .env (patrz Okazja Bonusowa) + Keychain macOS.

2. BRAK LIMITU WYDATKOW na Claude API — prepaid credits ale brak ustawionego
   monthly limit w console.anthropic.com. Runaway script = nieoczekiwany koszt.
   → NAPRAW: console.anthropic.com → Settings → Spend Limits → ustaw $20/msc.

3. BRAK LIMITU WYDATKOW na Google AI Studio — Gemini API free tier ma limity
   per-minute ale brak dziennego/miesiecznego alertu kosztowego.
   → NAPRAW: Google Cloud Console → Budgets & Alerts → $5/msc alert.

OK: [11]
1. .env w .gitignore — klucze NIE trafiaja do repo
2. .env permissions -rw------- (600) — tylko wlasciciel czyta/pisze
3. klucz.prv w ~/.ssh/ z chmod 600 — NAPRAWIONE 15.03
4. Cloudflare sekrety w CF Dashboard (nie w .env) — oddzielone od lokalnych
5. Gmail OAuth auto-refresh z retry 3x10s — naprawione 15.03
6. backup/ w .gitignore — backupy nie trafiaja do repo
7. Brak kluczy w CLAUDE.md ani plikach asystentow — czysto
8. Brak kluczy w plikach publicznych — czysto
9. Turnstile CAPTCHA na Live Preview — chroni przed botami
10. Rate limiting na CF Worker (5/min, 20/h, 50/dzien) — chroni przed abuse
11. 9 LaunchAgents zaladowanych i dzialajacych — system stabilny
```

---

### UPRAWNIENIA AI

| Pytanie | Odpowiedz | Ryzyko |
|---------|-----------|--------|
| Czy AI moze WYSLAC maile? | NIE bezposrednio. email-radar tworzy DRAFTY w Gmail. User sam klika "Wyslij". @ghost pisze tresc → `create-gmail-draft.js` → draft. NIGDY `send_email`. | NISKIE — pelna kontrola usera |
| Czy AI ma dostep do platnosci? | NIE. Brak integracji z systemami platnosci (Stripe, PayPal, bank). Fakturowanie przez Piotra (ArtNapi) lub reczne (10H). | ZERO RYZYKA |
| Czy tryb autonomiczny? | NIE. Automatyzacje sa alert-only (Telegram push) lub draft-only (Gmail drafty). User zatwierdza KAZDA akcje wychodzaca. | NISKIE |
| Czy AI moze modyfikowac CRM? | TAK — skrypty moga aktualizowac Notion CRM (Due, status, notatki). Ale tylko w ramach zdefiniowanych skryptow (nie dowolnie). | NISKIE — operacje sa przewidywalne |
| Czy AI moze usuwac dane? | TAK technicznie (Notion API pozwala). ALE zaden skrypt nie uzywa operacji DELETE. notion-archive.js ARCHIWIZUJE (nie usuwa). | NISKIE — brak destrukcyjnych operacji |

---

### REKOMENDACJE (priorytet)

| # | Co | Jak | Czas | Priorytet |
|---|-----|-----|------|-----------|
| 1 | **Auto-backup .env** | LaunchAgent + skrypt bash (patrz Okazja Bonusowa powyzej) | 5 min | WYSOKI |
| 2 | **Limit wydatkow Claude API** | console.anthropic.com → Settings → Spend Limits → $20/msc | 2 min | WYSOKI |
| 3 | **Limit wydatkow Google AI** | Google Cloud Console → Budgets & Alerts → $5/msc alert | 3 min | WYSOKI |
| 4 | **Krytyczne klucze do Keychain** | `security add-generic-password -a "asystent" -s "ANTHROPIC_API_KEY" -w "KLUCZ" -T ""` (powtorz dla kazdego klucza) | 10 min | SREDNI |
| 5 | **Dodaj MAILERLITE_ARTNAPI do api-inventory** | Sekcja w api-inventory.md z pelnymi danymi (endpoint, panel, status NIEUZYWANE) | 3 min | NISKI |
| 6 | **Harmonogram rotacji kluczy** | Wpis w kalendarzu Google: "Rotacja kluczy API" co 90 dni (nastepna: czerwiec 2026) | 2 min | NISKI |
| 7 | **Dodaj speed-to-lead + pipeline-brief do plan.md SAMOGRAJ** | Aktualizacja sekcji SAMOGRAJ w plan.md — oba skrypty sa aktywne a nie sa wymienione | 2 min | NISKI |

---

### PODSUMOWANIE BEZPIECZENSTWA

```
OCENA OGOLNA: 7.5 / 10

MOCNE STRONY:
- Zero kluczy w repo (gitignore ✅)
- Permissions .env 600 (tylko wlasciciel ✅)
- AI = draft-only, nigdy send (human-in-the-loop ✅)
- Sekrety CF oddzielone od lokalnych (✅)
- CAPTCHA + rate limiting na produkcji (✅)

DO POPRAWY:
- Backup kluczy (jedyny SPOF calego systemu)
- Limity wydatkow API (ochrona przed runaway costs)
- Rotacja kluczy (nigdy nie rotowane od setup ~02.2026)

NASTEPNY AUDIT: kwiecien 2026 (po rotacji kluczy)
```

---

*Sekcje [3][4][5] wygenerowano: 15.03.2026 | @cto | Menu 3 + 4 + 5 | Oba biznesy*

---

## [6] AUTOMATYZACJA 24/7 — PRZEGLAD I ROADMAP

---

### AKTUALNE AUTOMATYZACJE — HEALTH CHECK

> Dane z: `launchctl list | grep com.asystent` + analiza logow + plistow.
> Data audytu: 15.03.2026 (niedziela)

| # | Skrypt | Cron | LaunchAgent | Log istnieje? | Ostatni sukces | Status | Uwagi |
|---|--------|------|-------------|---------------|----------------|--------|-------|
| 1 | `morning-scan.js` | 8:00 pn-pt | ✅ zaladowany (exit 0) | ✅ 36 linii | 10.03 (Done) | ⚠️ NIESTABILNY | **5/11 uruchomien = OAuth failed.** Ostatnie 3 z rzedu (11-13.03) failed. Token refresh dziala (lib.js retry 3x10s) ale siec pada. Weekend skipping OK. |
| 2 | `email-radar.js` | co 30 min 8-18 | ✅ zaladowany (exit 0) | ✅ 441 linii | 15.03 20:46 | ✅ DZIALA | Poprawnie pomija poza godzinami ("Outside business hours"). Duzy log — rozwazyc rotacje. |
| 3 | `followup-guardian.js` | 17:00 pn-pt | ✅ zaladowany (exit 0) | ✅ 37 linii | 13.03 17:00 | ✅ DZIALA | Ostatni run: 5 draftow (w tym EN dla foreign: HobbySet LV, FlashArt EE, Knihy CZ, Frocskolo HU). Piatek 14.03 — pewnie pominal (brak logu tego dnia). |
| 4 | `inquiry-router.js` | event-driven (co 30 min) | ✅ zaladowany (exit 0) | ✅ 212 linii | 15.03 20:46 | ✅ DZIALA | Poprawnie pomija poza godzinami. Duzy log. |
| 5 | `restock-reminder.js` | pon 9:00 | ✅ zaladowany (exit 0) | ❌ BRAK LOGU | nigdy | ⏳ CZEKA NA 1. RUN | Deploy 12.03 (czwartek). Pierwszy poniedzialek = 16.03. **Jutro powinien odpalic — ZWERYFIKOWAC.** |
| 6 | `pipeline-brief.js` | 8:15 pn-pt | ✅ zaladowany (exit 0) | ✅ 5 linii | 09.03 | ⚠️ CICHY | Ostatni log 09.03 (poniedzialek). Brak wpisow 10-13.03. Skrypt dziala (5 "Sent" sukcesow). Moze logowanie nie dopisuje? Lub Mac off o 8:15? |
| 7 | `speed-to-lead.js` | co 4h | ✅ zaladowany (exit 0) | ✅ 115 linii | 15.03 19:46 | ✅ DZIALA | Zlowil nowego leada: Kinga (blackchilla.pl). |
| 8 | `stock-monitor.js` | pon 9:05 | ✅ zaladowany (exit 0) | ❌ BRAK LOGU | nigdy | ⏳ CZEKA NA 1. RUN | Deploy 15.03 (sobota). Pierwszy poniedzialek = 16.03. **Jutro powinien odpalic — ZWERYFIKOWAC.** |
| 9 | `weekly-report-reminder.js` | czw 8:30 | ✅ zaladowany (exit 0) | ❌ BRAK LOGU | nigdy | ⚠️ PROBLEM | Deploy 09.03 (poniedzialek). Powinien odpalic czw 12.03 o 8:30 — **NIE ODPALIL.** Syntax OK. Prawdopodobnie Mac off/sleep o 8:30 w czwartek. **ZWERYFIKOWAC czw 19.03.** |

**PODSUMOWANIE HEALTH CHECK:**
- ✅ Dziala stabilnie: 4/9 (email-radar, followup-guardian, inquiry-router, speed-to-lead)
- ⚠️ Niestabilne/ciche: 3/9 (morning-scan OAuth, pipeline-brief brak logow, weekly-report-reminder nigdy nie odpalil)
- ⏳ Czeka na 1. run: 2/9 (restock-reminder, stock-monitor — oba jutro pon 16.03)

**PROBLEMY DO NAPRAWY:**
1. **morning-scan.js OAuth (P0):** 45% failure rate. lib.js retry 3x10s nie wystarczy. Prawdopodobnie token wygasa gdy Mac spi. Fix: (a) sprawdzic czy refresh token jest wazny, (b) dodac retry z exponential backoff, (c) fallback: generuj morning-feed bez Gmail (tylko CRM).
2. **pipeline-brief.js cichy (P1):** Ostatni log 09.03, ale agent zaladowany z exit 0. Sprawdzic czy skrypt ma warunek weekend-skip ktory nie loguje. Lub Mac off o 8:15.
3. **weekly-report-reminder.js (P1):** Nigdy nie odpalil. Czw 12.03 8:30 — Mac prawdopodobnie off/sleep. Brak `RunAtLoad` w plist = nie nadrobi po przebudzeniu. Rozwiazanie: dodac `RunAtLoad: false` jawnie + rozwazyc przesuniecie na pozniejsza godzine (np. 10:00).
4. **Rotacja logow (P2):** email-radar.log 19 KB, inquiry-router.log 9.5 KB. Brak rotacji = rosna w nieskonczonosc. Dodac logrotate lub `tail -1000` na starcie skryptu.

---

### POKRYCIE AUTOMATYZACJI (mapa)

```
SCIEZKA KLIENTA ARTNAPI:
═══════════════════════════════════════════════════════════════════════
Research → Outreach → Probka → Odpowiedz → Zamowienie → Restock → Retencja
   ❌        ❌        ❌       ✅           ✅           ✅        ❌
                                radar        radar        restock
                                +inquiry     +FU-guard    reminder
                                +STL

Pokrycie: 3/7 etapow = 43%
Automatyzacje pokrywajace:
  ✅ email-radar.js    → wykrywa odpowiedzi leadow, matchuje z CRM, alert Telegram
  ✅ inquiry-router.js → auto-draft na zapytania z kalkulatora B2B
  ✅ speed-to-lead.js  → alert Telegram gdy nowy lead w CRM
  ✅ followup-guardian  → auto-draft overdue FU (17:00)
  ✅ restock-reminder   → auto-draft restock dla AM klientow (pon 9:00)
  ❌ Research           → reczny (Google Maps, Allegro, BIP) — @recon
  ❌ Outreach           → reczny (cold email/telefon) — @ghost+@cso
  ❌ Probka             → reczny (Piotr wysyla)
  ❌ Retencja           → reczny (brak welcome pack, brak feedback D+14)
═══════════════════════════════════════════════════════════════════════
```

```
SCIEZKA KLIENTA SYSTEM 10H:
═══════════════════════════════════════════════════════════════════════
Outreach → SD Quiz → Email seq → Demo → Close → Onboarding → Feedback
   ❌        ✅         ✅         ❌     ❌       ❌           ❌
             LP/CF      MailerLite
             Worker     3 auto

Pokrycie: 2/7 etapow = 29%
Automatyzacje pokrywajace:
  ✅ Live Preview   → Cloudflare Worker (Claude Haiku streaming)
  ✅ SD quiz        → Cloudflare Worker (email capture → MailerLite + Resend)
  ✅ Email sequence → MailerLite (3 automatyzacje: wyniki SD, follow-up)
  ❌ Outreach       → reczny (LinkedIn DM, cold email) — @ghost
  ❌ Demo booking   → reczny (Calendly link wklejany recznie)
  ❌ Close          → reczny (oferta PDF, negocjacja)
  ❌ Onboarding     → reczny (Architekt + konfiguracja + Loom 3h)
  ❌ Feedback       → reczny (12 pytan, telefon, brak triggera)
═══════════════════════════════════════════════════════════════════════
```

```
WSPARCIE OPERACYJNE (oba biznesy):
═══════════════════════════════════════════════════════════════════════
Morning brief   Pipeline digest   Raport tyg.   Stock   .env backup
    ⚠️               ⚠️              ✅          ⏳        ❌
  morning-scan    pipeline-brief   gen-weekly   stock-mon
  (OAuth 45%!)    (cichy od 09.03) +reminder    (1. run jutro)

Pokrycie: 2/5 solidne, 2/5 niestabilne, 1/5 brak
═══════════════════════════════════════════════════════════════════════
```

**NAJWIEKSZA LUKA:** System 10H ma prawie ZERO automatyzacji cron (wszystko na Cloudflare Workers + MailerLite). Brak:
- CRM → brak auto follow-up
- Brak alertu o nowym demo (Calendly)
- Brak onboarding/feedback automation
- Brak Speed-to-Lead dla demo bookings

**DRUGORZEDNA LUKA:** ArtNapi brak automatyzacji na poczatku (research, outreach) i koncu (retencja, welcome pack) sciezki klienta.

---

### TOP 5 NOWYCH AUTOMATYZACJI (propozycje)

| # | Nazwa | Co robi | Trigger | Output | Czas budowy | ROI | Priorytet |
|---|-------|---------|---------|--------|-------------|-----|-----------|
| 1 | **`calendly-alert.js`** | Wykrywa nowe bookowanie demo na Calendly → push na Telegram z danymi (imie, firma, data/godzina demo). Speed-to-Demo <5 min. | Calendly webhook (HTTP POST) lub polling API co 15 min | Telegram: "NOWE DEMO: [imie] [firma] [kiedy]" | **1-2h** | **WYSOKI** — 1 szybciej zamkniety deal = 2 999 PLN. Przy aktualnym modelu: dowiadujesz sie o demo gdy otworzysz maila (latency: godziny). | **P1 — W3** |
| 2 | **`feedback-trigger.js`** (System 10H) | Sprawdza CRM/plan.md: klient ze statusem INSTALLED + >=14 dni od instalacji → Telegram reminder + draft emaila z 12 pytaniami (3 bloki). | Cron: pon 10:00 (analogia restock-reminder) | Telegram alert + Gmail draft (lub MD) z pytaniami feedbackowymi | **2-3h** | **SREDNI** — Feedback = case study + decyzje cenowe + social proof. Ale przy 2 klientach (Stalton, Andrzej) = niska czestotliwosc. Budowac gdy pipeline 10H > 5 klientow. | **P2 — IV.2026** |
| 3 | **`welcome-pack.js`** (ArtNapi) | Po 1. zamowieniu klienta (CRM status → "Zamknieta-Wygrana") → auto-draft welcome email: katalog PDF, kontakt, FAQ, warunki reorderu. EN/PL wg isForeignLead(). | Cron: codziennie 9:30 (scan CRM nowe "Zamknieta-Wygrana") | Gmail draft welcome pack email | **2h** | **SREDNI** — Profesjonalizm + upsell potential. Ale klientow AM ~15 — ROI rosnie z baza. Budowac razem z MailerLite ArtNapi aktywacja (kwiecien). | **P2 — IV.2026** |
| 4 | **`action-log.js`** (Unified Action Log) | Centralne logowanie WSZYSTKICH akcji automatyzacji: kto (skrypt), co (draft/alert/error), kiedy, do kogo (lead). Format JSONL. Kazdy skrypt wywoluje `logAction()` z lib.js. | Event-driven (wywolywany z kazdego skryptu) | `automatyzacje/logs/action-log.jsonl` — jeden plik, pelna historia. Queryable. | **3-4h** (refactor 9 skryptow + lib.js) | **SREDNI** — Debugowanie, audit trail, metryki (ile draftow/tydzien, ile alertow, failure rate). Inspiracja AWS. Ale nie generuje przychodu bezposrednio. | **P3 — IV-V.2026** |
| 5 | **`prowizja-sync.js`** | Auto-fetch CSV z Google Sheets (arkusz prowizji) raz/tydzien → porownanie z CRM (klienci AM, zamowienia) → raport rozbieznosci na Telegram. | Cron: pon 8:45 (przed morning-scan) | Telegram: "PROWIZJE: X zamowien w Sheets, Y klientow w CRM. Rozbieznosci: [lista]" | **1-2h** | **NISKI** — Oszczedza 5 min/tyg recznego WebFetch. Wartosc rosnie z wolumenem zamowien. Przy 15-20 zam/msc = warto. | **P3 — V.2026** |

**BONUS (nie-skryptowe, ale wazne):**

| # | Nazwa | Co robi | Czas | Priorytet |
|---|-------|---------|------|-----------|
| B1 | **LinkedIn scheduling (Buffer/Publer)** | 12 postow zaplanowanych na 4 tygodnie. Nie skrypt — zewnetrzne narzedzie. | 15 min | **P0 — jutro 16.03** |
| B2 | **Cloudflare Analytics ON** | Wlacz w panelu CF — dane o ruchu system10h.com natychmiast. | 5 min | **P0 — jutro 16.03** |
| B3 | **Auto-backup .env** | LaunchAgent: `cp .env backup/.env_$(date +%Y-%m-%d)` raz/tyg (pon 7:00). | 10 min | **P1 — W3** |

---

### ROADMAP CTO Q2 2026

> Zalozenie: max 2-4h/tydzien na prace @cto. User ma 6h/dzien total na oba biznesy.

| Miesiac | Co budujemy | Czas | Zaleznosci | Notatki |
|---------|-------------|------|------------|---------|
| **III.2026 (W3: 16-20.03)** | (1) Fix morning-scan OAuth — retry + fallback CRM-only | 1h | lib.js | 45% failure rate to nie do zaakceptowania. Morning feed = fundament dnia. |
| | (2) `calendly-alert.js` + LaunchAgent | 1-2h | Calendly API key / webhook URL | Speed-to-Demo. Klon logiki speed-to-lead.js. |
| | (3) Auto-backup .env (LaunchAgent) | 10 min | — | 1-liner, zero ryzyka. |
| | (4) Buffer/Publer setup + 12 postow LI | 15 min | — | NIE skrypt — user robi sam. |
| | (5) Cloudflare Analytics ON | 5 min | — | NIE skrypt — user robi sam w panelu CF. |
| **III.2026 (W4: 23-27.03)** | (1) Debug pipeline-brief.js + weekly-report-reminder | 30 min | Logi | Zweryfikowac czy dzialaja po fix morning-scan. |
| | (2) Weryfikacja restock-reminder + stock-monitor (po 1. runie 16.03) | 15 min | Logi z 16.03 | Potwierdzic ze dzialaja poprawnie. |
| | (3) Rotacja logow (lib.js helper `rotateLogs()`) | 30 min | lib.js | email-radar 19 KB, inquiry-router 9.5 KB — beda rosnac. |
| **IV.2026 (W1-2)** | (1) `welcome-pack.js` (ArtNapi) — auto-draft po 1. zamowieniu | 2h | CRM status "Zamknieta-Wygrana" | Laczyc z aktywacja MailerLite ArtNapi (jesli >50 AM). |
| | (2) `feedback-trigger.js` (System 10H) — D+14 post-install | 2-3h | Plan.md lub CRM 10H | Trigger + 12 pytan + Telegram reminder. |
| **IV.2026 (W3-4)** | (1) Unified Action Log — `logAction()` w lib.js + refactor 9 skryptow | 3-4h | lib.js, wszystkie skrypty | Centralne JSONL. Metryki: ile draftow/tyg, failure rate, latency. |
| | (2) Notion CRM System 10H (klon ArtNapi) | 1h | Notion API | Umozliwi auto-FU dla 10H. |
| **V.2026** | (1) `prowizja-sync.js` — CSV Google Sheets → porownanie CRM | 1-2h | Publiczny CSV URL | Wartosc rosnie z wolumenem zamowien. |
| | (2) Google Calendar w morning-feed.md | 30 min | Google Calendar MCP | "DZIS W KALENDARZU: demo 14:00 z X". |
| | (3) FAQ sekcja na system10h.com (deploy) | 1h | ghost_styl.md tresc | @cto+@ghost. Tresc juz istnieje — deploy na strone. |
| **VI.2026** | (1) MailerLite ArtNapi — seasonal campaigns + restock email automation | 2h | >50 AM klientow | Automatyczny email nurturing poza cold outreach. |
| | (2) VPS failover ($5/msc) — przeniesienie cron na serwer | 2-3h | VPS (Hetzner/DigitalOcean) | Eliminuje problem "Mac off = cron nie odpala". Opcjonalne — tylko jesli MacBook sleep to >20% failure rate. |

---

### PODSUMOWANIE [6]

**Stan na 15.03.2026:**
- **9 skryptow + 9 LaunchAgents** — solidna baza, zero kosztow infrastruktury.
- **4/9 dziala stabilnie**, 3/9 niestabilne (OAuth, brak logow), 2/9 czeka na 1. run (jutro).
- **ArtNapi: 43% pokrycia** sciezki klienta (srodek dobrze, poczatek i koniec reczne).
- **System 10H: 29% pokrycia** (praktycznie zero cron — wszystko na Cloudflare Workers + MailerLite).
- **Najwieksze ryzyko:** morning-scan OAuth failure 45% = morning feed (fundament dnia) nie generuje sie co 2-3 dzien.

**3 rzeczy do zrobienia JUTRO (16.03, poniedzialek):**
1. Zweryfikowac czy restock-reminder + stock-monitor odpalily (sprawdzic logi ~9:05).
2. Buffer/Publer — zaplanowac 12 postow LinkedIn (15 min).
3. Cloudflare Analytics ON (5 min).

**3 rzeczy do zrobienia W TYGODNIU (W3):**
1. Fix morning-scan OAuth (1h) — retry + fallback.
2. `calendly-alert.js` (1-2h) — Speed-to-Demo.
3. Auto-backup .env (10 min).

---

*Sekcja [6] wygenerowana: 15.03.2026 | @cto | Automatyzacja 24/7 — Przeglad i Roadmap*
