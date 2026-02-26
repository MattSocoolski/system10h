# Design: Konsolidacja asystent/ + ARTNAPI_OS/ → Monorepo + Routing

**Data:** 2026-02-26
**Status:** ZATWIERDZONY
**Autorzy:** @cto (asystent/) + @cto (ARTNAPI_OS/) + @ceo
**Zatwierdzenie:** User approved all 5 sections

---

## Problem

Dwa oddzielne systemy AI asystentów z niemal identyczną architekturą:
- `asystent/` — System 10H / Bliźniaki Biznesowe (AI consulting)
- `ARTNAPI_OS/` — ArtNapi B2B (e-commerce, canvas/malowanie po numerach)

Konsekwencje: podwójny koszt tokenów (~40-50% overhead), brak cross-pollination wiedzy, @coo nie widzi obu biznesów, profil/decyzje/lekcje rozdzielone.

## Rozwiazanie

**Monorepo + Routing** — jeden folder `asystent/`, jeden CLAUDE.md z trybami pracy, dane per biznes w podfolderach.

---

## Sekcja 1/5: Struktura plikow

```
asystent/
├── CLAUDE.md                    # Unified (z routing table)
├── .env                         # Klucze API (permissions 600)
├── .gitignore                   # Ochrona .env, backup/
├── .mcp.json                    # Gmail artnapi.pl (local MCP)
├── network-profil.yaml          # Profil networkingowy
│
├── dane/
│   ├── profil.md                # SHARED — jeden profil (v8.2)
│   ├── decyzje.md               # SHARED — tagowane [ARTNAPI]/[SYSTEM10H]/[SHARED]
│   ├── lekcje.md                # SHARED — tagowane
│   ├── api-inventory.md         # SHARED — merged (14+11 narzedzi)
│   ├── ghost_styl.md            # SHARED — merged (LI + DM/Casual)
│   │
│   ├── coo.md                   # Agent — shared
│   ├── cso.md                   # Agent — shared
│   ├── cmo.md                   # Agent — shared
│   ├── ghost.md                 # Agent — shared
│   ├── contentmachine.md        # Agent — shared
│   ├── ceo.md                   # Agent — shared
│   ├── cto.md                   # Agent — shared
│   ├── pipeline.md              # Agent — shared (z System 10H)
│   ├── recon.md                 # Agent — shared (z ARTNAPI_OS, 37KB)
│   │
│   ├── system10h/               # Per-business: System 10H
│   │   ├── plan.md
│   │   ├── oferta.md
│   │   ├── persona.md
│   │   ├── metryki.md
│   │   ├── projekty-status.md
│   │   └── dane_marketingowe.md
│   │
│   └── artnapi/                 # Per-business: ArtNapi
│       ├── plan.md
│       ├── oferta.md
│       ├── persona.md
│       ├── metryki.md
│       ├── projekty-status.md
│       └── dane_marketingowe.md
│
├── projekty/                    # Projekty System 10H (existing)
│   ├── sprzedaz-solo/
│   ├── stalton/
│   ├── andrzej/
│   ├── zbigniew/
│   └── lena/
│
├── projekty-artnapi/            # Projekty ArtNapi (z ARTNAPI_OS/projekty/)
│   └── [8 projektow ArtNapi]
│
├── materialy/                   # Materialy System 10H (existing)
│   ├── zasoby/
│   └── dokumenty/
│
├── materialy-artnapi/           # Materialy ArtNapi (z ARTNAPI_OS/materialy/)
│   └── [20+ plikow]
│
├── system10h/                   # Kod zrodlowy produktu (existing)
├── skills/                      # Skille AI (existing)
├── backup/                      # Backupy (existing)
├── _ARCHIWUM/                   # Archiwum (existing)
└── docs/plans/                  # Design docs (existing)
```

**Kluczowa decyzja:** Agenci (coo, cso, cmo, ghost, cto, ceo, content) zostaja na poziomie `dane/` — NIE przenoszeni do podfolderow. Routing w CLAUDE.md kieruje ich do odpowiednich plikow per tryb.

---

## Sekcja 2/5: Routing w CLAUDE.md

Dodanie ~40 linii do CLAUDE.md (~3.2 KB). Finalny CLAUDE.md ~19.7 KB (pod limitem 25 KB).

### Blok routingu:

```markdown
## TRYBY PRACY

Na starcie KAZDEJ sesji pytam: "Z czym pracujemy? (artnapi / 10h / ceo)"

| Tryb | Komendy usera | Pliki kontekstowe | Gmail | Notion CRM DB |
|------|---------------|-------------------|-------|---------------|
| ARTNAPI | "artnapi", "art", "napi" | dane/artnapi/* | @artnapi.pl (local .mcp.json) | 19a268dd... |
| SYSTEM 10H | "10h", "blizniak", "system" | dane/system10h/* | @system10h.com (managed) | 77ac3d5f... |
| CEO (oba) | "ceo", "oba", "oba biznesy" | dane/artnapi/* + dane/system10h/* | oba konta | oba CRM |

### MAPOWANIE SCIEZEK PER TRYB

Gdy prompt asystenta odwoluje sie do sciezki — CLAUDE.md mapuje ja na odpowiedni podfolder:

| Sciezka w prompcie | Tryb ARTNAPI → czyta | Tryb 10H → czyta |
|------|------|------|
| dane/plan.md | dane/artnapi/plan.md | dane/system10h/plan.md |
| dane/oferta.md | dane/artnapi/oferta.md | dane/system10h/oferta.md |
| dane/persona.md | dane/artnapi/persona.md | dane/system10h/persona.md |
| dane/metryki.md | dane/artnapi/metryki.md | dane/system10h/metryki.md |
| dane/projekty-status.md | dane/artnapi/projekty-status.md | dane/system10h/projekty-status.md |
| dane/dane_marketingowe.md | dane/artnapi/dane_marketingowe.md | dane/system10h/dane_marketingowe.md |

**Pliki SHARED (zawsze czytane, niezaleznie od trybu):**
dane/profil.md, dane/decyzje.md, dane/lekcje.md, dane/api-inventory.md, dane/ghost_styl.md

### REGULA IZOLACJI

- Tryb ARTNAPI: NIE czytaj danych z dane/system10h/ (chyba ze tryb CEO)
- Tryb 10H: NIE czytaj danych z dane/artnapi/ (chyba ze tryb CEO)
- Tryb CEO: Czytaj oba, ale ZAWSZE oznaczaj zrodlo: "[ARTNAPI]" lub "[10H]"
- @ghost: Sprawdz ghost_styl.md — uzyj odpowiedniej sekcji per kontekst (LI vs DM/Casual)

### ZMIANA TRYBU W SESJI

User moze zmienic tryb w trakcie: "przelacz na artnapi" / "przelacz na 10h" / "tryb ceo"
```

**Kluczowa zaleta:** Zero zmian w plikach agentow (coo.md, cso.md itd.) — CLAUDE.md routing table przechwytuje referencje do sciezek. Eliminuje problem 52 twardych referencji zidentyfikowanych przez CTO ARTNAPI_OS.

---

## Sekcja 3/5: Protokoly z ARTNAPI_OS do wlaczenia

### Wlaczone do glownego CLAUDE.md (5 protokolow):

1. **Protocol Zero: Startup Check** — Na starcie sesji: sprawdz tryb + przeczytaj plan.md + sprawdz due dates. Jesli due date < 48h → ALERT.

2. **Online Data Sources** — Tabela zrodel danych per tryb:
   - Gmail: artnapi.pl (local .mcp.json) vs system10h.com (managed)
   - Notion CRM: database ID per tryb
   - Google Calendar: wspoldzielony (oba biznesy)
   - Gemini Deep Research: wspoldzielony

3. **Token Economy** — Max rozmiar plikow:
   - CLAUDE.md ≤ 20 KB
   - decyzje.md ≤ 100 aktywnych wpisow
   - plan.md ≤ 500 linii per tryb
   - Archiwizacja: wpisy >30 dni → backup/

4. **CRM Rules** — Notion jako CRM: po kazdej akcji sprzedazowej → aktualizuj Notion. Database ID z routing table.

5. **@recon Agent** — Research & Intelligence (37 KB, unikalny dla ArtNapi). Dodany do tabeli agentow w CLAUDE.md, dostepny w obu trybach.

### Pozostaja w per-mode plikach (NIE w CLAUDE.md):

- ARTNAPI_OS specifics (prowizje Google Sheets, opisy produktow) → w dane/artnapi/plan.md
- System 10H specifics (Blizniaki pipeline, SD skrypty) → w dane/system10h/plan.md

---

## Sekcja 4/5: Strategia merge plikow wspoldzielonych

### 1. profil.md → ZACHOWAJ wersje z asystent/ (v8.2, nowsza)
- Dopisz brakujace elementy z ARTNAPI_OS v6.0 (jesli sa)
- Jeden profil, jedna osoba

### 2. decyzje.md → MERGE z tagami
- Format: `### [ARTNAPI] Decyzja #XX: ...` / `### [SYSTEM10H] Decyzja #XX: ...` / `### [SHARED] Decyzja #XX: ...`
- Wpisy z obu systemow w jednym pliku
- Archiwizacja: wpisy >30 dni → backup/decyzje_archiwum_YYYY-MM.md
- Limit: ≤100 aktywnych wpisow

### 3. lekcje.md → MERGE z tagami
- asystent/ wersja: 708 bytes (malo)
- ARTNAPI_OS wersja: 3,989 bytes (wiecej lekcji)
- Merge obu, tagowanie [ARTNAPI]/[SYSTEM10H]/[SHARED]

### 4. api-inventory.md → MERGE
- asystent/: 14 narzedzi (16,786 bytes)
- ARTNAPI_OS: ~11 narzedzi (12,974 bytes)
- Usun duplikaty, zachowaj unikalne (np. Google Sheets z ARTNAPI, Telegram z asystent/)

### 5. ghost_styl.md → MERGE
- asystent/ (6,957 bytes): LinkedIn insights (punch-line compression, narrative distance, CTA patterns)
- ARTNAPI_OS (8,036 bytes): DM/Casual section (stream of consciousness, old-school emoticons)
- Polacz obie sekcje — @ghost potrzebuje pelnego profilu stylu

---

## Sekcja 5/5: Plan implementacji

### Faza 0: Safety Net (5 min)
- `cp -r asystent/ asystent_backup_2026-02-26/`
- `cp -r ARTNAPI_OS/ ARTNAPI_OS_backup_2026-02-26/`
- Pelne kopie obu systemow przed jakimikolwiek zmianami

### Faza 1: Struktura folderow (10 min)
- Utworz `dane/system10h/` i `dane/artnapi/`
- Przenies pliki per-business z `dane/` do `dane/system10h/` (plan, oferta, persona, metryki, projekty-status, dane_marketingowe)
- Skopiuj pliki per-business z `ARTNAPI_OS/dane/` do `dane/artnapi/`
- Utworz `projekty-artnapi/` i `materialy-artnapi/`
- Skopiuj projekty i materialy z ARTNAPI_OS

### Faza 2: Merge plikow shared (20 min)
- profil.md: zachowaj v8.2, dopisz brakujace z v6.0
- decyzje.md: merge z tagami [ARTNAPI]/[SYSTEM10H]/[SHARED]
- lekcje.md: merge z tagami
- api-inventory.md: merge, usun duplikaty
- ghost_styl.md: merge obu sekcji

### Faza 3: Nowi agenci (5 min)
- Skopiuj `ARTNAPI_OS/dane/recon.md` → `dane/recon.md`
- Zweryfikuj ze pipeline.md (juz istniejacy) jest kompletny

### Faza 4: CLAUDE.md upgrade (30 min)
- Dodaj blok TRYBY PRACY z routing table
- Dodaj Protocol Zero: Startup Check
- Dodaj Online Data Sources per tryb
- Dodaj Token Economy rules
- Dodaj CRM Rules
- Dodaj @recon i @pipeline do tabeli agentow
- Zaktualizuj matryca granic
- Target: ≤20 KB

### Faza 5: MCP i bezpieczenstwo (10 min)
- Skopiuj `.mcp.json` z ARTNAPI_OS (Gmail artnapi.pl)
- Zweryfikuj ze .env ma permissions 600
- Zweryfikuj .gitignore chroni .env, backup/
- ARTNAPI_OS zyskuje bezpieczenstwo (nie miala .env ani .gitignore)

### Faza 6: Weryfikacja (15 min)
- Uruchom sesje w trybie "artnapi" — sprawdz czy routing dziala
- Uruchom sesje w trybie "10h" — sprawdz czy routing dziala
- Uruchom sesje w trybie "ceo" — sprawdz czy widzi oba biznesy
- Sprawdz @ghost z obu kontekstow
- Sprawdz @pipeline i @recon

### Rollback plan
Jesli cokolwiek nie dziala:
```bash
rm -rf asystent/
mv asystent_backup_2026-02-26/ asystent/
```
Czas rollbacku: <1 min.

---

## Metryki sukcesu

| Metryka | Przed | Po |
|---------|-------|----|
| Terminale Claude Code | 2 | 1 |
| Koszt tokenow na sesje | ~10-12K tokenow (2x CLAUDE.md) | ~5-6K tokenow (1x CLAUDE.md) |
| Cross-pollination decyzji | 0% | 100% |
| @coo widzi oba biznesy | NIE | TAK (tryb CEO) |
| Bezpieczenstwo ARTNAPI (.env, .gitignore) | BRAK | PELNE |
| Czas setup nowej sesji | 2x (dwa terminale) | 1x + wybor trybu |

---

## Ryzyka i mitygacja

| Ryzyko | Prawdopodobienstwo | Mitygacja |
|--------|-------------------|-----------|
| Zapomniany routing (agent czyta zly plik) | Srednie | CLAUDE.md routing table + regula izolacji |
| Cross-kontaminacja (dane ArtNapi w outreachu 10H) | Niskie | @ghost sprawdza ghost_styl.md per kontekst |
| CLAUDE.md za duzy (>25KB) | Niskie | Token economy rules, archiwizacja |
| Pomylone Gmail konto | Niskie | Explicit routing: local .mcp.json vs managed |
| Pomylony Notion CRM | Niskie | Database ID per tryb w routing table |

---

## Decyzja architektoniczna

**Wybrano Monorepo + Routing** zamiast:
- ~~Symlink~~ (kruche, problemy z git)
- ~~Hub+Spoke~~ (zbyt zlozony setup)
- ~~Status quo z sync~~ (nie rozwiazuje problemu tokenow)
- ~~Pelne polaczenie bez izolacji~~ (ryzyko pomylenia kontekstow)

Monorepo + Routing daje najlepszy balans: oszczednosc tokenow (40-50%), izolacja danych (soft routing), cross-pollination (shared files), prostota (jeden folder, jeden terminal).
