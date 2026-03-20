# Samograj Starter

**3 skrypty, 10 minut setup, Twoj biznes pilnuje sie sam.**

Samograj Starter to zestaw 3 automatyzacji, ktore codziennie skanuja Twoj plik stanu biznesu (`stan.md`) i wysylaja Ci powiadomienia push na Telegram. Nie musisz pamietac o follow-upach, zalegosciach ani przegladzac arkuszy — Samograj robi to za Ciebie.

Produkt wchodzi w sklad pakietu **Blizniaka PRO** (System 10H).

## Architektura

```
stan.md (Twoj plik stanu)
    |
    |--- [8:00] morning-brief.js ---> Telegram: briefing na dzis
    |
    |--- [17:00] followup-alert.js -> Telegram: zaleglosci i follow-upy
    |
    |--- [pt 16:00] weekly-pulse.js -> Telegram: podsumowanie tygodnia
    |
config.js (Twoje dane: Telegram token, ustawienia)
```

**Wymagania:** Node.js 18+, bot Telegram (darmowy), 10 minut na setup.

**Brak zaleznosci:** Skrypty dzialaja na czystym Node.js — zero bibliotek, zero npm install.

## Quick Start

### 1. Stworz bota Telegram

1. Otworz Telegram, wyszukaj **@BotFather**
2. Napisz `/newbot`, nadaj nazwe (np. "Samograj Firma")
3. Skopiuj **token bota** (ciag znakow po "Use this token...")
4. Wyszukaj **@userinfobot**, napisz cokolwiek — skopiuj swoj **Chat ID**

### 2. Uruchom setup

```bash
bash setup.sh
```

Setup sprawdzi Node.js, poprosi o token Telegram, stworzy `stan.md` i wyslze testowa wiadomosc.

### 3. Uzupelnij stan.md

Otworz plik `stan.md` i wpisz swoje dane:
- **Cel tygodnia** — co chcesz osiagnac
- **Pipeline** — Twoi klienci/leady (tabelka)
- **Zadania** — co masz do zrobienia

### 4. Uruchom recznie (test)

```bash
node morning-brief.js       # Poranny briefing
node followup-alert.js      # Sprawdzenie follow-upow
node weekly-pulse.js         # Podsumowanie tygodnia
```

### 5. Ustaw cron (automatyczne uruchamianie)

```bash
crontab -e
```

Dodaj 3 linie (setup.sh podpowie dokladne sciezki):

```
0 8 * * 1-5  cd /sciezka/do/samograj-starter && node morning-brief.js >> samograj.log 2>&1
0 17 * * 1-5 cd /sciezka/do/samograj-starter && node followup-alert.js >> samograj.log 2>&1
0 16 * * 5   cd /sciezka/do/samograj-starter && node weekly-pulse.js >> samograj.log 2>&1
```

Gotowe. Od teraz Twoj biznes pilnuje sie sam.

## Co robi kazdy skrypt

| Skrypt | Kiedy | Co robi |
|--------|-------|---------|
| `morning-brief.js` | Codziennie rano (pn-pt) | Skanuje pipeline i zadania, wysyla briefing: ile leadow zalegych, ile zadan zrobionych, cel tygodnia |
| `followup-alert.js` | Codziennie po poludniu (pn-pt) | Sprawdza terminy follow-upow, grupuje wg pilnosci (PILNE/WAZNE/JUTRO), wysyla alert |
| `weekly-pulse.js` | Raz w tygodniu (piatek) | Podsumowuje tydzien: wartosc pipeline, zamkniete deale, zaleglosci, realizacja zadan |

## Personalizacja

### config.js — wszystkie ustawienia w jednym pliku

| Ustawienie | Domyslne | Opis |
|------------|----------|------|
| `businessName` | 'Moja Firma' | Nazwa firmy w powiadomieniach |
| `morningHour` | 8 | Godzina porannego briefingu |
| `followupCheckHour` | 17 | Godzina sprawdzania follow-upow |
| `weeklyReportDay` | 5 (piatek) | Dzien raportu tygodniowego |
| `followupDays` | 3 | Po ilu dniach lead jest "zalegly" |
| `criticalDays` | 14 | Po ilu dniach lead jest "PILNY" |
| `maxAlertsPerRun` | 10 | Max alertow w jednym powiadomieniu |

### stan.md — Twoj plik stanu

Aktualizuj regularnie (najlepiej codziennie). Format tabelki pipeline jest wazny — nie zmieniaj nazw kolumn.

**Statusy pipeline:** Nowy | Oferta wyslana | Negocjacje | Zamknieta-Wygrana | Zamknieta-Przegrana

**Format daty:** DD.MM (np. 20.03) lub DD.MM.RRRR (np. 20.03.2026)

## FAQ

**Czy potrzebuje serwera?**
Nie. Skrypty dzialaja na Twoim komputerze (cron/launchd). Wystarczy ze komputer jest wlaczony o zaplanowanych godzinach.

**Co jesli nie uzupelnie stan.md?**
Skrypty wyslza briefing na podstawie tego co jest. Puste pole = brak danych. Nie beda wymyslac.

**Czy moge dodac wiecej kolumn do pipeline?**
Tak, ale skrypty czytaja tylko pierwsze 6 kolumn (Klient, Wartosc, Status, Ostatni kontakt, Nastepny krok, Due). Dodatkowe kolumny beda ignorowane.

**Czy dziala na Windows?**
Tak — Node.js dziala na Windows. Zamiast crona uzyj Task Scheduler (Harmonogram zadan).

**Jak wylaczyc powiadomienia na weekend?**
Juz sa wylaczone — skrypty automatycznie pomijaja soboty i niedziele.

## Struktura plikow

```
samograj-starter/
  config.js            <- Twoje ustawienia (Telegram, harmonogram)
  stan.md              <- Twoj plik stanu biznesu (aktualizujesz recznie)
  stan.template.md     <- Szablon stanu (backup)
  morning-brief.js     <- Poranny briefing
  followup-alert.js    <- Alert follow-upow
  weekly-pulse.js      <- Podsumowanie tygodnia
  setup.sh             <- Instalator
  README.md            <- Ten plik
```

## Wsparcie

Pytania, problemy, pomysly na rozwoj:

- Email: kontakt@system10h.com
- Telegram: @system10h

---

*Samograj Starter jest czescia System 10H — AI Business OS dla solopreneurow i malych zespolow.*
