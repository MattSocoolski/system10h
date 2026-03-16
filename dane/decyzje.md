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

### [SHARED] 16.03.2026 | OPERACJE | SESJA CEO PONIEDZIAŁKOWA — WYKONANE AKCJE

**KONTEKST:** Pełna sesja CEO ARTNAPI — poniedziałek, 12 agentów, pipeline push month W3.

**WYKONANE:**

1. **CRM Sync:** 7 mismatchów WTZ Gmail↔CRM naprawione (ostatni kontakt + Due 19.03)
2. **Draft Audit:** 10 osieroconych draftów WTZ = Gmail sam posprzątał. 5 aktywnych CEE draftów zidentyfikowane.
3. **CSO Inbox:** 6 wiadomości obsłużone. Wisz (negocjacja cenowa), Formela DK Damnica (nowy lead), Kolorab (operacyjne), WTZ odmowa (Kraków), Amazon restock.
4. **Wisz negocjacja cenowa:** Konkurencja 10,50 brutto od 100 szt. DECYZJA: bronimy 9,00 netto @ 1 paleta. 8,15 = cena 2-paletowa. Draft z argumentem Phoenix wysłany.
5. **Formela DK Damnica:** Nowy lead! Draft poprawiony: MOQ 30 szt PBN rama @ 27,64 netto (CSO błędnie obiecał cenę przy 22 szt — naprawione).
6. **Leo Creative = Rafał Michałewski:** Zidentyfikowany w Gmail. Mail wysłany 12.03 — NIE cold, czekamy odpowiedź.
7. **HTML stopki:** 5 skryptów automatyzacji (followup-guardian, restock-reminder, inquiry-router, create-gmail-draft, lib.js) zaktualizowane — drafty teraz HTML z profesjonalną stopką. +182/-57 linii.
8. **Cennik paletowy:** Pełny cennik z XLSX zapisany do dane/artnapi/oferta.md (podobrazia, PBN, deski, sztalugi, haft, ramki + MOQ).
9. **EU cennik 40x50:** Baza produktu 3,95→5,00 PLN (pociąg zamiast morza). 3 pliki zaktualizowane (kalkulator standalone + IdoSell + cennik EUR). Backupy w backup/. Ceny PL bez zmian.
10. **FR/DE shipping research:** Pełny raport. PL→DE ~450 PLN/paleta (~1,40 PLN/szt), PL→FR ~750 PLN/paleta (~2,34 PLN/szt). Rekomendacja: DAP, WDT 0% VAT, Clicktrans.pl na wycenę.
11. **LS Kurier zapytanie:** Draft do Katarzyny Jędrasik (bok@lskurier.pl) — wycena 7 tras EU (Berlin, Frankfurt, Rotterdam, Paryż, Lyon, Praga, Budapeszt).
12. **DK batch 2:** 25 draftów w Gmail. 3 nowe województwa (pomorskie, wielkopolskie, łódzkie). Pipeline DK: ~50 total (cel osiągnięty).
13. **Demo Modul Soft:** 4 pliki w projekty/modul-soft-demo/ — symulacja Bliźniaka dla handlowca 1C ERP, po ukraińsku. Pipeline 355k PLN, 5 leadów, Radar Szans, 16 workflow'ów.

**BŁĘDY DO NAPRAWIENIA (lekcje CSO):**
- CSO nie sprawdzał SENT przed raportowaniem statusu leada (Leo Creative)
- CSO obiecywał ceny bez sprawdzenia MOQ z cennika (Formela 22 szt < MOQ 30)
- Cennik w plan.md miał błędne ilości na palecie (360 vs 320 szt)
- Wszystkie te błędy naprawione systemowo (cennik w oferta.md, procedura CSO)

**DLACZEGO:** Poniedziałkowy push — oczyszczenie pipeline, przygotowanie W3, naprawa systemowa automatyzacji.

**NASTĘPNY KROK:** (1) Wysłać draft Wisza. (2) Wysłać draft Formeli. (3) Wysłać 25 DK batch 2. (4) Wysłać zapytanie LS Kurier. (5) Wgrać kalkulator IdoSell na stronę. (6) Modul Soft spotkanie ~18.03.

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

### [SHARED] 15.03.2026 | OPERACJE | CTO FULL AUDIT (MENU 1-6) — WYNIKI

**KONTEKST:** Pełny przegląd CTO: Tech Audit, Mapa Integracji, Łącz Kropki, Sejf API, Bezpieczeństwo, Automatyzacja 24/7. Dwa biznesy. 11 narzędzi połączonych, 7 niepołączonych, 9 skryptów automatyzacji.

**WYKONANE (sesja 15.03):**
1. ✅ **stock-monitor.js LaunchAgent** — załadowany, pon 9:05 (po restock-reminder 9:00)
2. ✅ **klucz.prv** — przeniesiony do ~/.ssh/, chmod 600. Bezpieczny.

**WYNIKI AUDYTU:**
- Sprzedaż: 4.0/5 | Marketing: 2.5/5 | Operations: 4.0/5 | Finanse: 1.5/5 | Obsługa klienta: 2.0/5. Średnia: 2.8/5.
- Koszt infrastruktury: ~$130-240/msc (ekstremalnie lean, prawie wszystko na free tier).
- Bezpieczeństwo: 7.5/10. 0 krytycznych, 3 ważne (backup kluczy, limity API).
- Morning-scan OAuth: 45% failure rate (3 z rzedu 11-13.03) — retry z 15.03 powinien naprawić, monitoruj pon.

**DECYZJE @CEO:**
1. **LinkedIn scheduling (Buffer Free)** — OPCJONALNIE. User publikuje regularnie (6+ postów, avg 470 views, top 985). Scheduling = wygoda, nie krytyczność. Rozważ jeśli chce batch-ować.
2. **Cloudflare Analytics** — NATYCHMIAST. 5 min w panelu CF. Zero danych o ruchu = decyzje na ślepo.
3. **Calendly → Telegram** — W3. Speed-to-Demo. 1-2h budowy.
4. **Auto-backup .env** — W3. Cron niedzielny + LaunchAgent. 10 min.
5. **Limity wydatków API** — W3. Claude console $20/msc + Google Cloud $5/msc. 5 min.
6. **Notion CRM System 10H** — KWIECIEŃ. Klon ArtNapi z innymi polami.
7. **Unified Action Log** — KWIECIEŃ. Centralne logowanie akcji skryptów.
8. **MailerLite ArtNapi** — KWIECIEŃ. Po >50 AM klientów.

**DLACZEGO:** Quarterly CTO audit. System działa (9/9 skryptów), ale marketing (2.5/5) i finanse (1.5/5) to słabe punkty. Buffer + CF Analytics = quick wins na poniedziałek.

**NASTĘPNY KROK:** (1) Buffer setup pon 16.03 rano. (2) CF Analytics wł. pon. (3) Monitoruj morning-scan OAuth pon (po fix retry). (4) Calendly webhook W3.

**MATERIAŁ:** `materialy/2026-03-15_cto_tech_audit.md` (pełny audit, menu 1-6)

---

### [SHARED] 15.03.2026 | STRATEGIA | DEEP RESEARCH — 6 RAPORTÓW, WNIOSKI STRATEGICZNE

**KONTEKST:** 6 raportów Deep Research przetworzonych równolegle (4 agenty). Raporty: (1) EU Distribution Playbook, (2) Partner Channel dla Bliźniaka, (3) AI dla polskich urzędów, (4) Competitive Analysis Bliźniaka, (5) Rynek 1C/Modul Soft, (6) WTZ/DPS/DK playbook.

**DECYZJE:**

1. **[ARTNAPI] EU DISTRIBUTORS — GOTOWY PLAYBOOK**
   - Kalkulacja marż: EXW 4.05 EUR → dystrybutor kupuje za 6-7.50 EUR → detalista za 8.62 EUR → SRP 14.99-21.20 EUR. Marża importera ~33%.
   - Incoterms: oferować DAP/DDP (nie EXW) — eliminuje barierę wejścia dla dystrybutora.
   - Pierwszy target: DACH (cenią certyfikaty FSC, EN 71) + CEE sąsiedzi (CZ, SK).
   - Targi: PITF Prague V.2026 jako visitor (~500-1000 PLN). Creativeworld I.2027 zaplanować z Piotrem.
   - Red flags: nigdy wyłączność bez MPO, nigdy 90+ dni płatności, nigdy kary bez force majeure.
   - Materiał: `materialy-artnapi/2026-03-15_eu_distribution_playbook.md`

2. **[ARTNAPI] WTZ/DPS/DK — KALENDARZ I PAKIETY**
   - Potencjał rynkowy: 730 WTZ + kilka tys DPS + 4 000+ DK. Przy 5% penetracji = ~1.17M PLN/rok.
   - WTZ budżet na plastykę: avg 4 000 PLN/rok. DK: avg 4 000 PLN. DPS: avg 2 500 PLN.
   - KLUCZOWE OKNO: wrzesień-październik = planowanie budżetów na kolejny rok. Duży batch outreach WT-IX.
   - Teraz (marzec): realizacja budżetów + granty NCK (Kultura-Interwencje nabór do V).
   - Rejestracja na platformazakupowa.pl + e-Zamówienia (kody CPV) = zero kosztów, pasywne leady.
   - Pakiet Pracowniany WTZ: Start 690 PLN / Standard 1 380 PLN / Roczny 4 800 PLN.
   - Materiał: `materialy-artnapi/2026-03-15_wtz_dps_dk_playbook.md`

3. **[SYSTEM10H] PROGRAM PARTNERSKI — ZAMROŻONY (Q3 2026)**
   - Test 30-dniowego ROI: NEGATYWNY. 6/6 kryteriów gotowości niespełnione.
   - Activation rate partnerów <20%, czas do revenue 9-12 msc. Przy 1 kliencie i długu 17.5k = Shiny Object.
   - CO ZAMIAST: ad hoc referral asks (Zbigniew, Natan, Gosia Jary), Modul Soft Faza 2 jako test modelu.
   - WARUNEK ODBLOKOWANIA: 5+ klientów, przychód ≥12k/msc, dług <5k, 2 case studies.
   - Materiał: `materialy/2026-03-15_partner_program_draft.md`

4. **[SYSTEM10H] AI DLA URZĘDÓW — ZAMROŻONE (Q4 2026)**
   - Test 30-dniowego ROI: NEGATYWNY. Cykl sprzedaży 6-18 msc, brak produktu, brak kompetencji compliance.
   - 11 aktywnych priorytetów o łącznej wartości ~75k PLN — nic nie porzucać.
   - LEAD KRYSTIAN: discovery call TAK, ale gate check — musi dostarczyć pipeline (urzędy, budżety, timeline). Bliźniak "as is" NIE rozwiązuje problemu urzędów.
   - QUICK WINS: post LinkedIn o AI Act (pozycjonowanie), pytanie o sektor publiczny w SD (pasywne leady).
   - WARUNEK ODBLOKOWANIA: 5+ klientów, dług 0, stabilny przychód ≥12k/msc, partner z kompetencjami B2G.
   - Materiał: `materialy/2026-03-15_ocena_rynek_urzedy.md`

5. **[SYSTEM10H] COMPETITIVE BATTLECARD — AKTYWNY**
   - Tagline: "Gotowy system. Twój styl. Od dnia 1."
   - 5 filarów: DFY>DIY, jednorazowo>SaaS, kalibracja DNA, 16 scenariuszy, human-in-the-loop.
   - Brak bezpośredniej konkurencji w Polsce (nikt nie oferuje DFY AI asystenta za ~3k PLN).
   - Najbliżsi: Negacz AI_Sales (kurs 1990 PLN), Handlowcy.AI (warsztaty), AI Biznes Lab (edukacja).
   - Okno się zamyka: jeśli Negacz lub Burnejko uruchomią DFY → first-mover advantage znika.
   - 15 statystyk sprzedażowych gotowych do LinkedIn/rozmów.
   - Materiał: `materialy/2026-03-15_competitive_battlecard.md`

6. **[SYSTEM10H] MODUL SOFT — MEETING PREP GOTOWY**
   - 3 ścieżki: A (Bliźniak 2 999), B (AI Service Desk 10-15k), C (partnerstwo/white-label 18-21k).
   - Hipotezy bólów: CAC $395/lead, cykl ERP 1-24 msc, Service Desk 12+ osób, sankcyjne ryzyko reputacyjne.
   - Competitive intel: Comarch ChatERP już istnieje, Edward.ai = CRM AI w PL.
   - 10 pytań discovery + 5 obiekcji z odpowiedziami + quick reference card.
   - Materiał: `materialy/2026-03-15_modulsoft_meeting_prep.md`

**DLACZEGO:** Systematyczna analiza 6 rynków/kierunków na jednej sesji. Dwa zamrożone (urzędy Q4, partnerzy Q3), cztery aktywne (EU playbook, WTZ/DPS/DK, battlecard, Modul Soft prep).

**NASTĘPNY KROK:** (1) Modul Soft spotkanie ~18.03 — wydrukuj prep. (2) EU outreach W3 — użyj template z playbooka. (3) Rejestracja platformazakupowa.pl. (4) Publikuj 3 posty LinkedIn z battlecard stats.

---

### [SHARED] 15.03.2026 | OPERACJE | SKAN HIGIENY CEO+COO — WNIOSKI I AKCJE

**KONTEKST:** Pełny skan-higiena obu biznesów (ARTNAPI + System 10H) + pulpit. 3 agenty równolegle: Gmail/CRM/pliki ARTNAPI, folder/tech/połączenia 10H, audyt Desktop.

**DECYZJE I WYKONANE AKCJE:**
1. **ARTNAPI plan.md:** 522→418 linii (-20%). Zamrożone leady w tabelę, luty skondensowany, W2 zamknięty.
2. **Sync cen System 10H:** 2 500→2 999 PLN w 5 plikach + wersja v5.0→v7.0, 15→16 scenariuszy.
3. **projekty-status.md:** Oba biznesy zaktualizowane (Kamil PODPISANA, Modul Soft dodany, DK AKTYWNY, EU Distributors dodany).
4. **Morning-scan OAuth:** Naprawiony — problem: cold start macOS, nie wygasły token. Retry 3x10s w lib.js + fallback 30s w morning-scan.js. Fix działa dla WSZYSTKICH 7 skryptów.
5. **Followup-guardian:** 2 bugi naprawione — (a) duplikaty draftów (sprawdza Gmail przed tworzeniem), (b) ignoruje PAUZA/PARKING/ZAMROŻONY w notatkach CRM.
6. **CRM cleanup:** 11 leadów zaktualizowanych, 2 zamknięte (Paleta Art, MOK Olkusz), Winem CHURN_RISK, 7 mismatchów Gmail↔CRM naprawione.
7. **Gmail drafty:** 22 WTZ breakup draftów + Leo Creative breakup + Piotr odpowiedź (do usunięcia). 4 FU drafty do wysłania (HobbySet, Malu Vino, Frocskolo, Knihy).
8. **Stalton feedback:** Analiza Bloku 1 (5 pytań). Hero quote: "korytarz nieskończonych możliwości". Natan używa do dokumentacji technicznej (CNC), nie tylko sprzedaży. Blok 2+3 follow-up ~29.03.
9. **AWS Inbox Router ocena:** Mamy 90% tego systemu. NIE migrować na AWS. TAK jako produkt (potwierdza Bliźniak PRO). 3 inspiracje: Unified Action Log, Smart Routing, VPS failover.
10. **MailerLite SD v2:** Wgrany przez usera (18 pytań, kwalifikacja BASE/PRO). Automatyzacja aktywna.
11. **Deep Research roadmap:** 6 meta-promptów przygotowanych. DR-1 (Modul Soft/1C) i DR-2 (Negocjacje dystrybutorzy EU) = PILNE.

**DLACZEGO:** Quarterly hygiene — oczyszczenie plików, naprawa automatyzacji, sync danych, przygotowanie na W3 (EU outreach + Modul Soft spotkanie).

**NASTĘPNY KROK:** (1) Wyślij 22 WTZ breakup + 4 FU drafty z Gmail (pon 16.03). (2) Odpal DR-1 + DR-2 przed spotkaniem Modul Soft. (3) Desktop: przenieś klucz.prv, usuń duplikaty, BIURKO na dysk zewnętrzny.

---

### [SHARED] 15.03.2026 | OPERACJE | DESKTOP AUDIT — DUPLIKATY I BEZPIECZEŃSTWO

**KONTEKST:** Audyt plików na pulpicie. Desktop 8,8 GB (BIURKO = 8 GB starych filmów). Potwierdzone duplikaty MD5 (cenniki, kalkulatory). klucz.prv na Desktop.

**DECYZJA:**
1. **ALERT BEZPIECZEŃSTWA:** `pliki/klucz.prv` przenieść do ~/.ssh/ — klucz prywatny nie powinien leżeć na Desktop.
2. **Cenniki/kalkulatory na pulpicie:** Zostawić (user decision — "dla wygody").
3. **Duplikaty do usunięcia:** AI materiały/, ARTNAPI/ASYSTENT AI/, ARTNAPI/MATERIALY AKTUALNE/, asystent_BACKUP/ (stary z 27.02).
4. **Do przeniesienia:** Katalog B2B PDF + katalog EU HTML + PALETOWE CENNIK → materialy-artnapi/. Bezpieczeństwo danych PDF + linkedin visual → materialy/. MOJA FIRMA → ~/Dokumenty/Firma/. BIURKO → dysk zewnętrzny.
5. **Gmail labele CRM:** Odrzucone — MCP Gmail nie wspiera, user nie chce skryptu.

**DLACZEGO:** Porządek + bezpieczeństwo. Desktop po sprzątaniu: 8,8 GB → ~200 MB.

**NASTĘPNY KROK:** User przenosi klucz.prv (ASAP), usuwa duplikaty, przenosi BIURKO na dysk.

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

### [ARTNAPI] 13.03.2026 | OPERACJE | STOCK MONITORING WDROŻONY

**KONTEKST:** Zamówienie kontenera 13 000 szt płócien 40×50. Obecny stock 7 900 + 3 300 w dostawie = 11 200 szt. Burn rate ~5 000 szt/mies (trend rosnący). Estymowany stockout: 18.05. Transport morski (ETA ~1.06) = 14-dniowy gap. Pociąg (~1.05) = zero gap ale +13k PLN COGS.

**DECYZJA:** Wdrożono stock-monitor.js + dane/artnapi/stock.json. Cron: poniedziałki 9:00. Telegram alert gdy zapas < 4 tyg. Ręczna aktualizacja stock.json po każdej dostawie/sprzedaży.

**DLACZEGO:** Brak widoczności na poziom zapasów prowadził do decyzji logistycznych pod presją czasu. Automatyczny monitoring = wczesne ostrzeżenie + dane do negocjacji z Piotrem (morze vs pociąg).

**NASTĘPNY KROK:** Omówić z Piotrem transport morze vs pociąg (W3). Ustawić cron w LaunchAgent. Dodać kolejne SKU do stock.json.

---

### [SHARED] 13.03.2026 | OPERACJE | ANALIZA RYZYKA PIP — NOWELIZACJA USTAWY

**KONTEKST:** Nowelizacja ustawy o PIP uchwalona (Sejm+Senat). Inspektorzy PIP mogą przekształcać B2B w UoP. Systemy ZUS/PIP/US połączone. ZUS nalicza składki wstecz do 3 lat.

**DECYZJA:** Przegląd współpracy B2B z ArtNapi. Zidentyfikowane czerwone flagi: email firmowy, stała podstawa, KPI z karą, raportowanie w formacie szefa. Tarcze: JDG, System 10H (wielu klientów), brak zakazu konkurencji, praca zdalna. Raport PDF wygenerowany.

**DLACZEGO:** Ekspozycja finansowa rośnie co miesiąc (~2 700 PLN/mies). 6 mies. = ~16k, 12 mies. = ~32k. Lepiej zabezpieczyć teraz niż po kontroli.

**NASTĘPNY KROK:** 1) Email na własną domenę (natychmiast). 2) Rozmowa z Piotrem o przeglądzie umowy (W3-W4). 3) Dokumentacja samodzielności (folder dowody_B2B/).

---

### [ARTNAPI] 12.03.2026 | OPERACJE | FIX: AUTOMATYZACJE — ANGIELSKI DLA ZAGRANICZNYCH LEADÓW

**KONTEKST:** followup-guardian.js i restock-reminder.js generowały drafty po polsku dla WSZYSTKICH leadów, w tym zagranicznych (HobbySet LV, FlashArt EE, Malu Vino CZ, Knihy CZ). Przyczyna: cały system prompt po polsku, Haiku ignorował słabą regułę "pisz po angielsku dla CEE". Bonus bug: `dateKey` undefined → 7-dniowe czyszczenie stanu nie działało.

**DECYZJA:**
1. **lib.js:** Nowa eksportowana funkcja `isForeignLead()` — sprawdza pole `kraj` w CRM + fallback po domenie emaila (.cz, .sk, .hu, .lv, .ee, .de, .nl + 12 innych TLD)
2. **followup-guardian.js + restock-reminder.js:** Osobne pełne angielskie system prompty + user prompty + sygnatury EN dla foreign leads. Guard: `if (isForeignLead) → EN path`. PL path bez zmian.
3. **ghost_styl.md regex fix:** Sekcja "B2B SPRZEDAŻ" teraz poprawnie oddzielona od "B2B ENGLISH" (wcześniej regex ładował obie razem)
4. **Bug fix:** `dateKey` → `todayStr` w followup-guardian.js (7-dniowa pamięć draftów teraz działa poprawnie)
5. **generateSubject:** EN subject line dla foreign leads ("Restock reminder" zamiast "Uzupełnienie zapasów")
6. **Dry-run OK:** 4/4 zagraniczne leady (Malu Vino CZ, HobbySet LV, FlashArt EE, Knihy CZ) generują angielskie drafty

**DLACZEGO:** Polskie maile do firm z Estonii/Łotwy/Czech = nieprofesjonalne. Angielski prompt = wyższy response rate + spójność z ręcznymi szablonami EN.

**NASTĘPNY KROK:** Monitoring — sprawdzić Gmail drafty po 17:00 (cron followup-guardian) czy nowe drafty zagranicznych leadów są w EN.

---

### [SYSTEM10H] 12.03.2026 | PRODUKT | BLIŹNIAK v7.0 + ARCHITEKTURA PRO

**KONTEKST:** Analiza systemu ArtNapi (Samograj, morning-feed, ghost_styl, decyzje/lekcje) → co z tego wzbogaci produkt Bliźniak (2,999 PLN). Stan.md już miał DECYZJE i LEKCJE ale pasywnie. Brakowało: antyhalucynacji, głębokiej stylometrii, aktywnych triggerów.

**DECYZJA:**
1. **BASE v7.0 (zrealizowane):** +Protokół Wiarygodności (CLAUDE.md), +Aktywna Pamięć z trigger words, +Głęboki Profil Stylu (S5 z 3 warstwami + 5 kontekstami), dna-interviewer prosi o 3-5 maili zamiast 2-3
2. **Self-Discovery v2 (zrealizowane):** +3 pytania kwalifikujące (Q16-18: czas na powtarzalne, poranny brief, sabotażysta). Output: SYSTEM-FIT w DNA-READY IMPORT → Architekt rozpoznaje i proponuje PRO
3. **Value stacking:** 7,400 → 9,000 PLN (nowe pozycje: Protokół Wiarygodności 500, Głęboki Profil Stylu 600, stan.md v1.1 +200)
4. **Bliźniak PRO (architektura):** 3 skrypty Telegram (morning-brief, followup-alert, weekly-pulse) parsujące stan.md. Zero API, zero chmury. Addon ~1,999 PLN. Plan w `dane/system10h/blizniakpro_architektura.md`
5. **Czerwona linia BASE:** Bez zmian (zero integracji). PRO: jedyna integracja = Telegram Bot (5 min, 0 PLN)
6. **Cena PRO:** Opcja A — **pakiet 4,999 PLN** (BASE + PRO razem). Prostsze, wyższa wartość na start.

**DLACZEGO:** ArtNapi dowodzi że automatyzacje (morning-feed, followup-guardian) to game changer. Wersja "lite" z Telegram + stan.md daje 80% wartości bez złożoności API. Pakiet 4,999 PLN to jedyny produkt do sprzedania — zero komplikacji z addonami.

**NASTĘPNY KROK:** Zbudować 3 skrypty template PRO → test na 1 kliencie beta. Aktualizacja strony + MailerLite z SD v2.

---

### [ARTNAPI] 12.03.2026 | OPERACJE | SAMOGRAJ LITE — RESTOCK REMINDER (OPCJA B)

**KONTEKST:** Samograj (09.03) miał 4 decyzje, 0 zrealizowanych. CEO+CTO audit: pełna architektura z MailerLite = overengineering. Uproszczona wersja (Opcja B) osiąga 80% efektu.

**DECYZJA:**
1. **Opcja B:** Osobny skrypt `restock-reminder.js` (NIE rozszerzenie followup-guardian.js)
2. **Notion CRM:** Nowe pola `tag_klienta` (select: REPEAT/CHURN_RISK/ONE_TIME/SEASONAL/PAUSED) + `cykl_dni` (number)
3. **Logika:** Status "Klient/AM" + tag REPEAT + `ostatni_kontakt + cykl_dni < dziś` → auto-draft restock w Gmail + Telegram alert
4. **Cron:** Poniedziałek 9:00 (raz/tydzień)
5. **MailerLite (D1 z 09.03):** ODŁOŻONE na kwiecień — dopiero przy >50 klientów AM
6. **D2 (tagi):** ZROBIONE via Notion API
7. **D3 (auto @recon):** TIER 2, za tydzień
8. **D4 (Ad-trade pitch):** Do zrobienia osobno przez @cso

**DLACZEGO:** Nie ruszaj czegoś co działa (followup-guardian). Restock ma inną kadencję i prompt. Izolacja = łatwiejszy debug.

**NASTĘPNY KROK:** @cto buduje skrypt (w toku). Po deploy: test --dry-run, potem cron.

---

### [ARTNAPI] 12.03.2026 | SPRZEDAŻ | EU DISTRIBUTOR EXPANSION — PLAN URUCHOMIONY

**KONTEKST:** Deep Research DONE — 40 dystrybutorów w 14 krajach EU, Top 10 z kontaktami. Cennik paletowy PBN (rama + bez ramy) obliczony. Katalog B2B EN (HTML) gotowy.

**DECYZJA:**
1. **Tier 1 outreach (marzec W3-W4):** 5 firm — HobbySet (LV reactivation), NEOART (HU), Kippers Hobby (NL), MPK Toys (CZ), Dagros-Brunsting (NL)
2. **Tier 2 outreach (kwiecień):** 5 firm — Vaessen Creative, CC Hobby, OZ International, VBS Hobby, Panduro
3. **Cennik EXW:** Do omówienia z Piotrem — dystrybutor potrzebuje niższej ceny niż end-buyer B2B
4. **Materiały:** Katalog B2B EU (HTML) DONE. Szablony cold intro EN w przygotowaniu.
5. **Targi:** PITF Prague V.2026 (decyzja IV), Creativeworld Frankfurt I.2027 (rezerwacja IX.2026)
6. **Zasada:** Max 3h/tydzień na EU outreach — marzec = PUSH MONTH, nie rozpraszamy

**DLACZEGO:** Raport potwierdza: Skandynawia ZERO dominant PBN brand, Benelux najlepsza infrastruktura hobby wholesale, CZ bliskość geograficzna. 3-5 dystrybutorów = 2 000-5 000 szt/mies.

**NASTĘPNY KROK:** @recon weryfikacja emaili Top 10 → @cso+@ghost outreach Tier 1 → HobbySet jako pierwszy (already in CRM).

---

### [ARTNAPI] 12.03.2026 | SPRZEDAŻ | NEGOCJACJA 350g CANVAS Z RITĄ

**KONTEKST:** Rita dała 1$/szt za 380g canvas. Zbyt drogo (+20% vs obecne 0.83$/280g). Piotr: "przy 0.85$ za 350g możemy przejść na nie wszystkich na rynku wycisnąć".

**DECYZJA:** Kontr-propozycja: 350g (nie 380g) po ~0.85$/szt. Argument: kontener od razu jeśli cena OK. Mail wysłany 12.03.

**DLACZEGO:** 350g @ 0.85$ = premium linia po cenie zbliżonej do obecnej. Game changer na rynku.

**NASTĘPNY KROK:** Czekamy na odpowiedź Rity. Jeśli 0.85-0.88$ → zamówienie kontenera.

---

### [ARTNAPI] 11.03.2026 | STRATEGIA | CE MARKING — FABRYKA MA CERTYFIKATY

**KONTEKST:** Mail do Rity ws. CE marking. Odpowiedź: fabryka MA CE + BSCI + FSC. Wcześniejszy research wskazywał koszty 1 500-5 000 EUR na testy — okazuje się zbędny. Czekamy na: kopie certyfikatów PDF, info które produkty objęte, EN 71 (zabawka) vs 14+ (dorosły).

**DECYZJA:** Temat retail/CE prowadzi INNY ASYSTENT (checklista wejścia). Ten system trackuje tylko status certyfikatów od Rity. Nie ponosimy kosztów testów — fabryka ma. Retail potencjalnie odblokowany (Kaufland, PBS, Poczta Polska) po otrzymaniu dokumentacji.

**DLACZEGO:** Game changer — koszt wejścia w retail = 0 PLN zamiast szacowanych 1 500-5 000 EUR. Retail to nowy kanał dystrybucji (wolumeny 10x B2B).

**NASTĘPNY KROK:** Czekać na odpowiedź Rity z PDF certyfikatów + info o produktach objętych CE. ETA: 24-48h. Po otrzymaniu → przekazać drugiemu asystentowi do checklisty retail.

---

### [SYSTEM10H] 11.03.2026 (update 12.03) | STRATEGIA | MODUL SOFT — 2-FAZOWY MODEL (PILOT → KNOW-HOW)

**KONTEKST:** Lena poleciła Modul Soft (firma IT, partner 1C, 40+ specjalistów, 200+ wdrożeń ERP, Łódź). Spotkanie z Olą (dyr. sprzedaży, kuma Leny). Nowy intel od Leny (12.03): Ola = analityk (księgowa→konsultant→analityk→dyr. sprzedaży). Właściciel = programista ("potężny umysł"). Mają 3 filary: programiści 1C, sysadmini (hosting+rutyna), konsulting (CRM+ERP). Mają własny produkt Kanban. Klienci: budżetowe (opór) + prywatne. Ola rozumie potrzebę AI.

**DECYZJA:** Model 2-fazowy (zmiana z jednego Model C):
• **Faza 1 — Pilot wewnętrzny:** 1-2 Bliźniaki v7.0 dla handlowców Oli @ 2 999 PLN/os. Standard, niski risk, 30 dni test. Total: 2 999-5 998 PLN.
• **Faza 2 — Know-how transfer (po udanym pilocie):** Szkolenie 8 000 PLN + 3× co-delivery 2 500 PLN = 15 500 PLN. Zero royalty — MS ustala własne ceny (sugerowane 3 500-5 000 PLN/wdrożenie u ich klientów).
• **Total potencjał Faza 1+2:** 18 500-21 500 PLN
• ROI dla MS: 10 wdrożeń/rok × 3 500-5 000 PLN = 35-50k PLN przychodu. 2-3x ROI w roku 1.
• Priorytet: ŚREDNI — czekamy na termin od Leny. NIE kosztem aktywnego pipeline.

**DLACZEGO:** Faza 1 (pilot) obniża barierę wejścia — Ola testuje zanim zainwestuje w know-how. Potencjał 21.5k PLN z jednego deala (5x obecny rekord). MS ma 200+ klientów → jeśli ruszą z Fazą 2, to case study + skalowalny kanał sprzedaży.

**NASTĘPNY KROK:** Odpowiedzieć Lenie: "Jestem gotowy, umów spotkanie z Olą (45 min)." Przed spotkaniem: demo pod branżę IT/ERP. Strategia: materialy/2026-03-11_modul_soft_strategy.md.

---

### [ARTNAPI] 10.03.2026 | OPERACJE | SPOTKANIE Z PIOTREM — ZAMÓWIENIA + STRATEGIA

**KONTEKST:** Spotkanie Mateusz × Piotr 10.03. Omówiono zamówienia z Chin, cenniki, CE, koszty magazynowe, cele. Raport wysłany do Piotra i Nazara (Gmail draft).

**DECYZJE:**
1. **2 kontenery:** Kontener 1 = podobrazia. Kontener 2 = PBN + sztalugi (kod 3498)
2. **Test lepszej gramatury 40x50:** 2 000 szt na próbę (cena do potwierdzenia @Rita). Dodać kod 3354
3. **PBN bez ramy = cel retail:** Konkurencja nie ma. CE marking jako wyróżnik
4. **Tempo vs kontener:** Obecne 8k/mies = pół kontenera. Pełny = 19k → potrzeba 10k+/mies lub wyższa składowa magazynowania
5. **Inne towary (farby, pędzle):** Zbadać zapotrzebowanie, cenę, odbiorców — nie decydować teraz
6. **Kartony mix (rozmiary w jednym kartonie):** Sprawdzić wpływ na cenę

**DLACZEGO:** Kluczowe ustalenia operacyjne przed złożeniem zamówienia w Chinach.

**NASTĘPNY KROK:** 4 pytania do Rity (gramatury, PBN ilości, CE, sztalugi wpływ na czas). Svitlana: próbki + reklamacje. Mateusz: kalkulator m³ + wielokrotności kartonów.

---

### [ARTNAPI] 10.03.2026 | OPERACJE | KOSZTY MAGAZYNOWE — KALKULACJA POD CEL

**KONTEKST:** Ustalono z Piotrem metodologię liczenia kosztów magazynowych pod cel sprzedażowy.

**DECYZJA:** Koszt wydania (45 PLN) i przechowania przeliczać per sztuka, pod cel powtarzalnej ilości sprzedaży (wydanie ÷ ilość na palecie × cel).

**DLACZEGO:** Transparentna kalkulacja marży z uwzględnieniem realnych kosztów magazynu.

**NASTĘPNY KROK:** Przeliczyć koszty magazynowe per produkt pod cel sprzedażowy. Mateusz, ten tydzień.

---

### [ARTNAPI] 10.03.2026 | OPERACJE | IAI — ZMIANA GRUPY RABATOWEJ

**KONTEKST:** Podczas spotkania ustalono, że grupa rabatowa w IdoSell wymaga zmiany.

**DECYZJA:** Zmienić grupę rabatową w IAI. Cel retail: PBN bez ramy (bo nikt nie ma + CE).

**DLACZEGO:** Alignment z nową strategią retail PBN bez ramy.

**NASTĘPNY KROK:** Zmienić konfigurację w IAI. Do ustalenia kto.

---

### [SHARED] 12.03.2026 | FINANSE | UMOWA NAPI × CQRE — PODPISANA ✅

**KONTEKST:** Kamil Andrusz (CQRE) — współpraca na wdrożenie Chatwoot+n8n+AI dla NAPI/Unizo. Umowa podpisana. Spotkanie z Piotrem (Unizo/Napi) 12.03 — omówienie wdrożenia.

**DECYZJA:**
1. **Umowa podpisana** ✅ między Mateusz Sokólski AM a CQRE Kamil Andrusz
2. **Faza 1:** 15 000 PLN netto → prowizja Mateusza ~4 500 PLN (30%)
3. **Faza 2:** ~75 000 PLN netto → prowizja Mateusza ~22 500 PLN (30%)
4. **Total prowizji:** ~27 000 PLN za odpowiednią część pracy

**DLACZEGO:** Mateusz aktywnie pracuje w obu fazach (nie tylko finder's fee). 27k PLN = game changer finansowy.

**NASTĘPNY KROK:** Realizacja Fazy 1 z Kamilem. Spotkanie z Piotrem odbyło się 12.03.

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
| 16.03 | Wpisy ≤09.03 przeniesione | backup/decyzje_archiwum_2026-03-16.md |
| 02-03.03 | 6 wpisów (Fix CRLF, Email Radar, Morning Feed, Sesja poniedziałkowa, Daily Brief Telegram, Retail+SHEIN+5 kampanii) | Done/deployed → backup/decyzje_archiwum_2026-03-04.md |
| 26.02 | 10 decyzji operacyjnych/technicznych (Telegram, Infographic, Gemini DR, Notion CRM, Google AI Studio, Security Audit, MailerLite, Sejf API, Content Pack, Wizja 6msc) | Zrealizowane → backup/decyzje_archiwum_2026-03-04.md |
| 25.02 | System 10H+ v6.1 (stan.md + Radar Szans + DR upgrade) | Wdrożone |
| 24.02 | Pilot Deadline Campaign + @pipeline + Analiza Finansowa | Zakończone |
| 20.02 | Zbigniew Strategic Partner Deal 990 PLN | Podwyższone do 2500 PLN (02.03) |
| 20.02 | SD v2.0 + Architekt v3.0 rebuild | Wdrożone ✅ |
| ≤19.02 | Starsze wpisy | backup/decyzje_archiwum_2026-02-24.md |

---

*Ostatnia aktualizacja: 16.03.2026 (Archiwizacja: 11 wpisów ≤09.03 → backup/decyzje_archiwum_2026-03-16.md)*
