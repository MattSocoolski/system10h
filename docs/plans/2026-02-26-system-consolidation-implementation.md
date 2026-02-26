# Konsolidacja asystent/ + ARTNAPI_OS/ — Plan Implementacji

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Połączyć dwa systemy AI asystentów (asystent/ + ARTNAPI_OS/) w jeden Monorepo z routingiem per biznes.

**Architecture:** Jeden folder asystent/ z CLAUDE.md zawierającym tryby pracy (artnapi/10h/ceo). Dane per biznes w podfolderach dane/artnapi/ i dane/system10h/. Agenci (coo, cso, cmo, ghost, cto, ceo, content, pipeline, recon) na poziomie dane/ — współdzieleni. Routing w CLAUDE.md mapuje ścieżki do odpowiednich podfolderów.

**Tech Stack:** Markdown, Git, Claude Code CLAUDE.md routing, MCP (.mcp.json), shell

**Design doc:** `docs/plans/2026-02-26-system-consolidation-design.md`

---

### Task 1: Safety Net — backup obu systemów

**Files:**
- Create: `/Users/mateuszsokolski/asystent_backup_2026-02-26/` (full copy)
- Create: `/Users/mateuszsokolski/ARTNAPI_OS_backup_2026-02-26/` (full copy)

**Step 1: Backup asystent/**

```bash
cp -r /Users/mateuszsokolski/asystent /Users/mateuszsokolski/asystent_backup_2026-02-26
```

**Step 2: Backup ARTNAPI_OS/**

```bash
cp -r /Users/mateuszsokolski/ARTNAPI_OS /Users/mateuszsokolski/ARTNAPI_OS_backup_2026-02-26
```

**Step 3: Verify backups exist**

```bash
ls -la /Users/mateuszsokolski/asystent_backup_2026-02-26/CLAUDE.md && ls -la /Users/mateuszsokolski/ARTNAPI_OS_backup_2026-02-26/CLAUDE.md
```

Expected: Both files exist with correct sizes (16K and 19K).

**Step 4: Commit checkpoint**

```bash
cd /Users/mateuszsokolski/asystent && git add -A && git commit -m "checkpoint: pre-consolidation state"
```

---

### Task 2: Struktura folderów — przenieś pliki per-business System 10H

**Files:**
- Create: `dane/system10h/` (directory)
- Move: `dane/plan.md` → `dane/system10h/plan.md`
- Move: `dane/oferta.md` → `dane/system10h/oferta.md`
- Move: `dane/persona.md` → `dane/system10h/persona.md`
- Move: `dane/metryki.md` → `dane/system10h/metryki.md`
- Move: `dane/projekty-status.md` → `dane/system10h/projekty-status.md`
- Move: `dane/dane_marketingowe.md` → `dane/system10h/dane_marketingowe.md`

**Step 1: Create directory**

```bash
mkdir -p /Users/mateuszsokolski/asystent/dane/system10h
```

**Step 2: Move per-business files**

```bash
cd /Users/mateuszsokolski/asystent
mv dane/plan.md dane/system10h/plan.md
mv dane/oferta.md dane/system10h/oferta.md
mv dane/persona.md dane/system10h/persona.md
mv dane/metryki.md dane/system10h/metryki.md
mv dane/projekty-status.md dane/system10h/projekty-status.md
mv dane/dane_marketingowe.md dane/system10h/dane_marketingowe.md
```

**Step 3: Verify**

```bash
ls -la /Users/mateuszsokolski/asystent/dane/system10h/
```

Expected: 6 files (plan.md 25K, oferta.md 6K, persona.md 8K, metryki.md 7K, projekty-status.md 3K, dane_marketingowe.md 3K).

**Step 4: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add -A && git commit -m "refactor: move System 10H per-business files to dane/system10h/"
```

---

### Task 3: Struktura folderów — skopiuj pliki per-business ArtNapi

**Files:**
- Create: `dane/artnapi/` (directory)
- Create: `dane/artnapi/plan.md` (from ARTNAPI_OS)
- Create: `dane/artnapi/oferta.md` (from ARTNAPI_OS)
- Create: `dane/artnapi/persona.md` (from ARTNAPI_OS)
- Create: `dane/artnapi/metryki.md` (from ARTNAPI_OS)
- Create: `dane/artnapi/projekty-status.md` (from ARTNAPI_OS)
- Create: `dane/artnapi/dane_marketingowe.md` — placeholder (ARTNAPI_OS nie ma tego pliku)

**Step 1: Create directory**

```bash
mkdir -p /Users/mateuszsokolski/asystent/dane/artnapi
```

**Step 2: Copy per-business files from ARTNAPI_OS**

```bash
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/plan.md /Users/mateuszsokolski/asystent/dane/artnapi/plan.md
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/oferta.md /Users/mateuszsokolski/asystent/dane/artnapi/oferta.md
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/persona.md /Users/mateuszsokolski/asystent/dane/artnapi/persona.md
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/metryki.md /Users/mateuszsokolski/asystent/dane/artnapi/metryki.md
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/projekty-status.md /Users/mateuszsokolski/asystent/dane/artnapi/projekty-status.md
```

**Step 3: Copy CRM sync protocol (ArtNapi-specific)**

```bash
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/crm_sync_protocol.md /Users/mateuszsokolski/asystent/dane/artnapi/crm_sync_protocol.md
```

**Step 4: Copy archiwum decyzji (ArtNapi-specific)**

```bash
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/archiwum_decyzji.md /Users/mateuszsokolski/asystent/dane/artnapi/archiwum_decyzji.md
```

**Step 5: Verify**

```bash
ls -la /Users/mateuszsokolski/asystent/dane/artnapi/
```

Expected: 7 files (plan.md 24K, oferta.md 12K, persona.md 8K, metryki.md 10K, projekty-status.md 3K, crm_sync_protocol.md 5K, archiwum_decyzji.md 2K).

**Step 6: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add -A && git commit -m "feat: add ArtNapi per-business files to dane/artnapi/"
```

---

### Task 4: Skopiuj projekty i materiały ArtNapi

**Files:**
- Create: `projekty-artnapi/` (directory, from ARTNAPI_OS/projekty/)
- Create: `materialy-artnapi/` (directory, from ARTNAPI_OS/materialy/)

**Step 1: Copy ArtNapi projects**

```bash
cp -r /Users/mateuszsokolski/ARTNAPI_OS/projekty /Users/mateuszsokolski/asystent/projekty-artnapi
```

**Step 2: Copy ArtNapi materials**

UWAGA: materialy/ w ARTNAPI_OS zawiera duże pliki (~130 MB: .xlsx 41M, .pdf 23M). Kopiuj selektywnie — tylko markdown i PDF reference:

```bash
mkdir -p /Users/mateuszsokolski/asystent/materialy-artnapi
mkdir -p /Users/mateuszsokolski/asystent/materialy-artnapi/checklisty
mkdir -p /Users/mateuszsokolski/asystent/materialy-artnapi/drafty
```

Kopiuj pliki markdown (nie kopiuj .xlsx 41M ani branding .pdf 23M — te zostają w ARTNAPI_OS_backup jako archiwum):

```bash
cd /Users/mateuszsokolski/ARTNAPI_OS/materialy
cp checklista_sprzedazy.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp checklista_lejki.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp dr_sprzedaz.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp outreach_hotele_toolkit.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp recon_research.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp prompt_engineering_guide.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp cennik_artnapi_2026.html /Users/mateuszsokolski/asystent/materialy-artnapi/
cp wybor_lejka.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp outreach_wegry_feb2026.md /Users/mateuszsokolski/asystent/materialy-artnapi/
cp "Biblia Follow-upu B2B.pdf" /Users/mateuszsokolski/asystent/materialy-artnapi/
```

Kopiuj subfoldery (checklisty, drafty):

```bash
cp /Users/mateuszsokolski/ARTNAPI_OS/materialy/checklisty/*.md /Users/mateuszsokolski/asystent/materialy-artnapi/checklisty/ 2>/dev/null
cp /Users/mateuszsokolski/ARTNAPI_OS/materialy/checklisty/*.pdf /Users/mateuszsokolski/asystent/materialy-artnapi/checklisty/ 2>/dev/null
cp /Users/mateuszsokolski/ARTNAPI_OS/materialy/drafty/* /Users/mateuszsokolski/asystent/materialy-artnapi/drafty/ 2>/dev/null
```

**Step 3: Verify**

```bash
ls -la /Users/mateuszsokolski/asystent/projekty-artnapi/
ls -la /Users/mateuszsokolski/asystent/materialy-artnapi/
```

Expected: 8 subdirectories in projekty-artnapi/, ~10+ files in materialy-artnapi/.

**Step 4: Update .gitignore**

Dodaj do .gitignore linie chroniące duże pliki binarne:

```
# Duże pliki binarne (branding, eksporty)
*.xlsx
```

**Step 5: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add -A && git commit -m "feat: add ArtNapi projects and materials"
```

---

### Task 5: Skopiuj agenta @recon z ARTNAPI_OS

**Files:**
- Create: `dane/recon.md` (from ARTNAPI_OS/dane/recon.md, ~37KB)

**Step 1: Copy recon.md**

```bash
cp /Users/mateuszsokolski/ARTNAPI_OS/dane/recon.md /Users/mateuszsokolski/asystent/dane/recon.md
```

**Step 2: Verify**

```bash
ls -la /Users/mateuszsokolski/asystent/dane/recon.md
```

Expected: ~37-40K file.

**Step 3: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add dane/recon.md && git commit -m "feat: add @recon agent from ARTNAPI_OS"
```

---

### Task 6: Merge lekcje.md

asystent/ lekcje.md = pusty template (708 B). ARTNAPI_OS lekcje.md = 13 lekcji z tagami (3,989 B). Merge = zachowaj template, dopisz lekcje z ARTNAPI z tagami [ARTNAPI].

**Files:**
- Modify: `dane/lekcje.md`

**Step 1: Replace lekcje.md with merged version**

Nowy plik łączy szablon asystent/ z lekcjami z ARTNAPI_OS, dodając tagi:

```markdown
# BAZA LEKCJI

Automatycznie wypełniana przez asystentów (@coo, @cso, @cmo, @ghost, @content, @ceo, @recon).
Każdy asystent wykrywa lekcje w rozmowie i proponuje zapis.
**Tagi:** [ARTNAPI] / [SYSTEM10H] / [SHARED] — oznaczaj każdą lekcję.
Trigger words: "okazało się", "nauczyłem się", "to zadziałało", "to nie zadziałało", "błąd był w", "następnym razem"

---

## SPRZEDAŻ

### [ARTNAPI] 25.02 | TAKTYKA PALETOWA DZIAŁA
BATS: 720 szt @ 8,20 = prowizja 829 PLN. WINO-GRONO: 2160 szt @ 7,30 = prowizja 1 585 PLN. Upsell do pełnej palety = najwyższa prowizja/szt. ZAWSZE proponuj dobieranie do palety.
> Źródło: decyzje.md (24.02, analiza CFO)

### [ARTNAPI] 25.02 | MAGAZYN = PRZEWAGA #1
WINO-GRONO przyszli SAMI bo ich dostawca się wysypał. 6 palet, biggest deal lutego. Nie szukaliśmy ich — byliśmy DOSTĘPNI gdy konkurencja nie była. "10 000 szt na stanie, 24h" to nie slogan — to zamykacz dealów.
> Źródło: decyzje.md (13.02, WINO-GRONO)

### [ARTNAPI] 25.02 | WINE&PAINT COLD MAIL: 12.5% RESPONSE RATE
Batch 1 (8 firm, wysłany 23.02) → RestArt odpowiedział w 2 dni = 12.5%. WTZ (41 maili, 18.02) → 1 odpowiedź "nie" = 2.4%. Wine&paint reaguje 5x lepiej niż instytucje na cold mail.
> Źródło: plan.md (batch 1 vs WTZ)

### [ARTNAPI] 25.02 | CENNIK B2B vs ALLEGRO — ZAWSZE CROSS-CHECK
POLBAR/Łukasz wychwycił: oferta B2B 50 szt @ 20,50 > cena Allegro 4 szt @ 20,32. Klient widzi i traci zaufanie. Przed wysłaniem cennika ZAWSZE porównaj z ceną marketplace.
> Źródło: decyzje.md (25.02, POLBAR korekta)

### [ARTNAPI] 25.02 | "BATCH 2" NIE JEST COLD — SPRAWDŹ HISTORIĘ
TeamFormacja kupił XI.2025, WinoMalowanie kupił XI.2025, Art&Wine Friends rozmowy I.2026. Zostały oznaczone jako "cold batch 2" a to re-engagement istniejących kontaktów. Inny ton, inna strategia.
> Źródło: decyzje.md (24.02, kampanie wzrostu)

### [ARTNAPI] 25.02 | PHOENIX WINDOW — TIMING OUTREACH
Phoenix ma 1 łańcuch dostaw (Chiny → Hiszpania → PL), regularnie "między kontenerami". CNY luka trwa do V-VI.2026. Messaging: "10 000 szt na stanie, wysyłka 24h" trafia gdy Phoenix nie ma towaru. Monitoring co poniedziałek.
> Źródło: decyzje.md (23.02, deep research Phoenix)

---

## MARKETING

*(brak wpisów)*

---

## PRODUKT

### [ARTNAPI] 25.02 | PODOBRAZIA = UNIQUE SELLING POINT W RETAIL
Brushme i Ideyka (konkurenci w Kaufland) mają TYLKO PBN. Żaden nie oferuje podobrazi. To jedyna kategoria gdzie Artnapi nie ma konkurencji na półce. W retail pitchu PROWADŹ podobraziami.
> Źródło: decyzje.md (25.02, Kaufland CI report)

---

## OPERACJE

### [ARTNAPI] 25.02 | GMAIL CHECK PRZED DRAFTAMI — OBOWIĄZKOWY
Ghost pisał drafty FU bez sprawdzenia co klient odpowiedział. 4 leady miały błędne statusy: Alkotásutca nigdy nie odpisał (a status mówił "czekamy"), HobbySet dał realny powód (mróz), FessNeki czekała 9 dni na próbki. Kolejność: Gmail → analiza → drafty.
> Źródło: decyzje.md (25.02, czystka pipeline)

### [ARTNAPI] 25.02 | PIPELINE INFLACJA — AUDYT CO TYDZIEŃ
Pipeline pokazywał 40k PLN. Po Gmail reality check: 25k. Po czystce: 14k. Ghost leady (brak odpowiedzi = "ciepły") zawyżały wartość 3x. Pipeline Pulse co piątek = non-negotiable.
> Źródło: decyzje.md (24.02, pipeline korekta)

### [ARTNAPI] 25.02 | WTZ MASS MAIL: 2.4% RESPONSE = NORMA DLA INSTYTUCJI
41 maili → 1 odpowiedź ("nie"). To NIE porażka — to baseline dla instytucji publicznych. FU D+7 obowiązkowy, D+14 snajperski. Budżety kwartalne = okno zakupowe. Cierpliwość.
> Źródło: plan.md + decyzje.md (WTZ kampania)

---

## OGÓLNE

### [ARTNAPI] 25.02 | NOWY MODEL PROWIZJI = 50% WYŻSZA STAWKA
Stary model: 7.6% efektywna. Nowy (od 12.02): 11.4% efektywna. Różnica = ~1 500 PLN/mies. przy tym samym wolumenie. Prowizja wbudowana w cenę działa lepiej niż % od marży.
> Źródło: decyzje.md (24.02, analiza CFO)

### [ARTNAPI] 25.02 | KONCENTRACJA RYZYKA — MAX 20% OD JEDNEGO KLIENTA
WINO-GRONO = 29% przychodu lutego. Gdyby odeszli = dziura 15k/mies. Cel: żaden klient >20% do VI.2026. Dywersyfikacja bazy = ochrona.
> Źródło: decyzje.md (24.02, analiza CFO)

---
```

**Step 2: Verify**

Sprawdź że plik zawiera 13 wpisów z tagami [ARTNAPI], sekcje mają nagłówki ##.

**Step 3: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add dane/lekcje.md && git commit -m "feat: merge lekcje.md — 13 lessons from ARTNAPI with tags"
```

---

### Task 7: Merge ghost_styl.md

asystent/ (6,957 B) ma unikalne: LinkedIn DM outreach, kompresja punch-line'ów, dystans narracyjny, temporal connectors.
ARTNAPI_OS (8,036 B) ma unikalne: DM/Casual (stream of consciousness, old-school emoticons), B2B Sprzedaż (archetyp Good Cop, podpis B2B), hedging, tempo pisania.

Merge = zachowaj plik asystent/ jako bazę, dopisz brakujące sekcje z ARTNAPI_OS.

**Files:**
- Modify: `dane/ghost_styl.md`

**Step 1: Edit ghost_styl.md**

Dodaj do istniejącego pliku brakujące elementy z ARTNAPI_OS:

1. W sekcji ## PODSTAWOWE — dodaj brakujące linie:
   - `- Hedging: częste "chyba" — nie narzuca opinii, zostawia przestrzeń`
   - `- Tempo pisania: szybkie, typo OK w casual (nie poprawia — "filzoficznie")`
   - Zmień `Bezpośredniość: 7/10` na `Bezpośredniość: 9/10 (od razu do rzeczy, zero wstępów)` (ARTNAPI_OS ma nowszą kalibrację po wywiadzie "Biznesowe DNA v2.0")

2. Po sekcji ## LINKEDIN DM (outreach) — dodaj nową sekcję:
```markdown
## DM / CASUAL (Skool, Messenger, WhatsApp)
- Lowercase — brak wielkich liter na początku zdań
- Stream of consciousness — długie zdania łączone "i", "bo", przecinkami
- Emotikony old-school: :D :) :-) (NIE emoji)
- Openersy: "no więc", "poza tym"
- Fillery: "i w ogóle", "co ciekawe", "chyba"
- Filozoficzny tryb: refleksja nad sensem, wartościami, "czy o to chodzi w życiu...?"
- Wielokropek "..." jako pauza do myślenia
- Skróty: "wg", "ws."
- Pytania do siebie/rozmówcy na końcu: "...ale czy o to chodzi w życiu...?"
- Zero podpisu (widać kto pisze)
- Typo akceptowane — pisze szybko
```

3. Po sekcji ## MAILE (biznesowe) — dodaj nową sekcję:
```markdown
## MAILE SEMI-FORMAL (znani kontakty biznesowe)
- Emoji: sporadycznie 🙂 (uśmiech, łagodzi formalność)
- Powitania: "Dzień dobry, pani Olu!" — ciepłe, z wykrzyknikiem
- "ws." zamiast "w sprawie"
- "będę wdzięczny za update" — grzeczne ale konkretne
- "i w ogóle" — filler nawet w biznesie
- Mix PL + EN: "update", "feedback", "deal"

## B2B SPRZEDAŻ (ARTNAPI — maile do klientów/leadów)
- Archetyp: Good Cop — ciepło, relacyjnie, partnersko. Nigdy nie ciśnie.
- Bezpośredniość: 9/10 — od razu do rzeczy
- Długość zdań: 8-15 słów. Zero lania wody.
- Otwarcie: ZAWSZE imię + ciepło ("Dzień dobry, [imię]!")
- Zamknięcie: proaktywne — oferuje następny krok, nie czeka
- Struktura: zero bulletów, czyste zdania, naturalny flow
- Transition Pan/Pani → Ty: naturalnie, gdy klient inicjuje
- **Ukryty wzorzec:** W każdym mailu potwierdza relację + PROAKTYWNIE otwiera drzwi do kolejnego zamówienia. Sprzedaż, która nie wygląda jak sprzedaż.

### Charakterystyczne zwroty B2B (UŻYWAJ)
- "Cieszę się, że..."
- "Już to robimy"
- "Możecie liczyć na..."
- "Jakby coś było potrzebne — daj znać"
- "Mogę przygotować kolejną dostawę z wyprzedzeniem"
- "Czy trzymać rezerwację?"
- "Proszę dać znać"

### Podpis B2B
Pozdrawiam serdecznie,

Sokólski Mateusz
key account manager w artnapi.pl
mail: mateusz.sokolski@artnapi.pl
telefon: +48 534 852 707
```

4. W sekcji ## WSPÓLNE WZORCE — dodaj brakujące linie z ARTNAPI_OS:
   - `- "to jest to" — naturalny idiom gdy coś rezonuje`
   - `- "co ciekawe" — przejście do ciekawostki/zwrotu akcji`
   - `- Stream of consciousness w casual — myśli płyną, łączone przecinkami i "i"`

5. W sekcji ## CZERWONE LINIE — dodaj brakujące z ARTNAPI_OS:
   - `- "Nie chcę zabierać czasu, ale..." (pasywno-agresywne)`
   - `- "Proszę o informację zwrotną" (corpo)`
   - `- "Pozwolę sobie wrócić do tematu..." (corpo)`
   - `- "Chciałbym zaproponować..." (corpo)`
   - `- "Czy znalazł/a Pan/i chwilę na zapoznanie się z ofertą?" (nachalny FU)`

6. W sekcji ## PRZYKŁADY — dodaj 3 przykłady DM z ARTNAPI_OS:
```markdown
### DM #1 (Skool — opowiadanie o projekcie)
"no więc działałem z Gemini cli i rozwijałem produkt wg wytycznych i teraz mam już pierwsze dogadane deale w zamian za feedback, które posłużą do uwiarygodnienia dalszej sprzedaży. co ciekawe, asystent wyłapał że mam biegły ukraiński i zaproponował otwarcie tam rynku :D"

### DM #2 (Skool — refleksja filozoficzna)
"Poza tym na tym ostatnim live chyba najbardziej spodobał mi się wątek, który nazwałeś "filozoficznym" i co jest naszym nadrzędnym celem w życiu. prywatnie moje wartości doprowadziły mnie do podobnych celów, i chyba dlatego pojawienie się potencjału związanego z asystentami AI... to jest to - bo nie chodzi o by robić więcej, cisnąć, ale czy o to chodzi w życiu...? :-) filzoficznie :)"

### DM #3 (semi-formal, kontakt biznesowy)
"Dzień dobry, pani Olu! Na mailu krótkie pytanie ws. ekspozycji 🙂 i w ogóle będę wdzięczny za update ws. współpracy z UGEARS 🙂"
```

7. W sekcji ## HISTORIA AKTUALIZACJI — dodaj:
   - `- 26.02.2026: MERGE z ARTNAPI_OS ghost_styl.md. Dodano: DM/Casual (Skool, Messenger), B2B Sprzedaż (archetyp Good Cop, podpis B2B, zwroty), maile semi-formal, hedging, 5 nowych czerwonych linii, 3 przykłady DM. Bezpośredniość 7→9/10 (po Biznesowe DNA v2.0).`

**Step 2: Verify merged file**

Sprawdź że plik zawiera sekcje: PODSTAWOWE, LINKEDIN, LINKEDIN DM, DM/CASUAL, MAILE, MAILE SEMI-FORMAL, B2B SPRZEDAŻ, WSPÓLNE WZORCE, FORMATOWANIE, CZERWONE LINIE, PRZYKŁADY (16+ przykładów), HISTORIA.

**Step 3: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add dane/ghost_styl.md && git commit -m "feat: merge ghost_styl.md — add DM/Casual, B2B Sales, semi-formal sections from ARTNAPI"
```

---

### Task 8: Merge decyzje.md — dodaj tagi biznesowe

Oba pliki mają ten sam format. asystent/ = 27K (System 10H decisions), ARTNAPI_OS = 20K (ArtNapi decisions).

**Files:**
- Modify: `dane/decyzje.md`

**Step 1: Tag existing entries**

Przeczytaj cały dane/decyzje.md. Dla każdego wpisu `### [DATA] | [KATEGORIA] | [TEMAT]` dodaj tag `[SYSTEM10H]` po dacie:

Zmień format z:
```
### 26.02.2026 | STRATEGIA + OPERACJE | CEO: PODSUMOWANIE DNIA
```
Na:
```
### [SYSTEM10H] 26.02.2026 | STRATEGIA + OPERACJE | CEO: PODSUMOWANIE DNIA
```

Zrób to dla WSZYSTKICH istniejących wpisów w dane/decyzje.md.

**Step 2: Read ARTNAPI_OS decyzje.md**

Przeczytaj `/Users/mateuszsokolski/ARTNAPI_OS/dane/decyzje.md`. Dla każdego wpisu dodaj tag `[ARTNAPI]` i dopisz na dole sekcji AKTYWNE DECYZJE (po istniejących wpisach [SYSTEM10H]).

Dodaj separator między systemami:

```markdown
---

### === ARTNAPI DECISIONS ===

### [ARTNAPI] 26.02.2026 | OPERACJE | Daily Brief Telegram...
(wpisy z ARTNAPI_OS)
```

**Step 3: Dodaj w nagłówku pliku regułę tagowania**

Na górze pliku, po `## ZASADY`, dodaj:

```markdown
- TAGUJ KAŻDY WPIS: [ARTNAPI] / [SYSTEM10H] / [SHARED]
- LIMIT: ≤100 aktywnych wpisów. Wpisy >30 dni → backup/decyzje_archiwum_YYYY-MM.md
```

**Step 4: Verify**

Sprawdź że każdy wpis ma tag. Policz wpisy — jeśli >100, zarchiwizuj najstarsze do `backup/decyzje_archiwum_2026-02.md`.

**Step 5: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add -A && git commit -m "feat: merge decyzje.md — tag entries [SYSTEM10H]/[ARTNAPI], add ARTNAPI decisions"
```

---

### Task 9: Merge api-inventory.md

asystent/ = 14 narzędzi (16,786 B). ARTNAPI_OS = ~11 narzędzi (12,974 B). Wiele się pokrywa — merge polega na dodaniu unikalnych narzędzi z ARTNAPI_OS.

**Files:**
- Modify: `dane/api-inventory.md`

**Step 1: Read both files and identify unique tools**

Przeczytaj oba pliki. Zidentyfikuj narzędzia które są TYLKO w ARTNAPI_OS:
- Google Sheets (prowizje Artnapi) — CSV URL, zakładki per miesiąc
- Ewentualne różnice w statusach/konfiguracji

**Step 2: Dodaj brakujące narzędzia do asystent/ api-inventory.md**

Po istniejących wpisach, dodaj sekcję:

```markdown
---

## Google Sheets — Prowizje Artnapi (WebFetch, CSV)

- **Do czego:** Arkusz prowizji per miesiąc. Ściągaj przez WebFetch jako CSV.
- **API:** NIE (publiczny URL)
- **MCP:** NIE — WebFetch bezpośredni
- **Kontekst:** Tylko tryb ARTNAPI
- **Base URL:** `https://docs.google.com/spreadsheets/d/e/2PACX-1vR-SUkz1MISFvx0tQGwO02bZenANU-90GYQT1OqxQDia4blrhg0_R7egEm4sqhMdi47HhcuipNo0z3i/pub?output=csv`
- **Zakładki (dodaj &gid=X do URL):**
  - `gid=0` → 10/25 | `gid=1421765063` → 11/25 | `gid=1654399783` → 12/25
  - `gid=1964597183` → 1/26 | `gid=2096709391` → 2/26
- **UWAGA:** URL robi redirect 307 — trzeba zrobić drugi WebFetch na redirect URL
- **Status:** AKTYWNE
- **Koszt:** Free
```

**Step 3: Zaktualizuj tabelę PODSUMOWANIE**

Dodaj Google Sheets do tabeli na górze pliku.

**Step 4: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add dane/api-inventory.md && git commit -m "feat: merge api-inventory.md — add Google Sheets commissions from ARTNAPI"
```

---

### Task 10: Setup .mcp.json — Gmail ArtNapi

**Files:**
- Create: `.mcp.json` (from ARTNAPI_OS)

**Step 1: Copy .mcp.json**

```bash
cp /Users/mateuszsokolski/ARTNAPI_OS/.mcp.json /Users/mateuszsokolski/asystent/.mcp.json
```

**Step 2: Verify content**

Plik powinien zawierać:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@gongrzhe/server-gmail-autoauth-mcp"]
    }
  }
}
```

**Step 3: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add .mcp.json && git commit -m "feat: add .mcp.json with Gmail MCP for artnapi.pl"
```

---

### Task 11: CLAUDE.md — dodaj TRYBY PRACY (routing)

To jest kluczowy task. Dodaj blok routingu do CLAUDE.md. Obecny plik ma 337 linii (16.5 KB). Po edycji powinien mieć ~400 linii (~19-20 KB).

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Dodaj TRYBY PRACY po sekcji KONFIGURACJA PROJEKTU**

Po linii `NIGDY nie pytam o te informacje ponownie. Zawsze je używam.` (linia 49), wstaw:

```markdown

## TRYBY PRACY

Na starcie KAŻDEJ sesji pytam: **"Z czym pracujemy? (artnapi / 10h / ceo)"**

| Tryb | Komendy usera | Pliki kontekstowe | Gmail | Notion CRM DB |
|------|---------------|-------------------|-------|---------------|
| **ARTNAPI** | "artnapi", "art", "napi" | dane/artnapi/* | @artnapi.pl (local .mcp.json) | 19a268dd-5467-4f2a-9eb2-a004efc0ac7e |
| **SYSTEM 10H** | "10h", "bliźniak", "system" | dane/system10h/* | @system10h.com (managed) | 77ac3d5f... |
| **CEO (oba)** | "ceo", "oba", "oba biznesy" | dane/artnapi/* + dane/system10h/* | oba konta | oba CRM |

### MAPOWANIE ŚCIEŻEK PER TRYB

Gdy prompt asystenta odwołuje się do ścieżki — CLAUDE.md mapuje ją na odpowiedni podfolder:

| Ścieżka w prompcie | Tryb ARTNAPI → czyta | Tryb 10H → czyta |
|------|------|------|
| dane/plan.md | dane/artnapi/plan.md | dane/system10h/plan.md |
| dane/oferta.md | dane/artnapi/oferta.md | dane/system10h/oferta.md |
| dane/persona.md | dane/artnapi/persona.md | dane/system10h/persona.md |
| dane/metryki.md | dane/artnapi/metryki.md | dane/system10h/metryki.md |
| dane/projekty-status.md | dane/artnapi/projekty-status.md | dane/system10h/projekty-status.md |
| dane/dane_marketingowe.md | dane/artnapi/dane_marketingowe.md | dane/system10h/dane_marketingowe.md |

**Pliki SHARED (zawsze czytane, niezależnie od trybu):**
dane/profil.md, dane/decyzje.md, dane/lekcje.md, dane/api-inventory.md, dane/ghost_styl.md

### REGUŁA IZOLACJI

- Tryb ARTNAPI: NIE czytaj danych z dane/system10h/ (chyba że tryb CEO)
- Tryb 10H: NIE czytaj danych z dane/artnapi/ (chyba że tryb CEO)
- Tryb CEO: Czytaj oba, ale ZAWSZE oznaczaj źródło: "[ARTNAPI]" lub "[10H]"
- @ghost: Sprawdź ghost_styl.md — użyj odpowiedniej sekcji per kontekst (B2B Sprzedaż dla ArtNapi, LinkedIn DM dla 10H)

### ZMIANA TRYBU W SESJI

User może zmienić tryb w trakcie: "przełącz na artnapi" / "przełącz na 10h" / "tryb ceo"
```

**Step 2: Zaktualizuj sekcję KONFIGURACJA PROJEKTU**

Zaktualizuj listę plików (linie 30-47), zamieniając per-business pliki na nowe ścieżki:

Zamień:
```
- dane/persona.md - idealny klient
- dane/oferta.md - opis produktu/usługi z ceną
- dane/plan.md - cele, pipeline i tracking postępów
- dane/metryki.md - metryki sprzedaży (lejek, konwersje, dashboard)
- dane/dane_marketingowe.md - audyt marketingowy, kanały, budżet
- dane/projekty-status.md - status wszystkich projektów (jedno źródło prawdy)
```

Na:
```
- dane/[tryb]/persona.md - idealny klient (per tryb: artnapi lub system10h)
- dane/[tryb]/oferta.md - opis produktu/usługi z ceną (per tryb)
- dane/[tryb]/plan.md - cele, pipeline i tracking postępów (per tryb)
- dane/[tryb]/metryki.md - metryki sprzedaży (per tryb)
- dane/[tryb]/dane_marketingowe.md - audyt marketingowy (per tryb)
- dane/[tryb]/projekty-status.md - status projektów (per tryb)
```

Dodaj nowy plik do listy:
```
- dane/recon.md - asystent Research & Intelligence (budowanie list, monitoring, kwalifikacja leadów, intel CEE)
```

**Step 3: Dodaj @recon do tabeli TWÓJ ZESPÓŁ**

W tabeli (linia 53-62), dodaj wiersz:

```
| **@recon** | Research & Intelligence, budowanie list, monitoring konkurencji, kwalifikacja leadów | dane/recon.md | `@recon` |
```

**Step 4: Dodaj sekcję WYWOŁANIE RECON**

Po sekcji ## WYWOŁANIE CTO (linia 184-192), dodaj:

```markdown

## WYWOŁANIE RECON

Gdy użytkownik wpisze @recon, uruchamiam pełny prompt z pliku dane/recon.md
Recon to asystent Research & Intelligence (charakter: Q z James Bonda). Pomaga w:
- Systematycznym budowaniu list targetów (Google Maps, rejestry, BIP, social media)
- Monitoringu konkurencji (Phoenix, rynek, cenniki, dostępność)
- Kwalifikacji leadów modelem ICP (100 pkt) + CHAMP-Light
- Głębokim researchu firm (Lead Research Card — pełny profil przed outreachem)
- Inteligencji rynkowej CEE (rejestry firm, frazy w 6 językach, różnice kulturowe)
```

**Step 5: Dodaj @recon do MATRYCA GRANIC**

W tabeli (linia 196-223), dodaj wiersze:

```
| Budowanie list targetów, research firm | **@recon** | @cso, @coo |
| Monitoring konkurencji (Phoenix, rynek) | **@recon** | @cmo |
| Kwalifikacja leadów (ICP scoring) | **@recon** | @cso |
| Research CEE (rejestry, kontakty, język) | **@recon** | @cso |
| Research instytucji publicznych (BIP, WTZ, DK) | **@recon** | @coo |
```

**Step 6: Dodaj @recon do INTEGRACJE MIĘDZY ASYSTENTAMI**

W tabeli (linia 228-248), dodaj wiersze:

```
| **@recon + @cso** | Recon buduje listy + Lead Cards → CSO kontaktuje i zamyka |
| **@recon + @coo** | Recon dostarcza dane researchu → COO planuje tydzień |
| **@recon + @ceo** | Recon dostarcza intel rynkowy → CEO podejmuje decyzje strategiczne |
| **@recon + @cmo** | Recon dostarcza competitive intelligence → CMO dostosowuje kampanie |
| **@cto + @recon** | CTO automatyzuje scraping/monitoring → Recon wykorzystuje dane |
```

**Step 7: Zaktualizuj STRUKTURA PROJEKTU na górze pliku**

Zamień drzewo katalogów (linie 5-25) na:

```
asystent/
├── CLAUDE.md              # Ten plik (instrukcje + routing)
├── .mcp.json              # Gmail artnapi.pl (local MCP)
├── network-profil.yaml    # Profil networkingowy (YAML)
├── dane/                  # Pliki kontekstowe
│   ├── profil.md          # SHARED — profil przedsiębiorcy
│   ├── decyzje.md         # SHARED — baza decyzji (tagowane)
│   ├── lekcje.md          # SHARED — baza lekcji (tagowane)
│   ├── api-inventory.md   # SHARED — inwentarz narzędzi
│   ├── ghost_styl.md      # SHARED — profil stylu komunikacji
│   ├── [agenci].md        # Współdzieleni agenci (coo, cso, cmo, ghost, ceo, cto, pipeline, recon, content)
│   ├── system10h/         # Per-business: System 10H
│   │   ├── plan.md, oferta.md, persona.md, metryki.md, projekty-status.md, dane_marketingowe.md
│   └── artnapi/           # Per-business: ArtNapi
│       ├── plan.md, oferta.md, persona.md, metryki.md, projekty-status.md, crm_sync_protocol.md
├── projekty/              # Projekty System 10H
├── projekty-artnapi/      # Projekty ArtNapi
├── system10h/             # PRODUKT - kod źródłowy System 10h+
├── skills/                # Skille AI
├── materialy/             # Materiały System 10H
├── materialy-artnapi/     # Materiały ArtNapi
├── backup/                # Kopie zapasowe
└── _ARCHIWUM/             # Archiwum
```

**Step 8: Zaktualizuj sekcję FOLDER PROJEKTY/**

Dodaj info o projekty-artnapi/:

```markdown
**Projekty ArtNapi:** `projekty-artnapi/` — 8 projektów ArtNapi B2B (artnapi-b2b-pl, artnapi-cee, wtz-dps, domy-kultury, hotele-winepaint, shein-europe, system-10h, gift-boxy-pbn)
```

**Step 9: Verify CLAUDE.md size**

```bash
wc -c /Users/mateuszsokolski/asystent/CLAUDE.md
```

Expected: ≤20,480 bytes (20 KB). Jeśli >20 KB, przytnij sekcje komentarzy/opisów.

**Step 10: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add CLAUDE.md && git commit -m "feat: CLAUDE.md — add routing (TRYBY PRACY), @recon agent, updated structure"
```

---

### Task 12: CLAUDE.md — dodaj protokoły z ARTNAPI_OS

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Dodaj PROTOCOL ZERO — Startup Check**

Po sekcji TRYBY PRACY, dodaj:

```markdown

## PROTOKÓŁ ZERO — STARTUP CHECK

Na początku KAŻDEJ sesji:
1. Zapytaj o tryb: "Z czym pracujemy? (artnapi / 10h / ceo)"
2. Przeczytaj dane/[tryb]/plan.md — to źródło prawdy o bieżącym stanie
3. Sprawdź datę dzisiejszą i porównaj z Due dates
4. Jeśli Due date < 48h → **ALERT: "[temat] — termin za [X]h!"**
5. Pokaż overdue items PRZED rekomendacjami
```

**Step 2: Dodaj ŹRÓDŁA DANYCH ONLINE (per tryb)**

Po PROTOKÓŁ ZERO, dodaj:

```markdown

## ŹRÓDŁA DANYCH ONLINE

### Tryb ARTNAPI:
- **Arkusz prowizji (Google Sheets CSV):**
  - Base URL: https://docs.google.com/spreadsheets/d/e/2PACX-1vR-SUkz1MISFvx0tQGwO02bZenANU-90GYQT1OqxQDia4blrhg0_R7egEm4sqhMdi47HhcuipNo0z3i/pub?output=csv
  - Zakładki: gid=0 (10/25), gid=1421765063 (11/25), gid=1654399783 (12/25), gid=1964597183 (1/26), gid=2096709391 (2/26)
  - UWAGA: URL robi redirect 307 — trzeba zrobić drugi WebFetch na redirect URL
- **Notion CRM ArtNapi:** Database ID `19a268dd-5467-4f2a-9eb2-a004efc0ac7e`
  - Statusy: Baza → Pierwszy kontakt → Kwalifikacja → Wysłana próbka → Dogrywanie → Zamknięta-Wygrana → Klient/AM
- **Gmail:** Szukaj TYLKO maili na `mateusz.sokolski@artnapi.pl`. Zawsze dodawaj `to:mateusz.sokolski@artnapi.pl`

### Tryb SYSTEM 10H:
- **Notion CRM System 10H:** Database ID `77ac3d5f...` (uzupełni user)
- **Gmail:** Szukaj maili na konto system10h.com (managed connection)

### Oba tryby:
- **Google Calendar:** Wspólny (oba biznesy)
- **Gemini Deep Research:** Wspólny (MCP gemini)
```

**Step 3: Dodaj TOKEN ECONOMY**

```markdown

## TOKEN ECONOMY

Źródła danych kosztują tokeny. Nie ściągaj wszystkiego na ślepo.

**Limity plików:**
- CLAUDE.md ≤ 20 KB
- decyzje.md ≤ 100 aktywnych wpisów (archiwizuj >30 dni → backup/)
- plan.md ≤ 500 linii per tryb

**Arkusz prowizji (Google Sheets):** Ściągaj TYLKO bieżący miesiąc. Poprzednie tylko gdy analiza cykli.

**Notion CRM:**
- PONIEDZIAŁKI + @coo: Zaproponuj CRM Sync audit
- PIĄTKI + @coo: Zaproponuj Pipeline Pulse
- W tygodniu: Fetch CRM tylko gdy (a) dużo prospectingu, (b) user prosi, (c) update Due/Status
- NIE rób pełnego fetcha CRM przy każdym @coo — plan.md wystarczy na co dzień

**Pliki lokalne:** Czytaj ZAWSZE — zero kosztu tokenów online.
```

**Step 4: Dodaj CRM RULES**

```markdown

## REGUŁY CRM (TRYB ARTNAPI)

Po każdym kontakcie z leadem (@cso/@ghost) — DAILY MICRO-SYNC:
1. AKTUALIZUJ Notion CRM: `Due` (+3 dni robocze), `ostatni kontakt` (dziś), `notatki` (+= 1 zdanie)
2. NIE aktualizuj plan.md — to robi weekly audit (Pipeline Pulse)
3. Potwierdź userowi: "Notion CRM zaktualizowany: [firma] Due [data]"
4. Pełny protokół → dane/artnapi/crm_sync_protocol.md

### Gmail MCP (tryb ARTNAPI):
- ZAWSZE dodawaj `to:mateusz.sokolski@artnapi.pl` do search queries
- **ŻELAZNA ZASADA: NIGDY nie używaj `send_email` — TYLKO `draft_email`.** User sam wysyła. Bez wyjątków.
```

**Step 5: Dodaj OCHRONA PRZED SHINY OBJECT SYNDROME**

```markdown

## OCHRONA PRZED SHINY OBJECT SYNDROME

User jest ENTP-A (dane/profil.md). Supermoce: kreatywność, szybka realizacja. Ciemna strona: Shiny Object Syndrome.

Gdy user proponuje NOWY POMYSŁ/KIERUNEK/PROJEKT:
1. Test 30-dniowego ROI: "Przyniesie kasę w 30 dni? Jeśli nie → Pomysły na Później"
2. Pokaż aktualny plan: "Masz teraz [X] otwartych priorytetów. Który usuwasz żeby dodać nowy?"
3. NIE entuzjazmuj się razem z userem. Przedstaw fakty.
4. Jeśli user NALEGA — OK, ale zapisz decyzję z uzasadnieniem i kosztem alternatywnym.
```

**Step 6: Verify CLAUDE.md size again**

```bash
wc -c /Users/mateuszsokolski/asystent/CLAUDE.md
```

Expected: ~19-20 KB. Max 20,480 bytes.

**Step 7: Commit**

```bash
cd /Users/mateuszsokolski/asystent && git add CLAUDE.md && git commit -m "feat: CLAUDE.md — add Protocol Zero, Online Data Sources, Token Economy, CRM Rules, SOS protection"
```

---

### Task 13: Weryfikacja — test routingu

**Step 1: Sprawdź strukturę plików**

```bash
cd /Users/mateuszsokolski/asystent
echo "=== dane/ root ===" && ls dane/*.md | sort
echo "=== dane/system10h/ ===" && ls dane/system10h/*.md | sort
echo "=== dane/artnapi/ ===" && ls dane/artnapi/*.md | sort
echo "=== projekty-artnapi/ ===" && ls projekty-artnapi/
echo "=== materialy-artnapi/ ===" && ls materialy-artnapi/
echo "=== .mcp.json ===" && cat .mcp.json
echo "=== CLAUDE.md size ===" && wc -c CLAUDE.md
```

Expected:
- dane/ root: profil.md, decyzje.md, lekcje.md, api-inventory.md, ghost_styl.md + 9 agentów (coo, cso, cmo, ghost, ceo, cto, pipeline, recon, contentmachine)
- dane/system10h/: 6 plików per-business
- dane/artnapi/: 7 plików per-business (+ crm_sync_protocol, archiwum_decyzji)
- projekty-artnapi/: 8 subdirectories
- materialy-artnapi/: ~10+ files
- .mcp.json: gmail config
- CLAUDE.md: ≤20 KB

**Step 2: Sprawdź tagi w decyzje.md**

```bash
grep -c "\[SYSTEM10H\]" /Users/mateuszsokolski/asystent/dane/decyzje.md
grep -c "\[ARTNAPI\]" /Users/mateuszsokolski/asystent/dane/decyzje.md
```

Expected: Both counts > 0.

**Step 3: Sprawdź tagi w lekcje.md**

```bash
grep -c "\[ARTNAPI\]" /Users/mateuszsokolski/asystent/dane/lekcje.md
```

Expected: 13 (all ARTNAPI entries).

**Step 4: Sprawdź ghost_styl.md sekcje**

```bash
grep "^## " /Users/mateuszsokolski/asystent/dane/ghost_styl.md
```

Expected: PODSTAWOWE, LINKEDIN, LINKEDIN DM, DM / CASUAL, MAILE, MAILE SEMI-FORMAL, B2B SPRZEDAŻ, WSPÓLNE WZORCE, FORMATOWANIE, CZERWONE LINIE, PRZYKŁADY, HISTORIA.

**Step 5: Sprawdź CLAUDE.md zawiera routing**

```bash
grep "TRYBY PRACY" /Users/mateuszsokolski/asystent/CLAUDE.md
grep "PROTOKÓŁ ZERO" /Users/mateuszsokolski/asystent/CLAUDE.md
grep "TOKEN ECONOMY" /Users/mateuszsokolski/asystent/CLAUDE.md
grep "@recon" /Users/mateuszsokolski/asystent/CLAUDE.md | head -5
```

Expected: All grep commands find matches.

**Step 6: Final commit**

```bash
cd /Users/mateuszsokolski/asystent && git add -A && git commit -m "consolidation: final verification — all files in place, routing confirmed"
```

---

### Task 14: Porządki i dokumentacja

**Step 1: Zaktualizuj .gitignore**

Dodaj do .gitignore:

```
# Duże pliki binarne
*.xlsx
```

**Step 2: Sprawdź .env jest chroniony**

```bash
ls -la /Users/mateuszsokolski/asystent/.env
```

Expected: permissions `-rw-------` (600).

**Step 3: Final git status**

```bash
cd /Users/mateuszsokolski/asystent && git status && git log --oneline -10
```

**Step 4: Commit if needed**

```bash
cd /Users/mateuszsokolski/asystent && git add -A && git commit -m "chore: final cleanup — gitignore, permissions verified"
```

---

## Rollback Plan

Jeśli cokolwiek nie działa:

```bash
# Przywróć asystent/ z backupu
rm -rf /Users/mateuszsokolski/asystent
cp -r /Users/mateuszsokolski/asystent_backup_2026-02-26 /Users/mateuszsokolski/asystent

# ARTNAPI_OS jest nietknięty — backup dla pewności
# cp -r /Users/mateuszsokolski/ARTNAPI_OS_backup_2026-02-26 /Users/mateuszsokolski/ARTNAPI_OS
```

Czas rollbacku: <1 min.

---

## Checklist podsumowujący

- [ ] Task 1: Safety Net (backup obu systemów)
- [ ] Task 2: Move System 10H per-business files to dane/system10h/
- [ ] Task 3: Copy ArtNapi per-business files to dane/artnapi/
- [ ] Task 4: Copy ArtNapi projects and materials
- [ ] Task 5: Copy @recon agent
- [ ] Task 6: Merge lekcje.md (13 lessons with [ARTNAPI] tags)
- [ ] Task 7: Merge ghost_styl.md (DM/Casual, B2B Sales, semi-formal)
- [ ] Task 8: Merge decyzje.md (tag all entries [SYSTEM10H]/[ARTNAPI])
- [ ] Task 9: Merge api-inventory.md (add Google Sheets)
- [ ] Task 10: Setup .mcp.json (Gmail artnapi.pl)
- [ ] Task 11: CLAUDE.md — routing (TRYBY PRACY, @recon, updated structure)
- [ ] Task 12: CLAUDE.md — protocols (Protocol Zero, Data Sources, Token Economy, CRM, SOS)
- [ ] Task 13: Verification (structure, tags, routing, sizes)
- [ ] Task 14: Cleanup (gitignore, permissions, final commit)
