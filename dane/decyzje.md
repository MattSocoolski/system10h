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

### [ARTNAPI] 09.03.2026 | OPERACJE | SAMOGRAJ — 4 DECYZJE ARCHITEKTONICZNE

**KONTEKST:** Budowa systemu "samograj" — autonomicznej maszyny sprzedażowej ArtNapi opartej na AI (eating own dog food — System 10H). Architektura v1.1 z edge cases.

**DECYZJE:**

1. **D1 — MailerLite jako kanał repeat orders:** TAK. Nowe konto na @artnapi.pl (obecne jest pod System 10H). Free tier: 1000 subskrybentów, 12k maili/msc. Do: auto-remindery zamówień D+30, seasonal campaigns, nurturing. @cto buduje.
2. **D2 — Tagi klienta w CRM Notion:** TAK. Nowe pole `tag_klienta` w Notion CRM (select: REPEAT, CHURN_RISK, ONE_TIME, SEASONAL, PAUSED). Sterują logiką auto-follow-upów i reminderów. @cto dodaje.
3. **D3 — Auto @recon co 2 tygodnie:** TAK. Gemini DR + @recon batch. Koszt: ~$0 (Gemini free tier). Generuje nowe listy targetów automatycznie.
4. **D4 — Adi Trade retention pitch:** TAK. @cso przygotuje "Plan B" pitch zanim ich kontener dotrze. Tag: CHURN_RISK.

**DLACZEGO:** User ma ograniczony czas (nie 8h dziennie). System musi działać autonomicznie z minimalnymi interwencjami.

**NASTĘPNE KROKI:**
- @cto: Nowe konto MailerLite @artnapi.pl + pole `tag_klienta` w Notion CRM (W2)
- @cto: Telegram reminder raportu tygodniowego — CZWARTEK (nie piątek)
- @cso: Adi Trade retention pitch (przed spotkaniem z Piotrem)
- @recon: Pierwszy batch auto-research (W3)

---

### [ARTNAPI] 09.03.2026 | OPERACJE | RAPORT TYGODNIOWY — DEADLINE CZWARTEK + TELEGRAM REMINDER

**KONTEKST:** User nie chce pamiętać o raporcie tygodniowym. Ma bota Telegram (Ultron) z TELEGRAM_BOT_TOKEN. Chce automatyczny reminder.

**DECYZJA:**
1. **Deadline raportu:** CZWARTEK (zmiana z piątku).
2. **Telegram reminder:** Bot Ultron wysyła reminder w czwartek rano (np. 8:30) z tekstem: "Raport tygodniowy — deadline dziś. Uruchom: `node automatyzacje/generate-weekly-report.js`"
3. **Docelowo:** Auto-generowanie raportu + wysyłka na Telegram (bez interwencji usera).

**DLACZEGO:** User jest ENTP-A — systemy muszą przypominać, nie user musi pamiętać.

**NASTĘPNY KROK:** @cto ustawia cron + Telegram webhook na czwartek 8:30.

---

### [SYSTEM10H] 09.03.2026 | FINANSE + MARKETING | PODWYŻKA CENY: 2 599 → 2 999 PLN NETTO

**KONTEKST:** Infografika porównawcza "Kurs AI vs Bliźniak" ujawniła problem pozycjonowania — produkt DFY (lepszy, szybszy, spersonalizowany) był TAŃSZY niż kurs DIY (~3 000 PLN). Podświadomy sygnał: tańszy = gorszy. 0/7 obiekcji cenowych w pipeline, Karolina Durmaj powiedziała wprost "cena nie wygórowana".

**DECYZJA:**
1. **Nowa cena:** 2 999 PLN netto (jednorazowo). Podwyżka +400 PLN (+15%).
2. **Raty:** 2× 1 499,50 PLN.
3. **Obowiązuje od:** 09.03.2026. Żaden lead nie był jeszcze na etapie negocjacji cenowej.
4. **Zmienione pliki:** oferta.md, plan.md, persona.md, metryki.md, network-profil.yaml, 2 materiały, strona (index.html + solo_ua.html + blog).
5. **DO ZROBIENIA (user):** Deploy strony, sprawdzić MailerLite, sprawdzić Self-Discovery/Architekt.
6. **Pro tier:** Bez zmian (4 500-5 000 PLN, Faza 2).

**DLACZEGO:** Premium DFY musi kosztować >= kurs DIY. Okrągła liczba. Zero obiekcji cenowych = margines. +15% przychodu per deal bez dodatkowej pracy.

**NASTĘPNY KROK:** Deploy strony. Zaktualizowany post LI #2 z nową ceną + grafiką.

---

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
