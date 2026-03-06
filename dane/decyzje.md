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

### [ARTNAPI] 06.03.2026 | SPRZEDAZ + OPERACJE | COLD EMAIL — DWUETAPOWY MODEL (PKE COMPLIANCE)

**KONTEKST:** Deep Research cold email best practices PL (Gemini 06.03). Nowa ustawa PKE Art. 398 (2024) zabrania wysylania ofert handlowych bez uprzedniej zgody — dotyczy tez B2B. Dotychczasowe cold maile ArtNapi (cennik + probki w 1. mailu) sa technicznie niezgodne z PKE.

**DECYZJA:**
1. **DWUETAPOWY MODEL:** Mail 1 = pytanie o zgode na oferte (zero cennika, zero PDF). Mail 2 = oferta — TYLKO po otrzymaniu zgody.
2. **NATYCHMIAST (od 10.03):** Nowy format dla instytucji publicznych (WTZ/DPS/DK) — framing "zapytanie o wspolprace / zgloszenie do bazy dostawcow".
3. **OD 17.03:** Nowy format dla firm prywatnych (wine&paint, agencje, hotele, hurtownie) — framing "pytanie o zgode".
4. **ISTNIEJACE LEADY:** Kto juz odpowiedzial / jest w pipeline — kontynuacja normalnie (zgoda implikowana).
5. **DOMENA:** Zostajemy na artnapi.pl. Osobna domena cold outreach = decyzja kwiecien (po ocenie wolumenu).
6. **SEKWENCJA 4-MAILOWA:** D+0 zgoda, D+1 oferta (po tak), D+7 FU social proof, D+14 breakup. Brak odpowiedzi na zgode: D+0, D+3 nudge, D+10 breakup.
7. **3 SZABLONY:** A = instytucje publiczne, B = firmy eventowe, C = hurtownie/resellerzy. Wszystkie przez @ghost.

**DLACZEGO:** PKE compliance + lepszy open/reply rate (krotszy mail, mniej spamerski). Ryzyko kary UOKiK przy instytucjach publicznych. 90% firm PL ignoruje PKE, ale instytucje moga byc wrazliwe.

**NASTEPNY KROK:** @cso generuje 3 szablony + sekwencje. @ghost redaguje finalnie. Wdrozenie od 10.03.

**RESEARCH:** materialy-artnapi/ (Gemini Deep Research 06.03, pelny JSON + podsumowanie)

---

### [SYSTEM10H] 05.03.2026 | MARKETING + PRODUKT | REBRAND STRONY: DFY vs DIY + TOP 5 AKCJI

**KONTEKST:** Deep Research rynku kursow AI (Negacz, Handlowcy.ai). Pozycjonowanie System 10h+ jako DFY (Done For You) vs DIY (kursy). Nowy messaging + tabela porownawcza na stronie.

**DECYZJA:**
1. **WDROZONE (strona):** Nowy messaging hero: "Gotowy system sprzedazowy AI — skonfigurowany pod Ciebie". Tabela DFY vs DIY zamiast porownania z abonamentami. Nowe FAQ. Exit popup zaktualizowany. Pilot 1990 PLN usuniety (wygasl 28.02).
2. **Style Match Test (lead magnet):** ZAPLANOWANE — lead wysyla swoj mail, dostaje wersje przepisana przez Blizniaka. Spec ponizej.
3. **Post "Skonczyles kurs AI?":** MARZEC — nastepny post LI, targetuje rozczarowanych kursantow.
4. **Tier Quarterly Update 300 PLN/kw:** KWIECIEN — po 3. kliencie. Recurring bez SaaS.
5. **Webinar z bait (live demo Blizniaka):** MAJ — Faza 3. Mini-bot za zapis.

**DLACZEGO:** Pozycjonowanie DFY vs DIY daje unikalne miejsce na rynku. Kurs AI = 3000 PLN + 6 tyg nauki. System 10h+ = 2500 PLN + dziala od dnia 1. Zero konkurencji w tym framingu.

**NASTEPNY KROK:** (1) Deploy strony. (2) Spec Style Match Test (@cto architektura + @ghost copy). (3) Post LI "Skonczyles kurs AI?" (@content + @ghost).

---

### [SYSTEM10H] 05.03.2026 | SPRZEDAŻ | KAROLINA DURMAJ — NURTURE, NIE PIPELINE AKTYWNY

**KONTEKST:** Call 05.03 (14:30). Karolina NIE pracuje w Javi (odrzuciła ofertę — kasa się nie zgadzała). Pracuje dla małej poznańskiej firmy importowej (sourcing Chiny + PL → sprzedaż do polskich sieci handlowych). 4. dzień w pracy. Demo na żywym systemie — Karolina zobaczyła wartość. Cena 2 500 PLN "nie wygórowana" (jej słowa). Ale: za wcześnie (nowa praca), chce pogadać z mężem, obawa o NDA/poufność danych firmowych.

**DECYZJA:**
1. **Karolina → NURTURE** — usunięta z pipeline aktywnego. Wróć ~koniec marca.
2. **Wysłać link SD (12 pytań) na LinkedIn** — darmowy next step, bez zobowiązań.
3. **FU D+14 (~19.03):** Lekki check-in "jak nowa praca?"
4. **FU D+28 (~01.04):** Poważniejszy: "Zadomowiłaś się? Wracamy do tematu?"
5. **Nowy segment: etatowiec KAM** — wymaga: one-pager bezpieczeństwo danych, dłuższy cykl sprzedaży, propozycja "system jest Twój nie firmy".

**DLACZEGO:** Budget OK, need OK, ale authority (mąż + pracodawca) i timeline (4. dzień pracy) = brak readiness. Naciskanie = strata leada.

**NASTĘPNY KROK:** Wysłać SD link na LinkedIn (dziś). @ghost ton: lekki, zero presji.

---

### [SYSTEM10H] 05.03.2026 | SPRZEDAŻ | ZBIGNIEW KOWALSKI / COMMI — NURTURE MAJ, NOWA REGUŁA KWALIFIKACJI

**KONTEKST:** Demo live 05.03. Zbigniew zobaczył system (2 komendy + Deep Research), potwierdził wartość: "narzędzie dla działającego handlowca". COMMI w fazie reaktywacji — wspólnik kodujący wkłada środki, szukają programisty + handlowca. Zbigniew poprosił o kontakt ~maj 2026. Nie odmowa — timing.

**DECYZJA:**
1. **Zbigniew → NURTURE MAJ** — usunięty z aktywnego pipeline (2 500 PLN). Kontakt w maju gdy będzie handlowiec.
2. **NOWA REGUŁA KWALIFIKACJI:** Przed demo ZAWSZE pytaj: "Czy masz handlowca / osobę która będzie tego używać na co dzień?" Brak użytkownika = NURTURE, nie PIPELINE.
3. **REFERRAL ASK:** Przy następnym kontakcie poprosić Zbigniewa o 3 intro z sieci (180k przeszkolonych, VP Mówców). Nawet przed zakupem.
4. **Pipeline marzec skorygowany:** 12 500 → 10 000 PLN aktywny.

**DLACZEGO:** Demo zadziałało (produkt się broni), ale lead był źle zakwalifikowany od początku — brak revenue COMMI, brak handlowca = zero readiness. Korekta pipeline = prawda > nadzieja.

**NASTĘPNY KROK:** (1) Karolina czwartek = #1 priorytet (ona MA firmę i CHCE gadać). (2) Ping Zbigniewa maj 2026. (3) Wdrożyć pytanie kwalifikacyjne do discovery call.

---

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

### [SYSTEM10H] 04.03.2026 | SPRZEDAŻ + FINANSE | KAMIL ANDRUSZ / CQRE — WSPÓŁPRACA 30% PROWIZJI (FAZA 1+2)

**KONTEKST:** Spotkanie z Kamilem Andruszem (CQRE) 04.03. Pierwotny model (15% finder's fee za Napi) ewoluował w pełną współpracę. Kamil złożył ofertę dla Napi sp. z o.o.: Chatwoot + n8n + AI, 75-100k PLN. Mateusz będzie miał zadania do wykonania w Fazie 1 i 2 projektu.

**DECYZJA:**
1. **Prowizja:** ~30% netto od wartości kontraktu (Faza 1 + Faza 2) — Mateusz aktywnie pracuje, nie tylko finder's fee
2. **Zakres:** Współpraca projektowa — Mateusz wykonuje zadania w Fazie 1 i 2
3. **Formalizacja:** Podpisać UMOWĘ WSPÓŁPRACY (nie mail — pełna umowa)
4. **Szacunek:** 30% × 75-100k = **22 500-30 000 PLN**
5. **Deadline oferty Kamila:** ~27.03

**STRONY UMOWY:**
- Mateusz Sokólski Account Management, NIP: 8952117558, ul. Warszawska 40/2a, 40-008 Katowice
- CQRE Kamil Andrusz, NIP: 9581300902, REGON: 386778329, ul. Starowiejska 16, 81-356 Gdynia

**DLACZEGO:** 2x lepszy deal niż pierwotna 15% finder's fee. Mateusz wnosi pracę (nie tylko intro). Umowa chroni obie strony. Potencjał: 22,5-30k PLN.

**NASTĘPNY KROK:** (1) Research prawny → umowa współpracy B2B w PL, (2) Draft umowy, (3) Podpisać z Kamilem ASAP.

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

### [SHARED] 03.03.2026 | OPERACJE | ŻELAZNA ZASADA: @GHOST JAKO GATEKEEPER KOMUNIKACJI

**DECYZJA:** @ghost (ghost_styl.md) jest obowiązkowym gatekeeperem KAŻDEJ komunikacji wychodzącej. Automatyzacje MUSZĄ używać ghost_styl.md jako system prompt.

**NASTĘPNY KROK:** Obowiązuje od 03.03.2026. Zapisane w CLAUDE.md + ghost.md + cto.md.

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
| 02-03.03 | 6 wpisów (Fix CRLF, Email Radar, Morning Feed, Sesja poniedziałkowa, Daily Brief Telegram, Retail+SHEIN+5 kampanii) | Done/deployed → backup/decyzje_archiwum_2026-03-04.md |
| 26.02 | 10 decyzji operacyjnych/technicznych (Telegram, Infographic, Gemini DR, Notion CRM, Google AI Studio, Security Audit, MailerLite, Sejf API, Content Pack, Wizja 6msc) | Zrealizowane → backup/decyzje_archiwum_2026-03-04.md |
| 25.02 | System 10H+ v6.1 (stan.md + Radar Szans + DR upgrade) | Wdrożone |
| 24.02 | Pilot Deadline Campaign + @pipeline + Analiza Finansowa | Zakończone |
| 20.02 | Zbigniew Strategic Partner Deal 990 PLN | Podwyższone do 2500 PLN (02.03) |
| 20.02 | SD v2.0 + Architekt v3.0 rebuild | Wdrożone ✅ |
| ≤19.02 | Starsze wpisy | backup/decyzje_archiwum_2026-02-24.md |

---

*Ostatnia aktualizacja: 04.03.2026 (Health Check @coo: 198→~120 linii, -6 wpisów do archiwum)*
