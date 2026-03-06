# SPEC: RAPORT TYGODNIOWY B2B — AUTOMATYZACJA

> Zlecenie: CEO 06.03.2026
> Cel: Generowac raport w formacie Piotra co piatek, max 5 min pracy recznej.
> Output: Plik XLSX w formacie szablonu Piotra (Szablon_raportu_tygodniowego_B2B.xlsx)

---

## FORMAT RAPORTU (wymagania Piotra)

### SEKCJA A: PODSUMOWANIE LICZBOWE TYGODNIA

| KPI | Zrodlo danych | Jak liczyc |
|-----|--------------|------------|
| Nowe firmy skontaktowane | Notion CRM: nowe rekordy z tego tygodnia (created_time) | COUNT WHERE created_time IN this_week |
| Rozmowy handlowe | Gmail SENT (mail z trescia > nudge) + manual tag | COUNT sent emails z trescia ofertowa + telefony (manual) |
| Wyslane oferty | Gmail SENT: maile z cenami/cennikiem | COUNT sent WHERE body contains "PLN" + "cennik/oferta/cena" |
| Follow-upy | Gmail SENT: maile "Re:" do leadow | COUNT sent WHERE subject starts "Re:" AND to = lead |
| Nowi klienci (1. zamowienie) | Arkusz prowizji: nowe firmy w tym tygodniu | Manual z arkusza (ewentualnie sync) |
| Klienci powracajacy | Arkusz prowizji: firmy z >1 zamowieniem | Manual z arkusza |
| Sprzedane sztuki | Arkusz prowizji: suma szt w tygodniu | SUM ilosc WHERE data_zamowienia IN this_week |

### SEKCJA B: LISTA NOWYCH FIRM + AKTYWNE TEMATY

| Pole | Zrodlo | Mapping |
|------|--------|---------|
| Firma | Notion CRM: Name | property "Name" |
| Kraj | Notion CRM | property "Kraj" lub "Country" |
| Segment | Notion CRM | property "Segment" / "Kategoria" |
| Etap | Notion CRM | property "Status" (Baza/Pierwszy kontakt/Kwalifikacja/...) |
| Potencjalny wolumen (szt) | Notion CRM | property "Wartosc" (przelicz na szt) lub manual |
| Data ostatniego kontaktu | Notion CRM | property "Ostatni kontakt" |
| Nastepny krok | Notion CRM | property "Notatki" (ostatnia linia) lub manual |

Filtr: Status != "Zamknieta-Wygrana" AND Status != "Klient/AM" AND ostatni_kontakt >= this_week_start OR created >= this_week_start

### SEKCJA C: KROTKI KOMENTARZ

Generowany przez @ghost na podstawie:
- Sekcja A (liczby) + Sekcja B (lista)
- Morning feed ostatni (dane/artnapi/morning-feed.md)
- 3 pytania: co domkniete? co utknelo? gdzie potrzebna decyzja Piotra?

---

## ARCHITEKTURA AUTOMATYZACJI

### OPCJA A: SKRYPT NODE.JS (rekomendacja @cto)

```
automatyzacje/generate-weekly-report.js

INPUT:
  1. Notion CRM (API) → lista leadow, statusy, daty
  2. Gmail (API) → sent count, FU count, nowe firmy
  3. Arkusz prowizji (Google Sheets API) → zamowienia, szt, klienci

PROCESS:
  1. Fetch Notion: all pages WHERE last_edited >= monday
  2. Fetch Gmail: sent emails this week (to:mateusz.sokolski@artnapi.pl)
  3. Fetch Sheets: zamowienia z tego tygodnia
  4. Oblicz KPI (sekcja A)
  5. Zbuduj liste firm (sekcja B)
  6. Wygeneruj komentarz (sekcja C) — opcja: Claude API lub manual

OUTPUT:
  - XLSX w formacie Piotra (uzyj exceljs/xlsx library)
  - Zapisz: materialy-artnapi/raporty/raport_tyg_YYYY-WXX.xlsx
  - Opcja: draft Gmail z raportem do Piotra
```

### OPCJA B: CLAUDE CODE MANUAL (szybsza do wdrozenia)

```
Co piatek o 16:00:
1. @coo generuje raport z danych:
   - Notion CRM fetch (aktywne leady, nowe, statusy)
   - Gmail sent count (morning-feed.md jako proxy)
   - Arkusz prowizji (manual input od usera)
2. @ghost formatuje komentarz
3. User eksportuje do XLSX i wysyla
```

---

## MAPPING STATUSOW CRM → ETAPY PIOTRA

| Notion CRM Status | Etap w raporcie Piotra |
|-------------------|----------------------|
| Baza | Pierwszy kontakt |
| Pierwszy kontakt | Pierwszy kontakt |
| Kwalifikacja potrzeby | Rozmowa |
| Wyslana probka | Oferta |
| Dogrywanie | Negocjacje |
| Zamknieta-Wygrana | Zamowienie |
| Klient/AM | Powtarzalny klient |

---

## DANE DODATKOWE (czego Piotr chce, a nie ma w CRM)

| Pole | Skad wziac | Akcja |
|------|-----------|-------|
| Potencjalny wolumen (szt) | NIE MA w Notion | Dodac property "Potencjal szt" do CRM |
| Kraj | Czesciowo jest | Uzupelnic dla wszystkich leadow |
| Segment | Jest jako "Kategoria" | OK — mapping 1:1 |
| Telefony/calle | NIE MA nigdzie | Manual input (user liczy) |

---

## PLAN WDROZENIA

| Faza | Co | Kiedy | Kto |
|------|-----|-------|-----|
| 1 | Raport #1 MANUAL (Claude Code + user) | pt 13.03 | @coo + user |
| 2 | Dodac "Potencjal szt" + "Kraj" do Notion CRM | pon 10.03 | user |
| 3 | Skrypt generate-weekly-report.js (MVP) | 17-21.03 | @cto |
| 4 | Automatyczny draft Gmail z raportem | 24.03+ | @cto |

---

## PRZYKLADOWY OUTPUT (sekcja A)

```
Raport tygodniowy — sprzedaz B2B
Tydzien: 2026-03-09 – 2026-03-13 | Handlowiec: Mateusz | Wersja: v1

PODSUMOWANIE
Nowe firmy skontaktowane:     [X] / cel 15
Rozmowy handlowe:             [X] / cel 8
Wyslane oferty:               [X] / cel 5
Follow-upy:                   [X] / cel 10
Nowi klienci (1. zamowienie): [X] / cel 1
Klienci powracajacy:          [X] / cel 2
Sprzedane sztuki:             [X] / cel 2000
```

---

*Spec: CEO + CTO, 06.03.2026. Implementacja: Faza 1 manual (13.03), Faza 3 auto (21.03).*
