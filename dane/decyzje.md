# DECYZJE - BAZA WIEDZY

## ZASADY
- NAJNOWSZE NA GÓRZE
- CO TYDZIEŃ PRZEJRZYJ
- TAGUJ KAŻDY WPIS: [ARTNAPI] / [SYSTEM10H] / [SHARED]
- LIMIT: ≤100 aktywnych wpisów. Wpisy >30 dni → backup/decyzje_archiwum_YYYY-MM.md

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

### [SYSTEM10H] 04.03.2026 | STRATEGIA | KRYSTIAN SZCZYPEK — AGENCI AI DLA URZĘDÓW (KPO)

**KONTEKST:** Krystian Szczypek prowadzi szkolenia KPO w urzędach Pomorskiego. Urzędnicy widzą potencjał AI (dokumenty, analiza wniosków). Krystian proponuje: on sprzedaje i analizuje, Mateusz buduje agentów. Budżety KPO muszą być wydane, EU AI Act (sierpień 2026) daje urgency. CEO analiza: Bliźniak 830 PLN/h vs 175-470 PLN/h na urzędach — ale recurring + skala to kompensuje.

**DECYZJA:** TAK, warunkowo:
1. **Max 5h/tyg** — nie może zjadać pipeline'u handlowców B2B (System 10H = priorytet)
2. **Demo sam** — Mateusz przygotowuje demo na sztucznych danych (2-3h), NIE angażuj Kamila na tym etapie
3. **Kamil dopiero Faza 3** — techniczne wdrożenie cloud/Vertex AI, nie wcześniej
4. **Revenue split do ustalenia** z Krystianem (propozycja: 60/40 lub 70/30 na korzyść tech)
5. **Gate:** Krystian MUSI dostarczyć konkretny pipeline (ile urzędów, budżety, timeline) ZANIM Mateusz zainwestuje więcej niż demo

**DLACZEGO:** KPO budżety muszą być wydane = popyt realny. Krystian robi sprzedaż = Mateusz nie traci czasu na prospecting. Recurring (abonament 2-5k/msc). Ryzyko niskie przy 5h/tyg cap.

**NASTĘPNY KROK:** Wysłać Krystianowi listę pytań do ustalenia przed następnym spotkaniem → @mateusz, ten tydzień.

---

### [SYSTEM10H] 04.03.2026 | SPRZEDAŻ + FINANSE | KAMIL ANDRUSZ / IAI — PROWIZJA 15% ZA NAPI SP. Z O.O.

**KONTEKST:** Piotr (prywatnie) wspomniał o potrzebie Napi sp. z o.o. na automatyzację CS. Mateusz skontaktował Kamila Andruszu (CQRE) z Napi. Kamil złożył ofertę: Chatwoot + n8n + AI, 75-100k PLN. Mateusz = finder/introducer. Oferta ważna ~30 dni od 25.02 (deadline ~27.03).

**DECYZJA:** TAK, natychmiast:
1. **Prowizja:** 15% netto od wartości kontraktu Kamila z Napi
2. **Zakres:** Finder's fee za wprowadzenie + facilitację kontaktu
3. **Formalizacja:** Proste ustalenie na piśmie (mail/wiadomość) — wysłać Kamilowi DZIŚ
4. **Szacunek:** 15% × 75-100k = **11 250-15 000 PLN** (pasywny przychód, zero pracy technicznej)

**DLACZEGO:** Najlepszy ROI w portfolio (0h pracy technicznej → 11-15k PLN). Buduje relację z Kamilem na przyszłe deale. Deadline oferty ~27.03 — trzeba sformalizować TERAZ.

**NASTĘPNY KROK:** Wysłać Kamilowi ustalenie prowizyjne na piśmie (15% netto) → @mateusz, DZIŚ.

---

### [SYSTEM10H] 04.03.2026 | PRODUKT + SPRZEDAŻ | BLIŹNIAK RAPORTOWY — MICHAŁ GAWLIK (1 000 PLN)

**KONTEKST:** Michał Gawlik (copywriter, agencja) chce generować wizualne raporty PDF (SEO, blog, social) dla swoich klientów. Pivot z pełnego backendu → "Bliźniak Raportowy" w Claude Code (Michał ma subskrypcję). WhatsApp wysłany 04.03.

**DECYZJA:**
1. **Model:** Bliźniak Raportowy (Claude Code Project) — dna-raporty.md + szablony HTML + SKILL.md + pdf.sh. Zero backendu, zero serwera.
2. **Cena:** 1 000 PLN netto (decyzja usera). Scope: dna + 2 szablony raportów + skill + szkolenie. Pracy na 2-3h.
3. **Recurring:** Każdy dodatkowy szablon = osobna wycena.
4. **Status:** WhatsApp WYSŁANY. Czekamy na odpowiedź Michała.

**DLACZEGO:** Minimalny nakład pracy (2-3h), buduje case study dla linii "Bliźniak [branża]", potencjał na recurring z kolejnych szablonów.

**NASTĘPNY KROK:** Czekać na odpowiedź Michała → call 15 min → zebrać dane (branding, typy raportów, przykłady) → zbudować.

---

### [SHARED] 03.03.2026 | OPERACJE | FIX: ASYSTENT.COMMAND + GEMINI MCP RECONNECT

**KONTEKST:** Asystent.command nie odpalał się z Desktopu. Gemini MCP pokazywał "Failed to reconnect".

**DECYZJA:** (1) Naprawiony Asystent.command — miał windowsowe CRLF line endings (`\r\n`), zamienione na unix (`\n`). (2) Gemini MCP (`@rlabs-inc/gemini-mcp`) brakowało w konfiguracji — dodany ponownie przez `claude mcp add` z kluczem z .env.

**DLACZEGO:** Oba narzędzia są krytyczne do codziennej pracy. Asystent.command to główne wejście, Gemini MCP to deep research.

**NASTĘPNY KROK:** Po restarcie sesji sprawdzić `/mcp` → gemini: connected. Done.

---

### [SHARED] 03.03.2026 | OPERACJE | ŻELAZNA ZASADA: @GHOST JAKO GATEKEEPER KOMUNIKACJI

**KONTEKST:** User stwierdzil, że żadna komunikacja wychodząca do klientów nie może pomijać @ghost. Dotyczy wszystkich asystentów i automatyzacji.

**DECYZJA:** @ghost (ghost_styl.md) jest obowiązkowym gatekeeperem KAŻDEJ komunikacji wychodzącej. @cso/@pipeline/@cmo generują strategię — finalny tekst ZAWSZE przez @ghost. Automatyzacje (email-radar.js) MUSZĄ używać ghost_styl.md jako system prompt.

**DLACZEGO:** Spójność głosu marki. Każdy mail/DM musi brzmieć jak Mateusz, nie jak AI.

**NASTĘPNY KROK:** Zasada wpisana do CLAUDE.md, ghost.md, cto.md. Obowiązuje od 03.03.2026.

---

### [ARTNAPI] 03.03.2026 | OPERACJE + TECHNOLOGIA | EMAIL RADAR — AUTO-DRAFT W REAL-TIME

**KONTEKST:** Morning scan daje strategiczny raport rano, ale maile od leadów CRM przychodzą cały dzień. Speed-to-lead wymaga szybszej reakcji.

**DECYZJA:** Zbudowany email-radar.js — co 30 min (8:00-18:00 pn-pt) skanuje Gmail, cross-ref z CRM, Claude Haiku generuje draft w stylu @ghost, draft trafia do Gmail. Telegram alert. User sprawdza i wysyła ręcznie.

**DLACZEGO:** @ceo 9/10, @cso 10/10. Speed-to-lead to pieniądze. ROI w 30 dni.

**NASTĘPNY KROK:** Monitoring logów (automatyzacje/logs/email-radar.log). Review jakości draftów po 1 tyg.

---

### [ARTNAPI] 02.03.2026 | OPERACJE + TECHNOLOGIA | CTO: MORNING FEED — AUTOMATYCZNY WSAD DLA ZESPOŁU

**KONTEKST:** Zbudowano morning-scan.js (Gmail OAuth + Notion CRM API) — skrypt generuje o 8:00 pn-pt plik dane/artnapi/morning-feed.md ze skonsolidowanym raportem: inbox, sent, drafty, mismatche Gmail↔CRM, overdue leady (z emailami/wartościami), pipeline snapshot, rekomendacje.

**DECYZJA:**
1. Morning feed zastępuje Telegram push jako primary output (Telegram opcjonalny: TELEGRAM_MORNING=true)
2. @ceo czyta feed na starcie sesji (Protocol Zero punkt 3) → priorytetyzuje → deleguje @ghost pisanie maili (Opus)
3. Workflow: Feed → @ceo plan → @ghost follow-upy/break-upy → User wysyła z Gmail
4. Naprawiony bug Gmail API (metadataHeaders) — headery teraz działają poprawnie
5. Zaktualizowani agenci: @ceo, @coo, @cso, @ghost, @pipeline, @cto — wszyscy znają morning-feed.md
6. Cloudflare Workers: NIE TERAZ — lokalny cron wystarczy (feed = plik lokalny, laptop jest włączony o 8:00)

**DLACZEGO:** User nie chce Telegramu — woli żeby AI (Opus) dostał structured feed i sam pisał maile zamiast push notyfikacji.

**NASTĘPNY KROK:** @ceo jutro rano przeczyta morning-feed.md → TOP 3 akcje → @ghost pisze follow-upy do overdue leadów (21 leadów, 47.5k PLN)

---

### [SYSTEM10H] 02.03.2026 | SPRZEDAŻ + PRODUKT | CEO: SESJA PONIEDZIAŁKOWA — ZBIGNIEW REFRAME + DEMO OPCJA B + LINKEDIN HIT + REFERENCJE

**KONTEKST:** Pełna sesja poniedziałkowa: COO briefing + CSO soft punch Zbigniew + CEO demo strategy + CMO analiza LinkedIn. Luty zamknięty: 1 220 PLN / 5 000 = 24%. Pipeline 20 000 PLN (korekta Zbigniew). LinkedIn post z kursu AI zażarł (2 537 views, 28 komentarzy). Spotkanie z Krystianem Szczypkiem (projekt AI urzędy).

**DECYZJE:**

1. **ZBIGNIEW — CENA 990→2 500 PLN (FULL).** Koniec strategic partner deal. Następna rozmowa = pełna cena. Uzasadnienie: 990 dewaluuje produkt, Zbigniew ma budżet, social proof od TEDx speakera wart jest full price bez rabatu.

2. **ZBIGNIEW — DEMO REFRAME:** Z "3 statyczne maile" → **"Dzień z Bliźniakiem"** (Pipeline Briefing WF10 + Speed×Scale + Radar Szans WF16). Zbigniew zna AI i potrafi pisać maile — WOW to SYSTEM który myśli za niego, nie kolejny generator tekstu.

3. **DEMO OPCJA B — ZBUDOWANA:** Mock pipeline COMMI (6 leadów + 5 referencji), mock stan.md, Radar Szans z 4 insightami (85k lekarzy, 125 pharma firm, 0 poleceń, content z danymi). Scenariusz 15-20 min. Pliki w projekty/zbigniew/.

4. **PYTANIA REFERENCYJNE — GOTOWE:** 7 pytań do zbierania testimoniali od klientów (projekty/stalton/pytania_referencje.md). Pierwsze użycie: Natan/Stalton ok. 03-10.03. Format na stronę + zgoda na cytat.

5. **GHOST POSTY MARZEC — 12 POSTÓW GOTOWYCH:** Kalendarz PN/ŚR/PT, 5 filarów (Tożsamość, Czas, ROI, Social Proof, Edukacja). 11 do copy-paste + 1 szablon (review). Plik: materialy/2026-03-02_system10h_ghost_posty_marzec.md.

6. **LINKEDIN POST — FORMUŁA KTÓRA DZIAŁA:** Vulnerability hook + bridge statement + done-for-you + jednosłowne CTA ("PROFIL") = 2 537 views, 28 komentarzy (3-12x norma). Replikować w marcu.

7. **PROJEKT AI URZĘDY (KRYSTIAN SZCZYPEK) — DOKUMENTACJA:** Współpraca: Krystian sprzedaż/relacje, Mateusz tech/AI, Kamil Andrusz cloud. 4 fazy: Analiza→Przygotowanie→Budowa→Wdrożenie. Tech: Google Vertex AI + Claude (Frankfurt, RODO). Cennik: warsztat 3-5k, pilot 15-25k, full 40-80k. Plik: materialy/PROJEKT_AI_URZEDY_KRYSTIAN.md. Shiny Object Test: NIE jest shiny JEŚLI Krystian robi sprzedaż.

**PLIKI UTWORZONE:**
- projekty/zbigniew/demo_commi_dna_mini.md (mock DNA)
- projekty/zbigniew/demo_commi_3_outputy.md (3 demo outputy)
- projekty/zbigniew/demo_commi_mock_pipeline.md (mock pipeline)
- projekty/zbigniew/demo_commi_mock_stan.md (mock pamięć operacyjna)
- projekty/zbigniew/demo_commi_radar_szans.md (output Radar Szans)
- projekty/zbigniew/demo_commi_scenariusz.md (scenariusz demo 15-20 min)
- projekty/stalton/pytania_referencje.md (7 pytań referencyjnych)
- materialy/2026-03-02_system10h_ghost_posty_marzec.md (12 postów LI)
- materialy/PROJEKT_AI_URZEDY_KRYSTIAN.md (projekt z Krystianem)

**NASTĘPNY KROK:** (1) Wysłać DM do Zbigniewa, (2) DM do Karoliny Durmaj (overdue), (3) Follow-up Michał Glinka jutro 03.03, (4) Przetestować demo w Claude Projects przed rozmową ze Zbigniewem.

---

### [SYSTEM10H] 26.02.2026 | STRATEGIA + OPERACJE | CEO: PODSUMOWANIE DNIA — INFRASTRUKTURA + WIZJA 6 MSC + GIT

**KONTEKST:** Druga sesja 26.02. Po łańcuchu sprzedażowym (sesja 1) — pełny @cto warsztat: Tech Audit BEFORE/AFTER, audit bezpieczeństwa trybu autonomicznego, wizja systemu na 6 miesięcy (marzec→sierpień), git init.

**DECYZJE:**

1. **TECH AUDIT:** System urósł z 3 MCP → 6 MCP, 0 → 15 narzędzi zinwentaryzowanych, 0 → Notion CRM (15 leadów), 0 → Telegram Bot, 0 → Content Pack (8 plików), 0 → Infographic Generator, 0 → 7 automatyzacji zmapowanych. Wszystko w 1 dzień.
2. **BEZPIECZEŃSTWO TRYBU AUTONOMICZNEGO:** 3 zasady: nie włączaj gdy AI może WYSŁAĆ / USUNĄĆ / WYDAĆ PIENIĄDZE. Rekomendacje: przywrócić skipDangerousModePermissionPrompt, limity API, backup przed sesją, git.
3. **WIZJA 6 MSC (marzec→sierpień):** Od ręcznego (12h/tyg) → autonomicznego (1-2h/tyg). Miesiąc po miesiącu: MAR = system mówi (4 automatyzacje Telegram), KWI = system pisze (Ghost→Resend), MAJ = system sprzedaje (self-service Architekt), CZE = system myśli (Pipeline Intelligence), LIP = system skaluje (partnerzy, recurring), SIE = autonomiczny lejek.
4. **WIEDZA DO ZDOBYCIA:** Poziom 1 (marzec): webhook, cron, git. Poziom 2 (kwiecień-maj): API request, Workers, JSON. Poziom 3 (czerwiec+): scoring, A/B, Stripe. Nauka PRZY budowaniu, nie teoria.
5. **GIT INIT:** Pierwszy punkt kontrolny — 157 plików, 34 658 linii. .env chroniony. Od teraz: commit na koniec każdej sesji.

**DLACZEGO:** Infrastruktura zbudowana w 1 dzień potrzebuje: dokumentacji (tech audit), zabezpieczeń (audit autonomiczny), kierunku (wizja 6 msc), ochrony (git). Bez tego — budujemy na piasku.

**NASTĘPNY KROK:** CZ 27.02 — WYŚLIJ DM do Zbigniewa (KRYTYCZNY) + przygotuj demo COMMI + post "Pilot Bliźniaka". MARZEC TYD 1 — @cto buduje Speed-to-Lead Alert (#1) + Poranny Pipeline Brief (#2).

---

### [SYSTEM10H] 26.02.2026 | SPRZEDAŻ + MARKETING | CEO: ŁAŃCUCH SPRZEDAŻOWY + CONTENT PACK TYDZIEŃ 03-14.03

**KONTEKST:** Pełny łańcuch: CEO→CSO→Ghost→CTO→CEO. Jednocześnie Content Machine + Ghost wygenerowały pakiet contentu na 2 tygodnie (5 postów LI + 3 infografiki + 1 newsletter + kalendarz publikacji).

**DECYZJE:**

1. **#1 ZADANIE SPRZEDAŻOWE:** Zbigniew Kowalski / COMMI — close demo do PT 28.02, 990 PLN Strategic Partner Deal.
2. **PLAN SPRZEDAŻOWY (@cso):** DM nudge DZIŚ → live demo CZ/PT (3 workflow'y COMMI: outreach kliniki, follow-up, ofertowanie) → close na demo → backup PT "ostatni dzień".
3. **MAIL GHOST:** Przeredagowany nudge DM w stylu Mateusza — "Demo pod COMMI — czwartek czy piątek?" Ton: ciepły, osobisty, z deadline'em pilota.
4. **NARZĘDZIA (@cto):** Wysyłka manualna (LinkedIn DM). Do automatyzacji w marcu: auto-follow-up reminder, Ghost→Resend pipeline, Speed-to-Lead alert, post-demo sequence.
5. **CONTENT PACK (materialy/content_pack/):** 5 postów LI (5 marketing angles), 3 infografiki Nano Banan Pro, 1 newsletter, kalendarz 03-14.03. Publikacja od PN 03.03.

**DLACZEGO:** Zbigniew to jedyny deal z deadline'em (28.02) + strategiczna wartość (testimonial TEDx + 3 intro = 7 500 PLN pipeline). Content pack na 2 tygodnie zabezpiecza pipeline leadów na marzec.

**NASTĘPNY KROK:** DZIŚ (ŚR 26.02) — wyślij DM nudge do Zbigniewa (mail @ghost) + opublikuj post "Pilot Bliźniaka" + przygotuj terminal z danymi COMMI na demo.

---

### [SYSTEM10H] 26.02.2026 | STRATEGIA | CEO + CTO: TELEGRAM BOT (ULTRON) — MAPA AUTOMATYZACJI SYSTEMU

**KONTEKST:** @cto podłączył Telegram Bot (Ultron, @MattJarvis_Bot) do systemu. Token w .env, chat_id: 1304598782, test wysyłki OK. Telegram to brakujący element — kanał PUSH w real-time. Do tej pory system działał na PULL (user musiał sam sprawdzać). Teraz system może SZUKAĆ usera. CEO + CTO zmapowali 7 automatyzacji z istniejących 15 narzędzi.

**DECYZJE:**

1. **TELEGRAM = CENTRALNY KANAŁ PUSH** dla całego zespołu asystentów. Każdy asystent zyskuje możliwość wysyłania alertów/briefów na telefon usera.

2. **7 AUTOMATYZACJI — ROADMAP BUDOWY:**

| # | Automatyzacja | Narzędzia | Efekt | Czas | Priorytet |
|---|--------------|-----------|-------|------|-----------|
| 1 | Speed-to-Lead Alert | MailerLite → CF Worker → Telegram | SD signup → push 5 sek → 100× konwersja | 30 min | TYDZIEŃ 1 |
| 2 | Poranny Pipeline Brief | Notion CRM → cron 9:30 → Telegram | Brief na telefonie przed Golden Hour | 45 min | TYDZIEŃ 1 |
| 3 | Follow-up Reminder | Notion CRM (daty) → cron → Telegram | "D+3 dla Rafała — wysłać nudge?" | 30 min | TYDZIEŃ 2 |
| 4 | Calendly → Demo Prep | Calendly webhook → Telegram | "🔥 Audyt AI za 2h — przygotuj demo!" | 1h | MARZEC |
| 5 | Content Calendar Push | Notion → cron → Telegram | "Dziś post #04 — opublikuj o 8:30" | 30 min | TYDZIEŃ 2 |
| 6 | Auto Follow-up Chain | Pipeline+Ghost+Resend+Telegram | System pisze mail, wysyła, raportuje | 2h | MARZEC |
| 7 | Revenue Dashboard | Notion CRM → obliczenia → Telegram pt. 18:00 | Pipeline Velocity, ważona wartość, tydzień vs cel | 1h | MARZEC |

3. **ROZKŁAD NA ZESPÓŁ:**
   - @pipeline → Speed-to-Lead alert, follow-up reminders, poranny brief
   - @cso → alert "NOWY BOOKING" z Calendly, karta leada przed demo
   - @cmo → push "opublikuj post X", alert engagement spike
   - @coo → poranny plan dnia o 9:00, wieczorny debrief
   - @content → "Deep Research gotowy — karty w Notion"
   - @ghost → "Draft follow-upu gotowy — sprawdź i wyślij"

4. **KOLEJNOŚĆ BUDOWY:**
   - TYDZIEŃ 1 (do pt 28.02): #1 Speed-to-Lead + #2 Pipeline Brief
   - TYDZIEŃ 2 (marzec 1. tydz): #3 Follow-up Reminder + #5 Content Push
   - MARZEC: #4 Calendly, #6 Auto Follow-up, #7 Dashboard

**DLACZEGO:** Telegram zmienia system z PULL (user sprawdza) na PUSH (system informuje). Speed-to-Lead Alert (#1) to jedyna automatyzacja która BEZPOŚREDNIO generuje przychód — lead → push 5 sek → reakcja 5 min → 100× konwersja. Koszt: $0/msc (Telegram Bot API darmowe).

**NASTĘPNY KROK:** @cto buduje #1 Speed-to-Lead Alert (30 min, MailerLite webhook → Cloudflare Worker → Telegram push).

---

### [SYSTEM10H] 26.02.2026 | STRATEGIA | CEO: INFOGRAPHIC GENERATOR — POTENCJAŁ DLA @CSO + @CMO

**KONTEKST:** @cto zbudował agenta „Infographic Generator" — skrypt Python, jedno kliknięcie (URUCHOM.command), 10 infografik co minutę przez Nano Banana Pro (Gemini). Koszt ~$0.40-1.00 za paczkę. Pierwsza paczka wygenerowana — 10 grafik z wartością dla handlowca B2B (checklisty, statystyki, frameworki, porównania). Teraz: jak to wprzęgnąć w sprzedaż i marketing?

**DECYZJE (POTENCJAŁ — DO WDROŻENIA):**

1. **@CMO — LinkedIn content z infografikami:**
   - 1 infografika/dzień jako post LinkedIn (posty z obrazem = 2-3x zasięg)
   - Carousel z 5 grafik = najwyższy engagement na LI
   - Dołączać do emaili MailerLite (wyższy CTR)
   - "Bonus pack" po SD — 3 infografiki z tipami jako lead magnet wzmocnienie

2. **@CSO — infografiki jako broń sprzedażowa:**
   - Follow-up z WARTOŚCIĄ: zamiast pustego "co tam" → infografika + 1 zdanie
   - Cold DM na LinkedIn: "Zrobiłem tę grafikę — pomyślałem o Tobie" = Pattern Interrupt wizualny
   - Obiekcja "nie mam czasu" → wyślij grafikę #02 (gdzie idzie czas) lub #03 (solo vs AI)
   - Value Bridge po SD: "Twój wynik SD + ta statystyka = warto porozmawiać"

3. **Plan publikacji pierwszej paczki (5 dni):**
   - ŚR 26.02 → LI: #04 (80% dealów po 5+ follow-upach)
   - CZ 27.02 → DM do Zbigniewa: #07 (Speed-to-Lead) + nudge pilot
   - PT 28.02 → LI: #03 (Solo vs AI) — ostatni dzień pilota
   - SO 01.03 → LI: #05 (Golden Hour framework)
   - ND 02.03 → LI: carousel #08 + #10 (checklista + AIDA)

4. **Przyszłe rozszerzenia (BACKLOG):**
   - Nowe paczki tematyczne (np. CRM, negocjacje, obiekcje, pricing)
   - Infografiki personalizowane z imieniem leada do cold DM
   - Auto-generowanie grafik przez @content w ramach content planu
   - Integracja z MailerLite — auto-attach do sekwencji emaili

**DLACZEGO:** Zespół nie miał materiałów wizualnych. Teraz ma fabrykę za $0.40/paczkę. Infografiki z wartością = content marketing + broń sprzedażowa + lead magnet w jednym.

**NASTĘPNY KROK:** @cmo publikuje pierwszą infografikę na LinkedIn DZIŚ (ŚR 26.02, #04). @cso wysyła #07 do Zbigniewa w DM jako nudge pilota.

---

### [SYSTEM10H] 26.02.2026 | OPERACJE | CTO: GEMINI DEEP RESEARCH — PEŁNA INTEGRACJA Z ZESPOŁEM ASYSTENTÓW

**KONTEKST:** Sesja @cto — analiza integracji Gemini Deep Research MCP z asystentami. User wybrał Opcję B (pełna integracja, 4 asystentów). Gemini DR to async multi-step research z cytowaniem źródeł, dostępny przez MCP (gemini-deep-research, gemini-check-research, gemini-research-followup).

**DECYZJE:**
1. **@content (contentmachine.md)** — nowa opcja [6] AUTO-RESEARCH: research + plan + content AUTOMATYCZNIE. 7-krokowy workflow (czytaj pliki → buduj query → gemini-deep-research → check status → przetwórz → plan contentu → generuj treść).
2. **@cso (cso.md)** — sekcja [5] DEEP RESEARCH: dodany TRYB A (automatyczny, Gemini MCP) obok TRYB B (ręczny, przeglądarka). Domyślnie TRYB A.
3. **@cmo (cmo.md)** — KROK 1 Content Machine: dodany TRYB A (automatyczny) dla deep research treści. Fallback na TRYB B jeśli MCP niedostępny.
4. **@pipeline (pipeline.md)** — nowa sekcja AUTO-RESEARCH: research leada PRZED outreachem (firma, BANT, tech stack, bóle). Integracja z Pipeline Review (proponuje research gdy brakuje danych BANT).
5. **CLAUDE.md** — 4 nowe integracje w tabeli: @content+DR, @cso+DR, @cmo+DR, @pipeline+DR.
6. **LIMIT KOSZTOWY:** Max 8 deep research/msc (budżet $10/msc na całe Gemini API — obrazy + research + queries). Szacunkowo $3-5/msc przy normalnym użyciu.
7. **ZASADA:** Nie uruchamiać automatycznych/cron skryptów z Gemini DR. Tylko ręczne / na żądanie usera.

**DLACZEGO:** Eliminuje manualne kopiowanie promptów do przeglądarki. Asystenci mają dostęp do live researchu bez opuszczania terminala. 4 use case'y: content trendy (@content/@cmo), rynek leada (@cso), research BANT (@pipeline).

**NASTĘPNY KROK:** Przetestować pełny flow: @content opcja 6 → auto-research → plan contentu → post. Monitorować koszty w Google Cloud Console (alert $10/msc już ustawiony).

---

### [SYSTEM10H] 26.02.2026 | OPERACJE | CTO: NOTION CRM SYSTEM 10H+ (PIPELINE W NOTION)

**KONTEKST:** Sesja @cto "Łącz Kropki" — scan 10 okazji integracyjnych. Pipeline prowadzony w plan.md (plik tekstowy, 250+ linii, ręczna edycja) = podatny na błędy, brak widoku Kanban, brak filtrów. Notion MCP już podłączony ale niewykorzystany. Zbudowano CRM jako bazę danych Notion z importem całego pipeline'u.

**DECYZJE:**
1. **Baza danych "CRM System 10h+"** — STWORZONA w Notion (MCP). 14 kolumn: Lead, Firma, Status, SD Status, Wartość PLN, BANT Score, Priorytet (Gorący/Ciepły/Zimny/Zamrożony), Źródło, Ostatni kontakt, Follow-up, Następny krok, Email, Phone, LinkedIn, Notatki.
2. **15 leadów zaimportowanych** — cały pipeline z plan.md przeniesiony do Notion z pełnymi danymi (daty, notatki, wartości, źródła, SD status).
3. **Pipeline value w CRM:** 46 710 PLN (aktywne + zamrożone).
4. **Gorące leady (4):** Michał Glinka (SD done), Rafał Knap (SD done), Zbigniew Kowalski (990 PLN, deadline 28.02), Piotr/Artnapi (integrator 20k).
5. **Wąskie gardło potwierdzone:** 5/8 leadów NIE zapisało się na SD (zweryfikowane MailerLite 26.02).
6. **Link:** https://www.notion.so/77ac3d5f9abc4a749598423a7a80f0ce

**DLACZEGO:** Pipeline w pliku .md = nieefektywne. Notion CRM daje: widok Kanban, filtry po priorytecie/SD status, daty follow-upów, aktualizacja przez MCP (asystenci @pipeline/@cso/@ceo mogą czytać/zapisywać). Zero kosztu (Notion MCP już podłączony).

**NASTĘPNY KROK:** User dostosowuje etapy Status w Notion UI (Nowy → Outreach → SD wysłany → SD zrobiony → Demo → Negocjacja → WON/LOST). Rozważyć Telegram Bot (#2 z listy okazji) jako następną integrację.

---

### [SYSTEM10H] 26.02.2026 | OPERACJE | CTO: GOOGLE AI STUDIO — UPGRADE NA PŁATNY PLAN + LIMIT $10/MSC

**KONTEKST:** Gemini MCP (Nano Banan / Nano Banan Pro) nie działał na darmowym tierze (quota exceeded). User zmienił pricing na płatny plan w Google AI Studio. Test po upgrade: generowanie obrazu — działa poprawnie.

**DECYZJE:**
1. **Google AI Studio — płatny plan AKTYWNY.** Test generowania obrazu (1K, photorealistic) — sukces.
2. **Limit wydatków: $10/msc (TWARDY).** User musi ustawić w Google Cloud Console: https://console.cloud.google.com → Billing → Budgets & Alerts → Create Budget → $10/month → alert na 50% ($5), 80% ($8), 100% ($10) → akcja: zatrzymaj billing.
3. **Szacunkowe użycie:** Obrazy Nano Banan (~$0.04/obraz) = ~250 obrazów/msc. Deep Research = preview (ograniczone). Normalne użycie: $2-5/msc.
4. **ZASADA:** Nie uruchamiać automatycznych skryptów z Gemini API (cron + AI = setki requestów = koszty). Tylko ręczne / na żądanie.

**DLACZEGO:** Płatny plan odblokował generowanie obrazów (social media, banery, wizualizacje) i deep research. Limit $10/msc chroni przed niespodziankami.

**NASTĘPNY KROK:** User ustawia budget alert w Google Cloud Console TERAZ (3 progi: 50%/80%/100%). Wygenerować baner LinkedIn (pierwotne zadanie z tej sesji).

---

### [SYSTEM10H] 26.02.2026 | OPERACJE | CTO: AUDIT BEZPIECZEŃSTWA + GEMINI MCP (NANO BANAN PRO + DEEP RESEARCH)

**KONTEKST:** Sesja @cto — pełny audit bezpieczeństwa systemu (klucze, uprawnienia, pliki) + uzupełnienie api-inventory.md + podłączenie Google AI Studio (Gemini) jako MCP do generowania obrazów i deep researchu.

**DECYZJE:**
1. **Audit bezpieczeństwa — 3 naprawy:**
   - `.env` uprawnienia zmienione z 644 → **600** (tylko właściciel)
   - `.gitignore` STWORZONY w katalogu głównym (chroni `.env`, `backup/`, `node_modules/`, `.dev.vars`)
   - Klucze API zweryfikowane — prawdziwe wartości TYLKO w `.env`, nigdzie indziej
2. **api-inventory.md — uzupełniony z 8 → 14 narzędzi:**
   - DODANE: Cloudflare Workers, Cloudflare Turnstile, Calendly, Loom, Google AI Studio
   - ZAKTUALIZOWANE: Cyber Folks (DirectAdmin API, Node.js 12-20, Python, PHP, SSH — zweryfikowane ze screena panelu)
   - Kompletność: 62% → 92%
3. **Google AI Studio — klucz API dodany** do `.env` jako `GOOGLE_AI_STUDIO_API_KEY`
4. **Gemini MCP (`@rlabs-inc/gemini-mcp` v0.8.1) — PODŁĄCZONY.** Audit: MIT, 3 zaufane zależności (@google/genai, @modelcontextprotocol/sdk, zod). 30+ narzędzi: generowanie obrazów (Nano Banan/Pro), deep research, Google Search grounding, code execution, TTS.
5. **Modele obrazów:** Nano Banan (`gemini-2.5-flash-image`, ~$0.039/obraz) + Nano Banan Pro (`gemini-3-pro-image-preview`, jakość studio 4K, preview)
6. **Deep Research:** Agent `deep-research-pro-preview-12-2025` — autonomiczny multi-step research z cytowaniem źródeł

**DLACZEGO:** Audit naprawił 3 luki bezpieczeństwa (uprawnienia .env, brak .gitignore, niekompletny inwentarz). Gemini MCP otwiera generowanie obrazów (social media, wizualizacje) i deep research (rynek, konkurencja) bezpośrednio z terminala.

**NASTĘPNY KROK:** Restart sesji Claude Code → przetestować Gemini MCP (1 obraz Nano Banan + 1 deep research). Zapisać klucze w menedżerze haseł (backup poza komputerem).

---

### [SYSTEM10H] 26.02.2026 | OPERACJE | CTO: MAILERLITE MCP + EXCALIDRAW SKILL + DIAGRAM SYSTEMU

**KONTEKST:** Sesja @cto — weryfikacja integracji MailerLite, audit i instalacja nowego skilla do diagramów, wygenerowanie mapy systemu asystentów.

**DECYZJE:**
1. **MailerLite MCP** — połączenie zweryfikowane i działa (hello@system10h.com, konto #2106531). 4 subskrybentów, 2 grupy (self-discovery: 3 sub/100% open, live_preview: 0 sub), 2 automatyzacje aktywne (self-discovery 13 kroków, Live Preview 5 kroków). Pełny dostęp: subskrybenci, automatyzacje, kampanie, formularze.
2. **Excalidraw skill** — zainstalowany w `~/.claude/skills/excalidraw`. Audit bezpieczeństwa: MIT, 3 zaufane dependencje (roughjs, xmldom, resvg-js), 0 luk, działa lokalnie, nie wysyła danych. Wywołanie: `/excalidraw` + opis diagramu. Output: SVG + PNG w `~/Downloads/Excalidraw/`.
3. **Diagram systemu asystentów** — wygenerowany w 3 formatach: `.excalidraw` (edytowalny na app.excalidraw.com), `.svg`, `.png`. Lokalizacja: `~/Downloads/Excalidraw/`. Zawiera: User → CEO → COO/CSO/CMO/CTO → Pipeline/Content → Ghost + 13 strzałek integracji z CLAUDE.md.

**DLACZEGO:** MailerLite MCP umożliwia zarządzanie mailingiem bezpośrednio z terminala. Excalidraw skill daje szybkie wizualizacje architektury i procesów. Diagram dokumentuje system asystentów dla onboardingu i prezentacji.

**NASTĘPNY KROK:** Wykorzystać MailerLite MCP do weryfikacji SD statusu leadów (kto zrobił/nie zrobił) + excalidraw do wizualizacji lejka sprzedażowego.

---

### [SYSTEM10H] 26.02.2026 | OPERACJE | SEJF API — INWENTARZ NARZĘDZI + RESEND MCP + KLUCZE

**KONTEKST:** Sesja @cto opcja 4 (Sejf API). Nie istniał plik api-inventory.md — klucze rozproszone, brak inwentarza. User podał listę narzędzi: Claude API, Cyber Folks, Resend + już znane: MailerLite, Gmail, Notion, AIBL, LinkedIn. Research 7 narzędzi (API, MCP, docs, koszt).

**DECYZJE:**
1. **dane/api-inventory.md** — STWORZONY. 8 narzędzi zinwentaryzowanych z linkami do docs, instrukcjami gdzie znaleźć klucz, statusem MCP.
2. **Resend MCP** — PODŁĄCZONY (`claude mcp add resend`). Klucz `RESEND_API_KEY` dodany do `.env`. Umożliwia wysyłanie maili transakcyjnych z terminala.
3. **Claude API (Anthropic)** — klucz `ANTHROPIC_API_KEY` dodany do `.env`. Używany przez Live Preview.
4. **Stan .env** — 4 klucze: RESEND_API_KEY, AIBL_NETWORK_TOKEN, MAILERLITE_API_KEY, ANTHROPIC_API_KEY.
5. **Podłączone MCP (łącznie):** MailerLite (działa), Gmail (zarządzany), Notion (zarządzany), Resend (nowy).

**DLACZEGO:** Jeden plik-sejf zamiast rozproszonych kluczy. Resend MCP otwiera automatyzację maili transakcyjnych. Kompletny inwentarz = CTO wie co może łączyć.

**NASTĘPNY KROK:** Po restarcie sesji przetestować Resend MCP (wysłać testowy email). Sprawdzić Cyber Folks API w panelu. Rozważyć automatyzację: Ghost pisze → Resend wysyła.

---

### [SYSTEM10H] 25.02.2026 | PRODUKT | SYSTEM 10H+ v6.1 — STAN.MD + RADAR SZANS + DEEP RESEARCH UPGRADE

**KONTEKST:** Wdrożenie u klientów (Andrzej, Stalton) ujawniło 2 krytyczne luki: (1) AI traci pamięć między sesjami, (2) brak proaktywnego skanowania szans. Zaprojektowano stan.md (pamięć operacyjna) + WF16 Radar Szans. Feedback od Andrzeja (8 punktów) wymusił redesign v2.0 Radaru. 3 deep research (Gemini) dostarczyły: formułę ORI, benchmarki PLN/h, wzorce time sink.

**DECYZJE:**
1. **stan.md** — plik pamięci operacyjnej (7 sekcji: FOKUS, PIPELINE, DECYZJE, BLOKERY, LEKCJE, RADAR LOG, LOG). Auto-read na boot, auto-update po WF, czyszczenie przez WF14.
2. **WF16 Radar Szans v2.0** — 6 kroków: zbierz dane (6 pytań) → dynamiczny skan → anty-radar (PLN/h benchmarki + 5 wzorców time sink P1-P5) → scoring ORI `(R×P×U×Wt)/E` z CVR benchmarkami → wild card → SINGLE PICK output z ORI breakdown.
3. **SKILL.md v6.0→v6.1** (Fala 1+2 z deep research): guided delta w WF10, session-end reminder w Iron Rule #6, stale data flag >14 dni w WF14, dormant discount R×0.8, horyzont efektu jako 6. pytanie.
4. **dna-interviewer v3.0** — generuje stan.md v1.0 pre-filled z danych wywiadu (cold start solved).

**DLACZEGO:** Rozwiązuje #1 problem klientów ("za każdym razem od zera") + dodaje proaktywną wartość (Radar) zamiast czekania na polecenie usera. Feedback Andrzeja zwalidowany deep researchem.

**NASTĘPNY KROK:** Przetestować WF16 ORI na realnych danych klienta + zwalidować stan.md auto-cleanup po 7 dniach.

---

### [SYSTEM10H] 24.02.2026 | MARKETING | PILOT DEADLINE CAMPAIGN ŚR-PT 26-28.02

**KONTEKST:** 4 dni do końca pilota (1 990 PLN, deadline 28.02). 8 aktywnych leadów, 0 demo. CEO ustalił 3 taski na tydzień: Zbigniew demo, pilot deadline messaging, follow-upy D+3. CMO przygotował brief → @content wygenerował 3 deliverables → @ghost wypolerował.

**DECYZJE:**
1. **Post LI ŚR 26.02 (8:30)** — "Pilot Bliźniaka" z CTA "PILOT". ZASTĘPUJE post "AI vs handlowiec" (deadline > edukacja). Plik: materialy/2026-02-26_linkedin_pilot_deadline.md
2. **DM template CZ 27.02** — do Arkadiusza, Julii S-P, Michała W., Krystiana. Plik: materialy/2026-02-27_dm_pilot_deadline.md
3. **Post LI PT 28.02** — "Ostatni dzień pilota", loss aversion. ZASTĘPUJE post "OpenAI agent". Plik: materialy/2026-02-28_linkedin_pilot_ostatni_dzien.md
4. **Przesunięte posty** ("AI vs handlowiec", "OpenAI agent") zostają w materialy/ — do użycia po pilocie.

**DLACZEGO:** Sprzedaż > edukacja w ostatnich 4 dniach pilota. LinkedIn dał 7 inbound leadów z postów — kanał działa, teraz urgency.

**NASTĘPNY KROK:** ŚR 26.02 — post publikuje się 8:30 + Golden Hours: nudge D+3 + check MailerLite + demo prep COMMI.

---

### [SYSTEM10H] 24.02.2026 | OPERACJE | NOWY ASYSTENT @PIPELINE + BACKLOG @DELIVERY I @BIZDEV

**KONTEKST:** Analiza CEO wykazała lukę w zespole asystentów — nikt nie pilnuje nurturingu leadów między generowaniem (@cmo) a zamykaniem (@cso). Wąskie gardło SD→Demo = 0% (0/15). Rozważano 3 opcje: @pipeline, @delivery, @bizdev.

**DECYZJE:**
1. **@pipeline** — ZBUDOWANY (dane/pipeline.md, 430+ linii). Rola: Lead Scoring, Nurturing Sequences, Nudge Drafts, Pipeline Review, Handoff do @cso. Charakter: Aaron Ross + Jeb Blount.
2. **@delivery** — NA PÓŹNIEJ. Delivery Manager / Customer Success. Do budowy gdy będzie 3+ aktywnych wdrożeń jednocześnie (Stalton pending Loom, Lena HOLD, Andrzej in progress).
3. **@bizdev** — NA PÓŹNIEJ. Business Development / Partnerships. Do budowy gdy startuje Faza 3 roadmapu (maj+) — partnerstwa SalesAngels, trenerzy sprzedaży, program partnerski.

**DLACZEGO @PIPELINE TERAZ:** Odblokowanie 0% SD→Demo to najszybsza droga do revenue. 8 leadów z SD = potencjalnie 18 490 PLN. Pipeline Manager zmienia "czekaj i miej nadzieję" w systemowy follow-up.

**NASTĘPNY KROK:** User zatwierdza prompt → integracja z CLAUDE.md i wszystkimi asystentami.

---

### [SYSTEM10H] 24.02.2026 | ANALIZA FINANSOWA CEO — KOREKTA PROJEKCJI

**KONTEKST:** CEO analiza budżetu (budget_2025.xlsx). Dług 18 500 PLN (stan 24.02).

**DECYZJE:**
1. Dług 0 = **LISTOPAD 2026** (nie lipiec — backloaded Ugears WRZ/PAŹ + wakacje)
2. Bliźniak w budżecie: 7 000 PLN (konserwatywne). Każda sprzedaż powyżej = UPSIDE
3. Krytyczne miesiące: SIE-PAŹ (ujemne bilanse). Bliźniak może je zamienić na +
4. Unit economics: marża 98%, break-even 300 PLN/msc, wąskie gardło SD→Demo 0%

**ŹRÓDŁA:** budget_2025.xlsx | **Szczegóły:** backup/ (pełna analiza 3 długów, harmonogramy)
**NASTĘPNY KROK:** Zamknąć Zbigniewa (990 PLN) do PT 28.02.

---

### [SYSTEM10H] 20.02.2026 | ZBIGNIEW KOWALSKI (COMMI) — STRATEGIC PARTNER DEAL 990 PLN

**KONTEKST:**
Rozmowa osobista z Zbigniewem Kowalskim. Ekspert komunikacji medycznej, absolwent Stanford Medicine X (Patient Engagement Design), TEDx speaker, 14 książek, 180 000+ przeszkolonych ludzi, VP Stowarzyszenia Profesjonalnych Mówców PL. Założyciel SaaS COMMI (commi.pro — video messaging lekarz→pacjent). Leży ze sprzedażą COMMI — brak lejka, brak lead magnetów, brak systemu follow-upów. Pytał czy Bliźniak może pomóc w rozwinięciu sprzedaży COMMI.

**DECYZJA:**
1. **Opcja B — STRATEGIC PARTNER DEAL:** 990 PLN (symboliczne) + case study VIDEO + testimonial + **3 ciepłe intro** do jego sieci (mówcy/trenerzy/pharma) + post LI o Bliźniaku
2. **SD wysłany** — sprawdzić wyniki w poniedziałek 23.02
3. **Spotkanie** przyszły tydzień — live demo na terminalu z danymi COMMI (wow effect)
4. **NIE za darmo** — 990 PLN = skin in the game, filtruje poważność

**DLACZEGO STRATEGIC A NIE FULL PRICE:**
- Testimonial od TEDx speakera z 14 książkami = social proof klasy A
- 3 ciepłe intro z sieci 180k = potencjalnie 3 × 2 500 = 7 500 PLN pipeline
- Nowy vertical: mówcy/trenerzy/konsultanci (nie tylko handlowcy B2B)
- 990 PLN > 0 PLN — commitment bez darmowego dewaluowania produktu

**RESEARCH:**
- LinkedIn: linkedin.com/in/zbigniew-kowalski-3943838/
- Strona: zbigniewkowalski.pl
- SaaS: commi.pro
- TEDx: "Przełom w medycynie zależy od Ciebie" (TEDxGdynia)

**NASTĘPNY KROK:** PN 23.02 — sprawdzić SD + ustalić termin spotkania + przygotować demo COMMI na terminalu.

---

---

## === DECYZJE ARTNAPI ===

### [ARTNAPI] 26.02 | OPERACJE | DAILY BRIEF NA TELEGRAM — AUTOMATYCZNY PORANNY RAPORT

**Decyzja:** Zbudować skrypt "Daily Brief" uruchamiany cronem (6:00 lub 9:00) który: (1) sprawdza plan.md → leady z Due = dziś, (2) sprawdza Gmail → nowe odpowiedzi od leadów, (3) wysyła podsumowanie na Telegram Bot. Oszczędność: ~20 min/dzień.

**Dlaczego:** Codzienne FU to #1 driver sprzedaży. Ręczne sprawdzanie plan.md + Gmail = ryzyko zapomnianych follow-upów.

**Status:** DO ZBUDOWANIA — gdy user da zielone światło.

---

### [ARTNAPI] 25.02 | STRATEGIA | RETAIL EXPANSION — 3 KANAŁY (Kaufland online + PBS + Poczta Polska)

**Decyzja:** Uruchomić równolegle 3 ścieżki retail: (1) Kaufland marketplace, (2) PBS Polska jako partner dystrybucyjny, (3) Poczta Polska. Wszystkie zablokowane przez CE marking.

**Dlaczego:** Nadrzędny cel Artnapi = retail. PBS Connect Polska = wspólny dystrybutor Brushme i Ideyki w Kaufland.

**Blokada:** CE marking (Dyrektywa 2009/48/WE) — status NIEZNANY. Zapytanie do Piotra 25.02.

---

### [ARTNAPI] 25.02 | STRATEGIA | KAUFLAND — WEJŚCIE DO RETAIL (nadrzędny cel)

**Decyzja:** Uruchomić ścieżkę wejścia do Kaufland PL z PBN + podobraziami. Brushme i Ideyka już na półkach — kategoria zwalidowana.

**Dlaczego:** Konkurenci już w Kaufland = okno się zamyka. Artnapi ma unikalne atuty: polska marka, 24h restock, podobrazia.

---

### [ARTNAPI] 24.02 | STRATEGIA | SHEIN EUROPE — WARUNKOWE GO

**Decyzja:** SHEIN drop-shipping — GO na test. TYLKO segment WCF/LOW PBN na ramie. COGS 29 PLN brutto. Realizacja: marzec 2026.

**Warunki Piotra:** 5/5 muszą być spełnione przed wystawieniem. Test na 1 ID przed wystawieniem całości.

---

### [ARTNAPI] 24.02 | STRATEGIA | NOWY ASYSTENT @RECON + PARKING KOLEJNYCH

**Decyzja:** Zbudowano @recon (Research & Intelligence). Zaparkowane: @am (Account Manager, Q2 2026), @supply (Supply Chain, gdy >15k szt/mies).

---

### [ARTNAPI] 24.02 | ANALIZA FINANSOWA CFO — LUTY 2026

**Zamówienia luty:** 54 273 PLN (16 zamówień). Prowizja: 4 930 PLN (211% celu). Wynagrodzenie: 11 596 PLN netto. Dług: 18 500 PLN. Nadwyżka: ~7 984 PLN.

---

### [ARTNAPI] 25.02 | CZYSTKA PIPELINE + PODZIAŁ ZADAŃ NA ZESPÓŁ

**Usunięte:** Sztukarnia, Varsztatovnia, CARAMEL, Alkotásutca (ghosting). **Korekty:** HobbySet PAUZA pogodowa, FessNeki próbki wysłane. **Lekcja:** Gmail check PRZED aktualizacją statusów.

---

### [ARTNAPI] 25.02 | POLBAR — KOREKTA CENNIKA RAM A4

**Decyzja:** Poprawiony cennik (50-100: 19,50, 100-299: 18,99, 300+: 18,50). Push białe ramy.

---

### [ARTNAPI] 24.02 | 5 KAMPANII WZROSTU — STRATEGIA + EGZEKUCJA

**Kampanie:** Dzień Kobiet (5-15k), WTZ FU (1-3k), Agencje batch 2 (2-5k), DK batch 1 (1-4k), Phoenix Down (3-10k). Potencjał łączny: 12-37k PLN.

---

### [ARTNAPI] 23.02 | STRATEGIA HOTEL + WINE&PAINT — DEEP RESEARCH

18 firm wine&paint: 4 nasze, 5 pipeline, 9 nowych targetów. Batch 1 wysłany 23.02 (8 firm). Toolkit: materialy-artnapi/outreach_hotele_toolkit.md.

---

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
| 20.02 | SD v2.0 + Architekt v3.0 rebuild (6 Archetypów, GROW, 2-tier output, gate) | Wdrożone ✅ — info w plan.md roadmap |
| 20.02 | Hybrid UX Opcja C (4 kategorie + NL routing, ~7-8h, marzec) | Zaplanowane — info w plan.md roadmap F2 |
| 19.02 | Content Machine krok 2+3 — plan contentu + 4 posty LI (ghost style) | Zastąpione przez 20.02 content plan |
| 17.02 | Pilot Deal 1 990 PLN + Master Plan 11 dni (5 strategii, do 28.02) | Aktywne — w plan.md |
| 17.02 | Feedback Stalton — Architekt "za handlowy" (nic nie zmieniamy, roadmap F2) | Zanotowane |
| 17.02 | Baza marketingowa — audit + quick wins (post "komentarz=SD", CTA w postach, LI organic) | Wdrożone |
| 17.02 | Stalton — DNA delivery Claude Code (3 pliki, instalacja) | Zainstalowane ✅ |
| 17.02 | Content Machine — plan contentu tyg 1 + pipeline tyg 2 | Wykonane, zastąpione przez 19.02 |
| 17.02 | Łowca Myśli — post LI autentyczność vs sztuczny content | Opublikowane |

*Starsze wpisy (≤16.02): backup/decyzje_archiwum_2026-02-24.md*

---

*Ostatnia aktualizacja: 26.02.2026 (+5 nowe aktywne: Telegram Ultron mapa automatyzacji + Infographic Generator + Gemini DR integracja + Notion CRM System 10h+ + Google AI Studio płatny plan)*
