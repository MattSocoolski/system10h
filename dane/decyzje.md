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

### [SYSTEM10H] 24.03.2026 | STRATEGIA | EMAIL AUTOPILOT — CONNECTED DOTS Z BLIŹNIAKIEM

**KONTEKST:** Email Autopilot (zbudowany jako processor ArtNapi) przeszedł 4 fazy produktyzacji: bugfixy → security → tenant abstraction → CDK IaC. Kluczowe odkrycie: Bliźniak już tworzy WSZYSTKIE dane których EA potrzebuje (ghost_styl.md, oferta.md, CRM). Zero dodatkowej konfiguracji.

**DECYZJA:** Email Autopilot = drugi produkt recurring w System 10H. Cena: 999 PLN setup + 299 PLN/msc. Wymaga aktywnego Bliźniaka. LTV: Bliźniak + EA = 7 586 PLN/rok (vs 2 999 jednorazowo). Marża 57%.

**DLACZEGO:** Moat: spersonalizowany styl + cennik per klient (nie generic AI jak Lavender). Onboarding 2-3h bo dane z Bliźniaka existują. Recurring revenue rozwiązuje problem jednorazowej sprzedaży.

**NASTĘPNY KROK:** @cso pitch Stalton (CARE + EA bundle) W2 kwi. @cso bundle EA z Modul Soft ofertą B/C. @cmo content "Twój AI sam odpowiada na maile" (case ArtNapi).

### [SYSTEM10H] 24.03.2026 | PRODUKT | EMAIL PROCESSOR — PRODUKTYZACJA JAKO MODUŁ SYSTEM 10H

**KONTEKST:** Email processor ArtNapi (AWS Lambda) przeszedł pełny audyt @ceo + @cto. 22 fixy zdeployowane (security, reliability, guardrails, audit trail, token tracking, GDPR, PII masking, CRM cache, Gmail Push webhook). System production-ready dla single tenant. Audyt wykazał: architektura 4/5, security 3→4/5 (po fixach), reliability 3.5→4/5, skalowalność 1.5→4/5 (tenant abstraction done).

**DECYZJA:** Produktyzacja email processora jako moduł "Email Autopilot" w System 10H. 4 fazy, ~108h. Faza 1 (tenant abstraction) = najwyższy priorytet — bez tego nie da się sprzedać drugiemu klientowi.

**DLACZEGO:** Koszt per email = $0.018. Przy 50 maili/dzień/klient = ~$27/msc. Sprzedaż jako addon do Bliźniaka za 200-500 PLN/msc = wysoka marża. Każdy klient B2B który używa Gmaila + Notion CRM = potencjalny target.

**NASTĘPNY KROK:** @cto Faza 1 — tenant config layer + parametryczne prompty (start 24.03)

### [SHARED] 24.03.2026 | OPERACJE | EMAIL PROCESSOR — STAN PO AUDYCIE

**KONTEKST:** Sesja @cto 24.03 — 22 fixy w 2 commitach. Pełna lista zmian w git log (7ccfec6, b6b4fde).

**DECYZJA:** Zapisano stan systemu. Kluczowe metryki: koszt $0.018/email, 4 Lambdy (main, canary, watch-renewal, weekly-stats), region eu-north-1, Anthropic claude-sonnet-4-6 direct API. Gmail Push webhook aktywny do 31.03, auto-renewal co 6 dni. Canary daily 07:00 UTC. CloudWatch alarm na 0 invocations. Audit trail 90 dni w DynamoDB. GDPR deletion: `node gdpr-delete.mjs email@example.com`.

**NASTĘPNY KROK:** @coo monitoruj canary + weekly stats. @cto kontynuuj produktyzację.

### [SYSTEM10H] 24.03.2026 | STRATEGIA | 6× DEEP RESEARCH — SYNTEZA FINALNA + OCZYSZCZONY PLAN

**KONTEKST:** 6 Deep Research (DR1-6) zamkniętych. Brzegowy reality check ujawnił overengineering — plan oczyszczony do minimum.

**CO ZOSTAJE Z 6 DR (wiedza trwała):**

| Insight | Źródło | Status | Kiedy użyć |
|---------|--------|--------|------------|
| Personalization moat po 50-100 interakcjach = output nie do powtórzenia | DR1 | ✅ DZIAŁA — ghost_styl.md + dna.md | Argument sprzedażowy: "po miesiącu system pisze lepiej niż Ty sam" |
| Accumulated context po 12 mies = "impossible to fire" | DR1 | ✅ DZIAŁA | Argument retencyjny CARE |
| ZERO polskich AI SDR. Okno 18-24 mies | DR1+DR6 | ✅ FAKT | Urgency w sprzedaży i contencie |
| DIY replication = 100-300h + $350-1100/mies | DR1 | ✅ FAKT | Battlecard: "zrób sam" kosztuje więcej |
| Embedded tools retainują 2x (ale CLI = nasz embedded) | DR2 | ⚠️ ZMIENIONA INTERPRETACJA | CLI JEST naszym "embedded" — nie budujemy extension |
| Outcome pricing = otwarte okno, ale wymaga telemetrii | DR2 | ❄️ ZAMROŻONE na Q4+ | Wrócić gdy >10 klientów CARE z danymi |
| Productized service LTV 3-5x vs pure SaaS | DR2 | ✅ POTWIERDZA MODEL | Nie idziemy w SaaS. Narzędzie + wdrożenie |
| "AI Handlowiec" > "Revenue AI" jako nazwa kategorii | DR6 | ✅ PRZYJĘTE | Content, LinkedIn, positioning |
| Tagline: "Autopilot Sprzedaży dla jednoosobowej firmy B2B" | DR6 | ✅ PRZYJĘTE | Landing, carousel, pitch |
| Negacz AI_Sales 10.04 = demand gen za 2-3 mies (nie teraz) | DR6 | ⏰ Q3 2026 | Nie planować wokół tego w Q2 |
| LinkedIn carousels 3-5x reach, polls +206%, 2-3/tydz | DR6 | ✅ UŻYĆ | Gdy case study Stalton gotowe |
| Podcast pitch Jankowski (Mała Wielka Firma) = highest leverage | DR6 | ✅ UŻYĆ | W1-W2 kwiecień |
| FB groups ChatGPT Poland (135k) = ciepły traffic | DR6 | ✅ UŻYĆ | Ongoing, 30 min/tydz |
| CARE: 1 tier 299 PLN (nie 2 tiery) = 30 min call + tuning + scenariusze | DR4 | ⚠️ UPROSZCZONE | Produkt consultingowy, nie SaaS |
| Upsell D+21-30 po pierwszych wynikach | DR4 | ✅ UŻYĆ | Stalton: feedback → upsell |
| Framing: "optimization" nie "maintenance" | DR4 | ✅ UŻYĆ | CARE musi być OPCJONALNY |
| Churn 5-7% monthly, 70% w pierwszych 90 dniach | DR4 | 📊 BENCHMARK | Onboarding = retention engine |
| Chrome MV3 + InboxSDK + WXT + Haiku 4.5 = stack jeśli kiedyś extension | DR5 | ❄️ ZAMROŻONE | Wrócić gdy segment "nie-CLI" się pojawi |
| BYOK + Cloudflare Worker proxy = model bezpieczeństwa | DR5 | ❄️ ZAMROŻONE | j.w. |
| API cost $2.64/user/mies (Haiku cached) | DR5 | 📊 BENCHMARK | Pricing decisions przyszłości |

**CO WYRZUCONE (overengineering):**
- ~~Outcome Tracker v0 (4h Node.js)~~ — brak telemetrii, <10 klientów
- ~~Gmail Extension MVP (60-80h)~~ — CLI jest naszym "embedded"
- ~~Automated ROI raport~~ — brak danych do raportowania
- ~~2 tiery CARE (199/399)~~ → 1 tier 299 PLN (consultingowy)
- ~~Repositioning landing page~~ — brak case study z liczbami
- ~~Pipeline Pulse Web UI~~ — plan.md wystarczy
- ~~"Template refresh" w CARE~~ — busy work

**OCZYSZCZONY PLAN KWIECIEŃ:**

| # | Akcja | Czas | Impact | Kiedy |
|---|-------|------|--------|-------|
| 1 | Ping Natan → case study z liczbami (BLOKUJĄCY) | 30 min | Odblokowuje content | TERAZ |
| 2 | CARE spec: "299/mies = 30 min call + tuning + scenariusze" | 1h | Recurring revenue | W1 |
| 3 | Upsell CARE → Stalton | 30 min | Pierwszy recurring klient | W1 (po feedbacku) |
| 4 | Domknij Modul Soft | 2h | 2 999-21 500 PLN | W1-W2 |
| 5 | Diagnoza: dlaczego SD→Demo = 0% konwersja | 2h | Naprawia lejek | W1 |
| 6 | LinkedIn carousel Stalton (PO case study) | 1.5h | Inbound leads | Gdy #1 done |
| 7 | Podcast pitch Jankowski (Mała Wielka Firma) | 30 min | 40k+ listeners | W2 |
| **Total** | | **~8h** | | |

**STATUS:** ✅ RESEARCH PHASE DONE. EXECUTION = 8h w kwiecień W1-W2. Reszta = sprzedaż.

**Źródła:** materialy/2026-03-24_moat_strategy_synthesis.md + materialy/2026-03-24_DR4-6_synthesis.md

---

### [SYSTEM10H] 24.03.2026 | OPERACJE | PLAN WYKONAWCZY — OCZYSZCZONY (post-reality check)

**KONTEKST:** Plan Hybrid (D) przeszedł brzegowy reality check. Wyrzucono overengineering. Zostało 8h realnej pracy + sprzedaż.

**WYRZUCONE (z uzasadnieniem):**
- ~~Gmail Extension 60-80h~~ — CLI jest naszym "embedded". Klienci uczą się terminala.
- ~~Outcome Tracker 4h~~ — <10 klientów, brak telemetrii, premature automation
- ~~2 tiery CARE~~ — 1 tier wystarczy. Consultingowy model, nie SaaS
- ~~Onboarding checklista 3h~~ — z <10 klientami = rozmowa telefoniczna
- ~~Repositioning landing~~ — brak case study z liczbami
- ~~Automated ROI raport~~ — klient wie lepiej ile czasu zaoszczędził

**CO ZOSTAJE (8h, kwiecień W1-W2):**
1. Ping Natan → case study (30 min) — BLOKUJĄCY
2. CARE spec 1 tier 299 PLN (1h)
3. Upsell CARE → Stalton (30 min)
4. Domknij Modul Soft (2h)
5. Diagnoza SD→Demo 0% konwersja (2h)
6. LinkedIn carousel Stalton — po case study (1.5h)
7. Podcast pitch Jankowski (30 min)

**STATUS:** ✅ PLAN OCZYSZCZONY. 8h pracy + sprzedaż. Reszta czasu = demo + follow-upy + ArtNapi.

---

### [SYSTEM10H] 24.03.2026 | STRATEGIA | MOAT STRATEGY — PLAN 3 FAZ (post-Deep Research)

**KONTEKST:** SaaSpocalypse Scanner: 97/100 "replaceable". Deep Research (3 raporty Gemini, 24.03) potwierdził: moat techniczny = bliski zeru, ALE: (1) personalization depth po 50-100 interakcjach tworzy output nie do powtórzenia (Oxford/Nature 2025), (2) accumulated context po 12 mies = "impossible to fire" (Merantix Capital), (3) polska luka: 4.9% adopcja AI w SME, ZERO polskich AI SDR, white space na "Revenue AI". 966 AI wrapperów padło w 2024, ale Cursor ($2B ARR), Gong ($300M+ ARR), Clay ($100M+ ARR) przeżyły — ich wspólny wzorzec: deep integration + proprietary data + workflow orchestration.

**DECYZJA:** Plan 3-fazowy. Rekomendacja: Hybrid (D) — Faza 1+2 równolegle.
- **Faza 1 (Q2 2026) FORTYFIKACJA:** outcome dashboard (track drafts/follow-ups/pipeline), 30/90/180 onboarding plan, recurring tier "CARE" PLN 299/mies, repositioning z "asystent AI" → "System Przychodu"
- **Faza 2 (Q3 2026) INTEGRACJA:** Gmail Chrome Extension (embedded = 2x retention), CRM native sync (Pipedrive/HubSpot), Pipeline Pulse web UI
- **Faza 3 (Q4 2026+) MOAT:** outcome-based pricing pilot (base + per-meeting fee), Polish B2B language layer (95%+ vs 80% generic), "Revenue AI" category creation

**DLACZEGO:** Okno 12-18 mies zanim AI commoditize się do poziomu laika. Faza 1 daje revenue uplift natychmiast. Faza 2 daje 2x retention. Razem = 6-mies head start.

**NASTĘPNY KROK:** Faza 1 (Q2): outcome dashboard + onboarding plan + tier CARE + repositioning. Równolegle: start Fazy 2 (Gmail extension).

**STATUS:** ✅ DECYZJA: OPCJA D (HYBRID) — zatwierdzona 24.03.2026

---

### [SYSTEM10H] 24.03.2026 | PRODUKT | LANDING PAGE PL+UA — UPROSZCZENIE JĘZYKA

**KONTEKST:** Audyt tekstów landing page wykazał żargon niezrozumiały dla nowego odbiorcy: "battle cards", "pipeline pilnowany", "Cold/Warm Outreach", "Briefing pipeline", "Deep Research", "hookiem". Sekcja 18:00 miała błąd logiczny ("czeka 5 dni" zamiast informacji kto potrzebuje uwagi dziś). Wersja UA miała błędy gramatyczne ("звати"→"звуть", "правиш"→"виправляєш").

**DECYZJA:** Pełna przeróbka żargonu na obu wersjach językowych (PL + UA). 20+ zmian tekstowych. Zdeployowano 24.03.

**DLACZEGO:** Klient docelowy to przedsiębiorca/handlowiec bez tła AI — musi zrozumieć różnicę bez słownika.

**NASTĘPNY KROK:** DONE — zdeployowane.

---

### [ARTNAPI] 24.03.2026 | OPERACJE | AWS EMAIL PROCESSOR — ANTHROPIC API + FULL SECURITY AUDIT

**KONTEKST:** AWS Email Processor zdeployowany 23.03, ale Bedrock quota=0 (konto za nowe, AWS odmówił increase — "build more account history"). Zero auto-draftów od deployu. Canary crashował (brak s3.mjs w ZIP). Audit ujawnił 6 FAIL infra + 3 HIGH security.

**DECYZJA:**
1. Bedrock → Anthropic API direct (ten sam model Claude Sonnet 4.6, bez AWS proxy)
2. Pełny audit: 13 fixów w 3 tierach (infra + security + cleanup)
3. Wyłączenie 5 lokalnych LaunchAgentów (email-radar, inquiry-router, morning-scan, followup-guardian, pipeline-brief) — zastąpione przez AWS Lambda lub redundantne
4. Bedrock zamrożony do czasu dojrzenia konta AWS (min. 1 billing cycle)

**DLACZEGO:** Bedrock chicken-and-egg (quota=0 → brak historii → brak quota). Anthropic API = ten sam model, zero czekania, identyczny koszt. Vino Europa (270 leadów) wymaga speed-to-lead od zaraz.

**CO WDROŻONO (pełna lista):**
- T1: DynamoDB PITR + deletion protection, SNS subscription (confirmed), disable duplikatów, maskEmail w weekly-stats
- T2: API Gateway throttling (10 req/s), prompt injection mitigation (XML tags + detekcja), cleanup Bedrock z IAM, disable pipeline-brief
- T3: Lambda arm64 (Graviton, -20% kosztów), 3 nowe CloudWatch alarms, deploy.sh update

**STAN:** Canary 7/7 OK. System production-ready. Koszt ~$10-15/msc.

**NASTĘPNY KROK:** Monitorować pierwszy auto-draft (następny nowy mail). Secrets rotation w osobnej sesji.

---

### [ARTNAPI] 23.03.2026 | STRATEGIA | OPERACJA VINO EUROPA — EKSPANSJA WINE&PAINT EU

**KONTEKST:** Recurring base ~4k szt/msc, cel Piotra 8k. Gap 4k. Wine&paint = proven model (PL 14/16 + CEE zamyka się). Skalowanie na całą Europę = najszybsza ścieżka do 8k.

**DECYZJA:**
1. Wine&paint EU = priorytet #1 od 24.03 (60% czasu prospecting)
2. Telefon OUT — mail/DM jedyne kanały outreach (preferencja usera)
3. @recon Deep Research EU → batch research per kraj → @ghost outreach EN
4. Tier 1: DE, CZ, SK, AT. Tier 2: NL, BE, DK, SE. Tier 3: FR, IT, ES, PT. Tier 4: reszta EU.
5. Cadence bez telefonu: D+0 mail, D+3 mail FU, D+7 mail FU, D+14 mail, D+21 break-up

**DLACZEGO:** Proven model + krótki cykl (7-14d) + recurring = najlepszy ROI na szt czasu prospecting.

**NASTĘPNY KROK:** ✅ DONE research 23.03 (270+ studiów, 140 emaili, 20 krajów). Wave 1 outreach start 24.03 (AT).

---

### [ARTNAPI] 23.03.2026 | OPERACJE | VINO EUROPA — RESEARCH COMPLETED, OUTREACH PLAN

**KONTEKST:** 16 równoległych procesów (6 recon agents + 5 Gemini DR + 4 Claude DR + master merge) w jednej sesji. Wynik: 270+ studiów wine&paint w 20 krajach EU. 140 zweryfikowanych emaili. TAM: €1.9-3.6M/rok.

**DECYZJA:**
1. WAVE SYSTEM: 6 wave po 2 tyg (AT → NL/BE → FR → IT/ES/HR → Nordics → rest)
2. ENTERPRISE TARGETS (8): osobna ścieżka — ArtNight, drink&paint, Happy Paint FR, La Petite Académie FR, Paint'n Sip NO, Paint&Party FI, Wine Gogh ES, ArtPub NL
3. CANVAS SIZE: oferujemy 30x40 AND 40x50 (30x40 dominuje DACH+Nordics, 40x50 FR/ES/IT/UK)
4. PRICING EU: EXW PLN → dodać flat shipping EUR per kraj. Cennik EUR na stronie/w katalogu.
5. AUTOMATYZACJA: @cto buduje batch draft creator (lista CSV → Gmail drafts) + rozszerza followup-guardian na EU leads
6. PERSONALIZACJA: @ghost pisze per-studio intro line (1 zdanie). Reszta template. Katalog B2B EN załączony.
7. CRM: Enterprise targets → Notion CRM ręcznie. SMB → CSV tracking (za dużo na Notion).
8. HAPPY PAINT INSIGHT: partnerstwo z Pébéo na FARBY. My wchodzimy na CANVAS — nie conflict. Pitch: "complement your Pébéo paints with our canvases."

**DLACZEGO:** Research done. Execution time. Automation = leverage na 270 leadów (ręcznie niemożliwe).

**NASTĘPNY KROK:** 24.03 Wave 1 start — AT TOP 5. @ghost drafty EN. @cto batch draft script.

---

### [ARTNAPI] 23.03.2026 | SPRZEDAŻ | CENNIK EUR (EXW) DLA EU OUTREACH

**KONTEKST:** Cennik PLN all-in z dostawą PL. Dla EU = cena EXW + shipping. Kalkulator B2B na stronie w PLN. Potrzebny cennik EUR.

**DECYZJA:** Cennik EUR uproszczony (bez palet, kartonowo):
- 40x50cm: od €2.40 (120 szt) / €2.09 (320 szt) / €1.90 (640 szt) EXW
- 30x40cm: od €1.73 (120 szt) / €1.57 (480 szt) / €1.42 (960 szt) EXW
- Shipping: flat rate per kraj (do ustalenia z Piotrem — DPD/GLS EU parcel vs paleta)
- Free samples: 5-10 szt per prospect (koszt ~€15-25, ROI jeśli zamówią 120+)

**DLACZEGO:** Studios porównują z Boesner (€3.50-6.00) i lokalnymi hurtowniami. Musimy mówić w EUR, nie PLN.

**NASTĘPNY KROK:** Omówić shipping rates z Piotrem (PON). ✅ 30x40: ~4000 szt na stanie, dostawa VI.2026. ✅ Cennik B2B live na stronie (kalkulator). W outreach = link do kalkulatora + katalog PDF.

---

### [ARTNAPI] 23.03.2026 | SPRZEDAŻ | PIPELINE PULSE — CLEANUP 6 LEADÓW

**KONTEKST:** 33 overdue leadów (~57.5k PLN). 6 leadów >8 dni bez odpowiedzi po wielokrotnym outreach.

**DECYZJA:** Zamrożone w CRM (PAUSED + Zimny): FlashArt (EE), Arte.ee (EE), Fröcskölő (HU), MyPaint (HU), YourArt (HU), Malu Vino (CZ). Break-up mail do Malu Vino.

**DLACZEGO:** Czyścimy pipeline z martwych leadów. Overdue 33→27.

**NASTĘPNY KROK:** Revisit IV-V.2026. Malu Vino break-up draft w Gmail.

---

### [ARTNAPI] 23.03.2026 | SPRZEDAŻ | ARGUMENTY Z PREZENTACJI PRODUKTOWEJ — MAPOWANIE NA SEGMENTY

**KONTEKST:** Nowa Prezentacja Produktowa 2026 (9 stron PDF) zastępuje stary Katalog B2B v3. Zawiera nowe argumenty sprzedażowe do wplecenia w komunikację.

**DECYZJA — MAPOWANIE ARGUMENTÓW:**

| Argument | Segmenty | Jak użyć | Kto wplata |
|----------|----------|----------|------------|
| **"Nr 1 PBN online w Polsce"** | Wszystkie PL (sklepy, hurt, eventy) | Cold mail → 1. akapit lub subject. NIE dla EU (nieistotne). | @ghost |
| **"14 rynków EU"** | CEE, dystrybutorzy EU | Cold mail EN: "shipping to 14 EU markets" — buduje skalę | @ghost |
| **"10 000+ szt na stanie"** | WSZYSTKIE | Zamieninik za dokładne stany. "Ponad 10 000 szt, wysyłka 24h." | @ghost, @pipeline |
| **Drexel University (75% stres)** | Eventy, wine&paint, agencje, hotele SPA | Hook: "Badania Drexel University: 45 min malowania obniża stres u 75% ludzi." Źródło: Kaimal, Ray & Muniz 2016 | @ghost, @cmo (LinkedIn) |
| **PBN w tubie (3× na palecie)** | Dystrybutorzy, hurtownie, sieci | Argument logistyczny: "75 szt/karton, 3× więcej na palecie vs format z ramą" | @cso, @ghost |
| **"Shelf-ready packaging"** | Retail (Empik, Smyk, PBS Connect) | Tylko do sieci — potwierdza gotowość półkową | @cso |
| **"Próbki gratis"** | WSZYSTKIE nowe leady | CTA: "Chętnie prześlę próbki gratis" — w każdym cold mailu | @ghost, @pipeline |
| **7 modeli sztalug** | Sklepy plastyczne, hurtownie | Cross-sell/upsell: "7 modeli od 28cm do 175cm" | @cso |

**REGUŁY UŻYCIA:**
- **PL leady:** "Nr 1 PBN online w Polsce" + "10 000+ szt" + "próbki gratis"
- **EU leady:** "14 rynków EU" + "10 000+ szt" + "próbki gratis"
- **Eventy/wine&paint:** Drexel University + "próbki gratis" + "470+ wzorów"
- **Dystrybutorzy:** PBN w tubie (logistyka) + "14 rynków" + certyfikaty
- **Retail/sieci:** Shelf-ready + certyfikaty (FSC, BSCI, CE, EN71, REACH) + EAN

**LUKA:** 3 sztalugi bez cen w oferta.md (studyjna 175cm, składana 45-76cm, mini S 28cm). Do uzupełnienia z Piotrem.

**NASTĘPNY KROK:** @ghost wplata argumenty w bieżące drafty. @cmo: post LinkedIn z Drexel University data.

---

### [ARTNAPI] Prezentacja Produktowa 2026 — standard załączników (23.03.2026, update)
**Decyzja:** Od teraz KAŻDY cold mail i follow-up zawiera:
- **PL leady:** Sell Sheet PL + Prezentacja Produktowa PL (9 stron, 12.2 MB)
- **EU/EN leady:** Katalog B2B EN (15 MB)
- Pliki: `/Users/mateuszsokolski/Desktop/ARTNAPI/FINAL_B2B_2026/PDF/PL/` i `EN/`
- **Prezentacja Produktowa ZASTĘPUJE stary Katalog B2B v3 (11 stron)** — potwierdzenie usera 23.03.
**Status:** AKTYWNA

---

---

### ZARCHIWIZOWANE 24.03.2026

Wpisy 15-21.03 → `backup/decyzje_2026-03-24_pre-higiena.md`

**Kluczowe info z archiwum (skrót):**
- **[SYSTEM10H] AI Business OS (15.03):** Wizja drabinki 4 poziomów, gate 5 klientów. ⚠️ MESSAGING SUPERSEDED: "AI OS" → "AI Handlowiec" (DR6, 24.03)
- **[SYSTEM10H] Stalton feedback Blok 1 (15.03):** Case study 70%, Blok 2+3 ~29.03
- **[SHARED] Network Agent (21.03):** 3 akcje: Musiał (demo feedback), Dziejma (audyt e-commerce), Gosia+Karolczak (spotkania)
- **[SHARED] Morning Chain + CRM Auto-Sync (20.03):** DEPLOYED. LaunchAgent do zainstalowania.
- **[ARTNAPI] DVI Taurės (17.03):** FV do wystawienia, dostawa po 15.04
- **[ARTNAPI] Agencje eventowe (17.03):** Batch 1 wysłany, batch 2 → W4
- **[ARTNAPI] PaperConcept (17.03):** Próbki fizyczne w drodze
- **Zamrożone:** Program partnerski (Q3), AI urzędy (Q4), Pitch Deck (Q4)

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
