# BLIŹNIAK PRO — ARCHITEKTURA

> Status: PLANOWANIE | Data: 12.03.2026
> Cel: Upsell path z BASE (2,999 PLN) do PRO (addon)

---

## CZYM JEST PRO

Bliźniak PRO = Bliźniak BASE + **Samograj Starter** (3 automatyzacje + Telegram).

BASE daje klientowi inteligentnego asystenta AI.
PRO daje mu **asystenta który SAM przychodzi z informacjami**.

Kluczowa różnica: BASE czeka na pytanie. PRO puka do drzwi.

| | BASE (2,999 PLN) | PRO (BASE + addon) |
|--|------|-----|
| dna.md + stan.md + 16 WF | ✅ | ✅ |
| Protokół Wiarygodności | ✅ | ✅ |
| Głęboki Profil Stylu | ✅ | ✅ |
| Aktywna Pamięć (triggery) | ✅ | ✅ |
| Morning Brief (Telegram) | ❌ | ✅ |
| Follow-up Alert (Telegram) | ❌ | ✅ |
| Weekly Pulse (Telegram) | ❌ | ✅ |
| Setup Telegram + scheduler | ❌ | ✅ (w instalacji) |

---

## SAMOGRAJ STARTER — 3 SKRYPTY

### 1. morning-brief.js
- **Co robi:** Czyta stan.md → parsuje PIPELINE due dates → wysyła poranny brief na Telegram
- **Kiedy:** Codziennie 9:00 (pon-pt)
- **Telegram message:**
  ```
  BRIEF [data] ([dzień])

  ZALEGŁE: [leady z due < dziś]
  NA DZIŚ: [leady z due = dziś]
  JUTRO: [leady z due = jutro]

  Pipeline: X aktywnych, ~Y PLN
  ```
- **Wymaga:** Node.js, Telegram Bot Token, LaunchAgent/cron
- **Nie wymaga:** Gmail, Notion, Claude API

### 2. followup-alert.js
- **Co robi:** Skanuje stan.md → alerty gdy lead >3 dni overdue
- **Kiedy:** Codziennie 17:00 (pon-pt)
- **Telegram message:**
  ```
  FOLLOW-UP [data]

  ZALEGŁE 3-7 dni: [lista]
  WAŻNE >7 dni: [lista]

  Sugestia: otwórz Bliźniaka → WF4 (Follow-up)
  ```
- **Wymaga:** Node.js, Telegram Bot Token

### 3. weekly-pulse.js
- **Co robi:** Piątek: podsumowanie tygodnia na podstawie stan.md LOG
- **Kiedy:** Piątek 16:00
- **Telegram message:**
  ```
  PULSE [tydzień]

  Akcje: X workflow'ów wykonanych
  Pipeline: X leadów, ~Y PLN
  Decyzje: [lista z stan.md DECYZJE]
  Lekcje: [lista z stan.md LEKCJE]
  ```

---

## TECH STACK PRO

| Element | Technologia | Koszt klienta | Trudność |
|---------|-------------|-------|----------|
| Runtime | Node.js (lokalnie) | 0 PLN | Niska |
| Alerty | Telegram Bot (BotFather) | 0 PLN | 5 min setup |
| Scheduler (macOS) | LaunchAgent plist | 0 PLN | Template |
| Scheduler (Windows) | Task Scheduler | 0 PLN | Template |
| Scheduler (Linux) | crontab | 0 PLN | 1 linia |
| Dane | stan.md (plik lokalny) | 0 PLN | Już istnieje |

**Zero abonamentów. Zero chmury. Zero API keys.** Wszystko działa lokalnie na komputerze klienta.

---

## WDROŻENIE PRO

Dodatkowe kroki (na normalną instalację BASE):
1. `npm init` + instalacja zależności (~2 min)
2. Stworzenie Telegram Bota (BotFather, ~5 min)
3. Wgranie 3 skryptów + konfiguracja .env (BOT_TOKEN + CHAT_ID)
4. Setup scheduler (LaunchAgent macOS / Task Scheduler Windows / cron Linux)
5. Test: `node morning-brief.js --dry-run`

**Czas dodatkowy:** ~30-45 min

---

## PRICING (do decyzji)

| Opcja | Model | Cena | Uwagi |
|-------|-------|------|-------|
| ~~A) Pakiet~~ | ~~BASE + PRO razem~~ | ~~4,999 PLN~~ | ~~Prostsze, wyższa wartość na start~~ |
| ~~B) Addon~~ | ~~BASE 2,999 + PRO addon 1,999~~ | ~~4,998 PLN~~ | ~~Niższy próg wejścia, upsell later~~ |
| ~~C) Upsell po 30d~~ | ~~BASE 2,999 → PRO addon 2,499~~ | ~~5,498 PLN~~ | ~~Wyższa cena PRO bo klient widzi wartość~~ |

**DECYZJA (12.03.2026): Opcja A — pakiet 4,999 PLN.** BASE + PRO razem. Prostsze, wyższa wartość na start, jeden produkt do sprzedania.

---

## FLOW SPRZEDAŻOWY

```
Self-Discovery (darmowe, 18 pytań)
  └→ pytania Q16-18 → SYSTEM-FIT (BASE/PRO rekomendacja)
      ↓
Architekt (wywiad) → dna.md + stan.md
  └→ Closing Ritual: jeśli SYSTEM-FIT = PRO → przedstaw opcję
      ↓
Instalacja BASE (2,999 PLN)
      ↓
[30 dni użytkowania]
      ↓
Follow-up: "Jak Ci idzie? Pamiętasz o follow-upach?"
      ↓
Upsell PRO: "Wyobraź sobie że rano dostajesz SMS co zrobić..."
      ↓
PRO addon (1,999-2,499 PLN)
```

---

## VALUE STACKING PRO (addon)

| Element | Wartość |
|---------|---------|
| Morning Brief — poranny briefing pipeline na Telegram | 1 200 PLN |
| Follow-up Alert — automatyczne alerty o zaległych leadach | 800 PLN |
| Weekly Pulse — piątkowe podsumowanie tygodnia | 500 PLN |
| Setup Telegram + scheduler (done-for-you) | 600 PLN |
| Template skryptów (Node.js, gotowe do użycia) | 400 PLN |
| Quick Start PRO (instrukcja) | 200 PLN |
| **Łączna wartość** | **3 700 PLN** |
| **Inwestycja (addon)** | **1 999 PLN** |

---

## NASTĘPNE KROKI

1. [ ] Zatwierdzenie modelu cenowego (A/B/C)
2. [ ] Zbudowanie 3 skryptów template (morning-brief, followup-alert, weekly-pulse)
3. [ ] Template .env + LaunchAgent/cron dla klienta (macOS + Windows + Linux)
4. [ ] Quick Start PRO (instrukcja instalacji automatyzacji)
5. [ ] Loom PRO (dodatkowe 5 min do szkolenia)
6. [ ] Aktualizacja strony system10h.com (tier PRO)
7. [ ] Template follow-up email po 30 dniach (upsell PRO)
8. [ ] Testowanie na 1 kliencie (beta)
