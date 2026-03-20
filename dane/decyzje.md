# DECYZJE - BAZA WIEDZY

## ZASADY
- NAJNOWSZE NA GÓRZE
- CO TYDZIEŃ PRZEJRZYJ
- TAGUJ KAŻDY WPIS: [ARTNAPI] / [SYSTEM10H] / [SHARED]
- LIMIT: ≤100 aktywnych wpisów. Wpisy >7 dni → backup/decyzje_archiwum_YYYY-MM-DD.md

---

## KATEGORIE

| Kategoria | Kiedy używać |
|-----------|-------------|
| FINANSE | Budżet, wydatki, inwestycje, ceny, dług |
| STRATEGIA | Wizja, kierunek, priorytety, pivoty |
| MARKETING | Kampanie, content, kanały, branding |
| SPRZEDAŻ | Lejki, deale, klienci, follow-upy |
| OPERACJE | Procesy, narzędzia, automatyzacje, zespół |
| PRODUKT | Funkcjonalności, roadmap, feedback, UX |

## FORMAT WPISU

```
### [DATA] | [KATEGORIA] | [TEMAT]

**KONTEKST:** [co się działo, dlaczego ta decyzja - 1-3 zdania]

**DECYZJA:** [co postanowiono - konkretnie]

**DLACZEGO:** [główne uzasadnienie - 1 zdanie]

**NASTĘPNY KROK:** [pierwsza akcja + kto + kiedy]
```

---

## AKTYWNE DECYZJE

### [SHARED] 20.03.2026 | OPERACJE | MORNING CHAIN + CRM AUTO-SYNC + SAMOGRAJ STARTER

**KONTEKST:** Insights z 109 sesji wykazały 3 wąskie gardła: (1) morning-scan informuje ale nie działa (19 overdue, 42k PLN), (2) CRM mismatche naprawiane ręcznie (6/dzień), (3) Samograj Starter (PRO 4 999 PLN) niezbudowany. Lekcja 12.03: "osobny skrypt > rozszerzenie."

**DECYZJA:** Wdrożono 3 moduły:
1. `morning-chain.js` — orchestrator: morning-scan → crm-auto-sync → followup-guardian --include-due-today. Jeden cron zastępuje ręczne reagowanie na feed.
2. `crm-auto-sync.js` — auto-fix mismatchów Gmail↔CRM (Notion API update). Dry-run domyślny, --live do zapisu.
3. `followup-guardian.js` rozszerzony: `--include-due-today` — drafty dla leadów due dziś + 1-2 dni overdue (wcześniej: gap 0-2 dni).
4. **Samograj Starter** (`system10h/produkt/samograj-starter/`) — 3 template skrypty (morning-brief, followup-alert, weekly-pulse) + config + setup.sh + README. Produkt PRO gotowy do demo/sprzedaży.

**AKTUALIZACJE WIEDZY:**
- `dane/cto.md` — zaktualizowano tabelę AKTYWNE AUTOMATYZACJE (14 skryptów, chain flow)
- `automatyzacje/verify-all.js` — dodano crm-auto-sync.js + morning-chain.js do rejestru (35 testów, 0 fail)
- `automatyzacje/lib.js` — 5 nowych eksportów (updateNotionPage, addBusinessDays, updateCRMDue, updateCRMLastContact, appendCRMNote)

**DLACZEGO:** 117h/miesiąc w Claude Code, ~30% na powtarzalne zadania. Chain eliminuje ręczne reagowanie na morning-feed. CRM sync eliminuje 6+ mismatchów/dzień. Samograj Starter zamyka lukę produktową PRO.

**NASTĘPNY KROK:**
- Mateusz: zainstaluj LaunchAgent (`cp automatyzacje/com.asystent.morning-chain.plist ~/Library/LaunchAgents/` + unload morning-scan)
- Mateusz: pierwszy --live run CRM sync: `node automatyzacje/crm-auto-sync.js --live`
- @cso: pokaż Samograj Starter na następnym demo (Modul Soft FU 23.03)

---

### [ARTNAPI] Katalog B2B v3 — standard załączników (20.03.2026)
**Decyzja:** Od teraz KAŻDY cold mail i follow-up (PL i EN) zawiera:
- Załącznik 1: ArtNapi Sell Sheet 2026 (1-pager PDF)
- Załącznik 2: ArtNapi Katalog B2B 2026 v3 (11 stron PDF)
Pliki źródłowe: /Users/mateuszsokolski/Desktop/ARTNAPI/FINAL_B2B_2026/
**Kontekst:** Feedback Nazara — niska konwersja z powodu słabych materiałów. Nowy katalog v3 + Sell Sheet zamykają tę lukę.
**Status:** AKTYWNA

---

### [ARTNAPI] Reactivation overdue z hookiem "nowy katalog" (20.03.2026)
**Decyzja:** Overdue leady (oprócz kontaktowanych w bieżącym tygodniu) dostają FU z hookiem "przygotowaliśmy nowy katalog B2B" + załącznik.
**Status:** AKTYWNA

---

### [ARTNAPI] Faber Castell + JK Style — zamrożone (20.03.2026)
**Decyzja:** Oba leady zamrożone z powodu braku adresu email i braku kontaktu (21d i 14d overdue). Revisit: V.2026.
**Status:** AKTYWNA

---

### [ARTNAPI] Pitch Deck — odłożony (20.03.2026)
**Decyzja:** Pitch Deck (osobny od katalogu, 7-10 slajdów strategicznych) = nie teraz. Potrzebny w Fazie 2 Retail (IX-XII 2026) przed Empik/Smyk. Na teraz Sell Sheet + Katalog v3 wystarczą.
**Status:** AKTYWNA

---

### [ARTNAPI] Stary katalog usunięty (20.03.2026)
**Decyzja:** Usunięto materialy-artnapi/katalog_artnapi_2026_PL.html. Jedyny aktualny katalog = FINAL_B2B_2026/ArtNapi_Katalog_B2B_2026_v3.
**Status:** ZAMKNIĘTA

---

### [SHARED] 20.03.2026 | OPERACJE | VERIFICATION SUITE + SAFETY HOOK — WDROŻONE

**KONTEKST:** Inspiracja: Anthropic internal best practices dla Agent Skills (tweet @trq212). Nasz system miał 11 skryptów automatyzacji bez żadnego mechanizmu weryfikacji po zmianach. Pliki dane/ i automatyzacje/ nie były chronione przed przypadkowym usunięciem.

**DECYZJA:** Wdrożono 2 narzędzia:
1. `automatyzacje/verify-all.js` — Verification Suite: 5 testów (syntax, importy, .env, state, LaunchAgents) × 11 skryptów. Exit code 1 przy błędach.
2. `.claude/hooks/safety-guard.sh` — PreToolUse hook: blokuje rm/reset/checkout na dane/, automatyzacje/, .env, CLAUDE.md.

**AKTUALIZACJE WIEDZY:**
- `dane/cto.md` — zaktualizowano tabelę AKTYWNE AUTOMATYZACJE (dodano 4 brakujące skrypty + verify-all + safety hook)
- `dane/coo.md` — dodano KROK 1b do HEALTH CHECK (uruchamia verify-all.js)
- `.claude/settings.json` — dodano hook PreToolUse → safety-guard.sh

**DLACZEGO:** "Everything fails, all the time" (Vogels). System który sam weryfikuje swoje automatyzacje łapie awarie zanim user je zauważy.

**NASTĘPNY KROK:** @coo uruchomi verify-all.js w ramach poniedziałkowego health check. Na później: telemetria skill usage + pamięć scoringowa @pipeline.

---

### [ARTNAPI] 18.03.2026 | OPERACJE | AWS EMAIL PROCESSOR — DEPLOY ROADMAP (AKTYWNY DO ODWOŁANIA)

**KONTEKST:** System kompletny: 13 modułów .mjs (1932 linii) + deploy.sh (1234 linii) + GitHub Actions CI/CD. Faza 2 zbudowana 18.03: canary.mjs (health check 8 integracji), watch-renewal.mjs (Gmail Push renewal), weekly-stats.mjs (raport piątkowy), CloudWatch dashboard+alarmy. Pareto: EventBridge fallback (co 15 min) na start, Gmail Push Pub/Sub za tydzień.

**DEPLOY ROADMAP:**

```
KROK 1 — DEPLOY MVP (~20 min, wymaga credentials):
  cd automatyzacje/aws-email-processor && chmod +x deploy.sh
  ./deploy.sh create-secret    # Gmail OAuth + Notion + Telegram → Secrets Manager
  ./deploy.sh sync-kb          # oferta.md + ghost_styl.md → S3
  ./deploy.sh                  # Full: IAM + S3 + DynamoDB + Lambda + API GW + EventBridge (15 min polling)
  TEST: wyślij maila z innego konta → czekaj 15 min → sprawdź draft w Gmail + alert Telegram

KROK 2 — PO UDANYM TEŚCIE:
  ./deploy.sh extras           # Dashboard + Canary (daily 7:00) + Watch Renewal (co 6 dni) + Weekly Stats (pt 8:00)

KROK 3 — ZA TYDZIEŃ:
  Gmail Push (Google Cloud Pub/Sub) → real-time <2 min latency
  EventBridge wystarczy jako fallback na start

UWAGA IAM: deploy.sh daje dynamodb:Query ale nie Scan.
  ./deploy.sh extras → update_iam_for_extras dodaje inline policy z Scan + CloudWatch perms.
  email-radar.js: ZOSTAW AKTYWNY jako backup przez 7 dni po deploy.
```

**DECYZJA:** Deploy wg roadmapu. Mateusz daje znać gdy gotowe — wtedy zamykamy ten wpis.

**DLACZEGO:** Speed-to-lead <15 min 24/7 bez Maca. Pełny monitoring (canary + dashboard + weekly stats).

**NASTĘPNY KROK:** Mateusz — KROK 1 (create-secret + sync-kb + full deploy + test) — gdy znajdzie 20 min.

---

---

### [ARTNAPI] 17.03.2026 | SPRZEDAŻ | DVI TAURĖS ZAMÓWIENIE POTWIERDZONE

**KONTEKST:** Indrė potwierdziła cenę €2.20/szt, przysłała dane do FV (rekvizitai.vz.lt). 1 paleta (320 szt) po 15.04. Recurring 150-250/mies.

**DECYZJA:** Zamówienie zaakceptowane. FV do wystawienia. Dostawa po 15.04 jak uzgodniono.

**DLACZEGO:** Pierwszy recurring klient z Litwy. €704/zamówienie + monthly potential €330-550.

**NASTĘPNY KROK:** Mateusz — wystaw FV proforma, wyślij dane do przelewu — 18.03

---

---

### [ARTNAPI] 17.03.2026 | STRATEGIA | NOWY SEGMENT — AGENCJE EVENTOWE PL

**KONTEKST:** Recon zidentyfikował 17 agencji eventowych z malowaniem w ofercie (Art Building, malowanie przy winie, warsztaty na płótnach). ICP: kupują 20-50 podobrazi na event, 4-12 eventów/mies.

**DECYZJA:** Agencje eventowe = nowy priorytetowy segment (30% czasu). Pierwszy batch 6 maili wysłany 17.03 (Fabryka Atrakcji, Bartbo, Catalyst, Ekodziela, Actigra, Hula Events). Lista: materialy-artnapi/2026-03-17_recon_batch_eventowe_hurt.md

**DLACZEGO:** Recurring demand (eventy co tydzień), wyższy potencjał konwersji niż WTZ/DK, naturalny fit z produktem (podobrazia 40x50 = core eventu).

**NASTĘPNY KROK:** Monitoring odpowiedzi W3. Batch 2 (Grupa OK, Prosta Kreska, WhatEvent, Paczka Events) → W4.

---

### [ARTNAPI] 17.03.2026 | SPRZEDAŻ | ZMIANA PODEJŚCIA EU OUTREACH — SOFT INTRO

**KONTEKST:** Stare szablony (12.03) szły od razu do cen (EUR 4.04/pc). Dystrybutor widział "kolejny chiński import". Brak personalizacji, brak kontekstu firmy.

**DECYZJA:** Nowe podejście: Template 1 = przedstaw firmę + zapytaj o katalog (ZERO cen). Template 2 (D+7) = katalog PDF + kalkulator. Ceny dopiero gdy dystrybutor SAM pyta. 5 maili Tier 1 wysłanych 17.03.

**DLACZEGO:** Dystrybutor EU chce wiedzieć KIM jesteś zanim zobaczy cenę. Soft intro buduje relację, aggressive pricing ją zabija.

**NASTĘPNY KROK:** Monitor odpowiedzi. Follow-up D+7 z katalogiem = 24.03.

---

---

### [ARTNAPI] 17.03.2026 | OPERACJE | PAPERCONCEPT — PRÓBKI FIZYCZNE ZAMIAST MAILI

**KONTEKST:** PaperConcept (7 lokalizacji, idealna dystrybucja) ignorował maile. Email zamowienia@ trafia do obsługi, nie do decydenta.

**DECYZJA:** Svitlana wysyła fizyczne próbki (PBN + podobrazia) na adres sklepu. Mail z informacją o próbkach przygotowany. Plan B: wizyta osobista w sklepie Warszawa.

**DLACZEGO:** Produkt mówi sam za siebie. Fizyczna próbka > 50 maili.

**NASTĘPNY KROK:** Svitlana potwierdza wysyłkę → wyślij draft "Próbki w drodze". FU po 5-7 dniach.

---

---

### [SYSTEM10H] 16.03.2026 | SPRZEDAŻ | MODUL SOFT — SPOTKANIE Z OLĄ ODBYŁO SIĘ

**KONTEKST:** Spotkanie z Olą (dyr. sprzedaży Modul Soft, polecenie Leny). Demo live: SuperWhisper + Bliźniak demo po ukraińsku. 2 realne scenariusze na żywo. Wykorzystano cytat Natana (Stalton CNC) jako case study.

**WYNIK SPOTKANIA:**
1. **Demo zadziałało** — Ola widziała system w akcji, testowała 2 scenariusze na żywo
2. **Cena 2 999 PLN — zero obiekcji** (potwierdzone kolejny raz)
3. **Brak real case studies** — Ola pytała o konkretne przykłady. Użyto opinii Natana + własne doświadczenia z asystentami.
4. **Modul Soft już używa AI** — właściciel pracuje z Claude, programiści piszą kod w Claude Code. Są blisko metodologii, ale brakuje im systematycznego podejścia (DNA, kontekst, workflow'y).
5. **Omówiono program partnerski** — Ola zainteresowana modelem Faza 1 + Faza 2
6. **Ola mówi trochę po polsku** — komunikacja OK
7. **Next step:** Wysłać link system10h.com + zaktualizowaną prezentację

**TAKTYKA (na przyszłe spotkania):**
- NIE zdradzano implementacji (słowa "skill", "CLAUDE.md" itp.)
- Używano terminów: "kontekst", "wiedza o biznesie", "pamięć operacyjna"
- Rola kontekstu w budowaniu systemu — kluczowy argument

**DECYZJA:** Wysłać materiały, czekać na decyzję Oli + właściciela. Priorytet: ŚREDNI (nie kosztem aktywnego pipeline ARTNAPI).

**NASTĘPNY KROK:** (1) Wysłać email z linkiem + prezentacją (PDF). (2) FU D+7 (~23.03). (3) Jeśli pilot GO → umówić onboarding z Olą.

---

---

### [SYSTEM10H] 15.03.2026 | STRATEGIA | SYSTEM 10H = AI BUSINESS OS (MARKA-PARASOL)

**KONTEKST:** Deep Research Gemini (31 źródeł, TAM 10 nisz PL), analiza architektury kodu (17 plików, 80% reusable), feedback Natan (CNC = dokumentacja, nie sprzedaż), Michał (raporty), Modul Soft (white-label), Krystian (urzędy). "Polski Paradoks AI": 5.9% oficjalna adopcja, 42% Shadow AI, 87% firm z AI = +35% revenue. Wizja: System 10H jako AI Operating System for Business z drabinką produktową, nie klonarnią Bliźniaków per nisza.

**DECYZJE:**
1. **WIZJA GO, BUDOWA GATED:** System 10H = AI Business OS. Bliźniak = entry (Poziom 1). Zespół 10H = Poziom 2. Samograj = Poziom 3. Licencja = Poziom 4. Ale budujemy TYLKO po walidacji sprzedażowej.
2. **Bliźniak bez zmian:** 2 999 PLN, 16 workflow'ów, stylometria. SPRZEDAWAJ — cel 3 klienci @ pełna cena do IV.2026.
3. **Poziom 2 (Zespół 10H, 9 999 PLN) = ZAMROŻONY.** Gate: 5 płacących klientów Bliźniaka (min. 3 @ pełna cena). Szacowany unlock: V-VI.2026.
4. **Modul Soft (18.03) = test modelu Licencji.** Jeśli GO → potwierdza Poziom 3+4.
5. **70/30 rule:** 70% = sprzedaż Bliźniaka. 30% = design wyższych poziomów + pozycjonowanie (NIE budowa).
6. **Strona system10h.com:** Zmień messaging na "AI OS" (hero + "Dla kogo?"). MVP 2h, nie redesign.
7. **Nisza-agnostyczny:** Nie "Bliźniak dla prawników". Jeden produkt, 4 poziomy. Nisza wchodzi na poziomie DNA (pytania Architekta), nie na poziomie brandu.

**DLACZEGO:** 0 klientów @ pełna cena = brak fundamentu na Poziom 2. Wizja prawidłowa, ale budowanie 2. piętra bez sprzedaży 1. = znany wzorzec ENTP (build > sell). Drabinka upsell powstanie organicznie z klientów Bliźniaka.

**NASTĘPNY KROK:** (1) Spotkanie Modul Soft 18.03. (2) 3 klienci Bliźniaka @ 2999 do IV.2026. (3) Natan Blok 2+3 feedback 29.03 → case study. (4) LinkedIn: testuj messaging "AI OS". (5) Strona: hero update W3. (6) Deep Research nisze+kierunki (uruchomiony 15.03 — pełny raport w materialy/).

**MATERIAŁ:** `materialy/2026-03-15_system10h_umbrella_architecture.md` (pełna analiza + DR Gemini)

**⚠️ AKTYWNA REGUŁA — OBOWIĄZUJE OD 15.03.2026:**
System 10H = AI Business OS. KAŻDA sesja z @ceo, @cso, @cmo powinna uwzględniać ten kierunek:
- Messaging: "AI Operating System for Business" (nie "asystent dla handlowców")
- Positioning: DFY multi-agent OS (nie pojedynczy chatbot)
- Konkurencja: ZERO w PL/CEE (potwierdzone DR + competitive intel, 71 źródeł)
- Kanał dystrybucji: AI Biznes Lab community (13k+ przeszkolonych, luka kurs→wdrożenie)
- Gate na nowe produkty: 5 klientów Bliźniaka @ pełna cena → unlock Poziom 2
- Materiały: `2026-03-15_system10h_umbrella_architecture.md` + `2026-03-15_competitive_intelligence_ai_os.md`

---

---

### [SHARED] 15.03.2026 | STRATEGIA | DEEP RESEARCH — AKTYWNE WNIOSKI (skondensowane 18.03)

**AKTYWNE DO WDROŻENIA:**
1. **[ARTNAPI] EU DISTRIBUTORS:** EXW 4.05 EUR → dystr. 6-7.50 EUR → SRP 14.99-21.20 EUR. Oferować DAP/DDP. Red flags: wyłączność bez MPO, 90+ dni, kary bez FM. Materiał: `materialy-artnapi/2026-03-15_eu_distribution_playbook.md`
2. **[SYSTEM10H] COMPETITIVE BATTLECARD:** Tagline: "Gotowy system. Twój styl. Od dnia 1." 5 filarów: DFY>DIY, jednorazowo>SaaS, DNA, 16 scenariuszy, HITL. Zero konkurencji w PL. Materiał: `materialy/2026-03-15_competitive_battlecard.md`

**ZAMROŻONE (warunki odblokowania):**
3. **[SYSTEM10H] PROGRAM PARTNERSKI:** Gate: 5+ klientów, ≥12k/msc, dług <5k, 2 case studies. Q3 2026.
4. **[SYSTEM10H] AI DLA URZĘDÓW:** Gate: 5+ klientów, dług 0, ≥12k/msc, partner B2G. Q4 2026.

**ZARCHIWIZOWANE:** WTZ/DPS/DK playbook (segment zamknięty), Modul Soft prep (spotkanie odbyło się). Materiały w oryginalnych plikach.

---

---

### [SYSTEM10H] 15.03.2026 | PRODUKT | STALTON FEEDBACK BLOK 1 — WNIOSKI

**KONTEKST:** Natan (Stalton CNC, Wrocław) odpowiedział na ankietę feedbackową Bloku 1 (UŻYTKOWANIE, 5 pytań). Zainstalowany 17.02, feedback 15.03 (4 tyg po instalacji).

**DECYZJA:**
1. **Case study na 70%** — hero quote gotowy, real use case (dokumentacja CNC), brakuje Blok 2+3 (wyniki + social proof).
2. **Nowy vertical odkryty:** Bliźniak dla produkcji/CNC — dokumentacja, karty techniczne, ofertowanie. Nie tylko sprzedaż.
3. **Cena 2 999 potwierdzona** — Natan nie wspomina o cenie, feedback pozytywny. Brak presji cenowej.
4. **Onboarding, nie churn** — "Muszę ją rozkołysać" (huśtawka). Weekendy = niskie użycie ale deklaruje wzrost. Nie wymaga interwencji.
5. **Blok 2+3 follow-up:** ~29.03-01.04 (6 tyg po instalacji). Pytania przygotowane.

**DLACZEGO:** Pierwszy realny feedback od płacącego klienta. Potwierdza wartość produktu i otwiera nowy segment (produkcja/CNC).

**NASTĘPNY KROK:** Blok 2+3 follow-up ~29.03. Wykorzystać cytaty w LinkedIn (min 3 posty). Rozważyć vertical pack CNC po case study.

---

### [SHARED] 15.03.2026 | STRATEGIA | OCENA KONCEPTU "AI INBOX ROUTER" (AWS)

**KONTEKST:** User otrzymał od kontaktu z sieci koncept systemu: input→bufor→AI routing→agenci→implementacja. Stack: AWS Lambda + DynamoDB + EventBridge + Claude Code. "8h roboty w 8 minut."

**DECYZJA:**
1. **NIE budować na AWS** — over-engineering przy skali 1 user / 50 leadów. Koszt migracji ~20-30h, zero dodatkowej wartości.
2. **Mamy 90% tego systemu** — 7 skryptów Node.js (morning-scan, email-radar, followup-guardian, restock-reminder, inquiry-router, pipeline-brief, speed-to-lead) pokrywają prawie identyczną architekturę.
3. **TAK jako inspiracja produktowa** — koncept potwierdza architekturę Bliźniaka PRO (4 999 PLN). Nasze rozwiązanie: "Dostajesz gotowe za 1 dzień pracy."
4. **3 inspiracje do wdrożenia:** Unified Action Log (kwiecień), Smart Routing z Claude intent classification (kwiecień-maj), VPS failover $5/mies (maj).

**DLACZEGO:** Walidacja zewnętrzna architektury systemu. Nie trzeba budować od zera — wystarczy doszlifować to co mamy.

**NASTĘPNY KROK:** Tier 2 (kwiecień) — Unified Action Log + Smart Routing. Tier 3 (maj) — VPS failover.

---

---

## === DECYZJE ARTNAPI — AKTYWNE REGUŁY ===

### [ARTNAPI] 23.02 | MONITORING PHOENIX — WEEKLY (od 03.03)

Każdy poniedziałek: sprawdź phoenix-arts.pl dostępność 40×50 i 30×40.

---

### [ARTNAPI] 23.02 | MESSAGING — "ZAWSZE MAMY TOWAR"

Każdy outreach/FU MUSI zawierać: "[X] szt na stanie, wysyłka 24h z polskiego magazynu."

---

### [ARTNAPI] 23.02 | RETENCJA D14 — STANDARD DLA NOWYCH KLIENTÓW

Po 1. zamówieniu → FU D14 "jak się sprawdziło?" Cel: retencja, nie sprzedaż.

---

## ARCHIWUM DECYZJI

| Data | Decyzja | Status |
|------|---------|--------|
| 20.03 | Wpisy ≤13.03 przeniesione (Spotkanie Piotra, CE marking, Negocjacja 350g, Koszty magazynowe, IAI, Umowa CQRE, Modul Soft 2-fazowy) | backup/decyzje_archiwum_2026-03-20.md |
| 18.03 | 12 wpisów ukończonych/zdublowanych (AWS MVP×2, Cennik, WTZ zamkn., Art-Distr., Sesja CEO, CTO Audit, Higiena, Desktop, Stock Mon., Fix EN, Samograj) | backup/decyzje_archiwum_2026-03-18.md |
| 16.03 | Wpisy ≤09.03 przeniesione | backup/decyzje_archiwum_2026-03-16.md |
| 02-03.03 | 6 wpisów (Fix CRLF, Email Radar, Morning Feed, Sesja poniedziałkowa, Daily Brief Telegram, Retail+SHEIN+5 kampanii) | Done/deployed → backup/decyzje_archiwum_2026-03-04.md |
| 26.02 | 10 decyzji operacyjnych/technicznych (Telegram, Infographic, Gemini DR, Notion CRM, Google AI Studio, Security Audit, MailerLite, Sejf API, Content Pack, Wizja 6msc) | Zrealizowane → backup/decyzje_archiwum_2026-03-04.md |
| 25.02 | System 10H+ v6.1 (stan.md + Radar Szans + DR upgrade) | Wdrożone |
| 24.02 | Pilot Deadline Campaign + @pipeline + Analiza Finansowa | Zakończone |
| 20.02 | Zbigniew Strategic Partner Deal 990 PLN | Podwyższone do 2500 PLN (02.03) |
| 20.02 | SD v2.0 + Architekt v3.0 rebuild | Wdrożone ✅ |
| ≤19.02 | Starsze wpisy | backup/decyzje_archiwum_2026-02-24.md |

---

*Ostatnia aktualizacja: 20.03.2026 (Archiwizacja: 10 wpisów ≤13.03 → backup/decyzje_archiwum_2026-03-20.md)*
