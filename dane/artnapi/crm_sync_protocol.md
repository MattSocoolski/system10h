# PROTOKÓŁ CRM SYNC — WEEKLY AUDIT + DAILY MICRO

> Utworzono: 19.02.2026 | Źródło: decyzje.md (19.02.2026) | Design: docs/plans/2026-02-19-crm-sync-design.md

---

## WEEKLY AUDIT — PROCEDURA

### KIEDY
- **Poniedziałek:** @coo proponuje automatycznie na starcie sesji
- **Piątek:** @coo proponuje Pipeline Pulse (mini-wersja)
- **Ręcznie:** `@coo crm sync` w dowolnym momencie

### JAK (3 agenty równoległe)

```
DISPATCH:
├── Agent PL     → Notion filtr: kraj=PL, segment=hurt/reseller
├── Agent CEE    → Notion filtr: kraj=LT/LV/EE/HU/CZ
└── Agent Events → Notion filtr: segment=eventy/WTZ/DPS/agencje
```

**Każdy agent wykonuje:**
1. Fetch wszystkich leadów z Notion CRM (swojego segmentu)
2. Dla każdego leada: szukaj maili w Gmail (`to:mateusz.sokolski@artnapi.pl` + nazwa firmy)
3. Cross-reference z plan.md (sekcja STATUS LEJKA + ACCOUNT MANAGEMENT)
4. Zastosuj REGUŁY AUTO-FIX (poniżej)
5. Zgłoś FLAGI (poniżej)
6. Zaktualizuj Notion CRM (auto-fixy)
7. Zwróć raport tekstowy

### NOTION CRM — DANE TECHNICZNE

- Database ID: `19a268dd-5467-4f2a-9eb2-a004efc0ac7e`
- Data Source: `collection://26f862e1-4a0c-808f-a249-000b2cee31df`
- Statusy: Baza → Pierwszy kontakt → Kwalifikacja potrzeby → Wysłana próbka → Dogrywanie → Zamknięta - Wygrana → Klient/AM
- Priorytety: Zimny, Ciepły, Gorący

---

## REGUŁY AUTO-FIX (agent naprawia bez pytania)

| # | Reguła | Warunek | Akcja |
|---|--------|---------|-------|
| AF1 | Due date przeszła >3 dni | `Due < dziś - 3` AND status != Zamknięta | Ustaw `Due = dziś + 3 dni robocze` |
| AF2 | Telefon bez kodu kraju | Phone nie zaczyna się od "+" | Dodaj kod na podstawie pola "kraj" (+48 PL, +370 LT, +371 LV, +372 EE, +36 HU, +420 CZ) |
| AF3 | Puste "ostatni kontakt" ale jest mail w Gmail | `ostatni kontakt` = puste AND Gmail ma maile | Ustaw `ostatni kontakt = data najnowszego maila` |
| AF4 | Status "Baza" ale był mail wysłany | Status = "Baza (research)" AND Gmail ma outgoing mail | Zmień status na "Pierwszy kontakt" |
| AF5 | Brak "nazwa klienta" | `nazwa klienta` = puste AND `Task name` istnieje | Kopiuj `Task name → nazwa klienta` |
| AF6 | Summary pusty | `Summary` = puste AND (`notatki` lub Gmail mają dane) | Generuj 1-zdaniowe podsumowanie z kontekstu |
| AF7 | Stale deal >21 dni | `ostatni kontakt < dziś - 21` AND status aktywny | Dodaj do notatek: "⚠️ STALE [X]d — revisit?" |

---

## FLAGI (agent raportuje, user decyduje)

| # | Flaga | Warunek | Pytanie do usera |
|---|-------|---------|-----------------|
| F1 | Wartość = 0 | `wartość szansy = 0` AND status >= "Kwalifikacja potrzeby" | "Oszacuj wartość?" |
| F2 | Zero maili | Gmail brak maili AND status >= "Pierwszy kontakt" | "Outreach nie doszedł?" |
| F3 | Overdue >30d | `Due < dziś - 30` | "Kill / reactivate?" |
| F4 | Konflikt danych | Telefon/mail w Notion != Gmail signature | "Który poprawny?" |
| F5 | Brak w prowizjach | Status = "Zamknięta-Wygrana" AND brak w arkuszu prowizji | "Dodać do Sheets?" |
| F6 | Duplikat | Ten sam lead w 2+ bazach (Pipeline `19a268dd` + BAZA KLIENTÓW `27e862e1`) | "Który zostawić? Archiwizuję duplikat." |

---

## PROCEDURA ARCHIVE (po decyzji "Kill" lub "Duplikat")

### Kiedy
- F3: User odpowiedział "Kill" na leada overdue >30d
- F6: Wykryto duplikat leada między bazami

### Jak
```bash
node automatyzacje/notion-archive.js PAGE_ID
```
Archiwizuje stronę (soft-delete → kosz Notion, odwracalne 30 dni).

### Zasady
- **ZAWSZE pytaj usera** przed archiwizacją — NIGDY automatycznie
- **ZAWSZE sprawdź OBE bazy** (`19a268dd` Pipeline + `27e862e1` BAZA KLIENTÓW) przed uznaniem za duplikat
- Po archiwizacji: potwierdź userowi "Zarchiwizowano: [firma] (PAGE_ID). Odwracalne 30 dni w koszu Notion."
- Jeśli lead ma historię kontaktu → PRZENIEŚ notatki do zachowanego rekordu PRZED archiwizacją

---

## FORMAT PIPELINE PULSE (do plan.md)

Wklejane w sekcję AKTUALNY MIESIĄC, po ostatnim checkboxie "Do zrobienia:":

```
### PIPELINE PULSE — [DATA] (weekly audit)
- **Pipeline:** [X] leady | [Y] aktywnych | ~[Z] PLN wartość
- **Segmenty:** PL [X] ([Y]k) | CEE [X] ([Y]k) | Events+WTZ [X] ([Y]k)
- **Auto-fix:** [X] dat, [Y] telefonów, [Z] statusów naprawionych
- **Flagi:** [lista flag do decyzji]
- **Stale >14d:** [X] leadów
```

---

## FORMAT RAPORTU (konsola — nie zapisywany do pliku)

```
═══ CRM SYNC REPORT — [DATA] ═══

AUTO-FIXED:
✅ [Firma] — [co naprawione]

FLAGI:
🔴 F[X]: [Firma] — [opis]. [Pytanie]
🟡 F[X]: [Firma] — [opis]. [Sugestia]

PIPELINE HEALTH:
- Aktywne: [X]/[Y] ([Z]%)
- Stale >14d: [X] ([Y]%)
- Win rate (miesiąc): [X] zamknięte / [Y] = [Z]%
- Średni wiek deala: [X] dni
═══════════════════════════════════════
```

---

## DAILY MICRO-SYNC

### Zasada
Po KAŻDYM kontakcie z leadem (mail, telefon, spotkanie) → asystent (@cso/@ghost) automatycznie aktualizuje Notion CRM:

| Pole | Wartość |
|------|---------|
| Due | +3 dni robocze od dziś |
| ostatni kontakt | dzisiejsza data |
| notatki | += "[data]: [1 zdanie co zrobiono]" |

### Czego NIE robimy daily
- NIE aktualizujemy plan.md (to robi weekly audit)
- NIE zmieniamy statusu pipeline (chyba że oczywista zmiana, np. "Zamknięta - Wygrana")
- NIE fetchujemy pełnego CRM

### Potwierdzenie dla usera
Po każdym update: "Notion CRM zaktualizowany: [firma] Due [data], ostatni kontakt [data]"

---

## ŹRÓDŁA PRAWDY

| Typ danych | Master | Sync | Częstotliwość |
|------------|--------|------|---------------|
| Kontakty, pipeline | Notion CRM | → plan.md (Pulse) | Weekly |
| Zadania, priorytety | plan.md | ← Notion (read) | Daily read |
| Finanse, prowizje | Google Sheets | → plan.md (monthly) | Monthly |
| Historia maili | Gmail | → Notion (notatki) | Per contact |

---

*Protokół v1.0 — 19.02.2026*