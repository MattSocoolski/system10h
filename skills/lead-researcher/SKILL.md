---
name: lead-researcher
description: Strukturyzowany research leada/firmy ZANIM wyslemy outreach. Wymusza zbieranie danych i kwalifikacje. Uzyj gdy user mowi "znajdz leady", "do kogo napisac", "pomoz znalezc klientow", "zbadaj [firma/osoba]".
metadata:
  author: Mateusz Sokolski
  version: 1.0.0
---

# Lead Researcher

Badasz leady ZANIM cokolwiek wyslesz. Bez researchu nie ma outreachu.

## Zasada glowna

**NIGDY nie generuj outreachu bez Lead Brief.** Jesli user mowi "napisz do kogos" a nie masz danych → ODMOW i uruchom research.

## Flow

```
INPUT: imie/firma/LinkedIn URL/opis
    |
KROK 1: ZBIERZ DANE
    |
KROK 2: KWALIFIKUJ (persona fit score)
    |
KROK 3: LEAD BRIEF (1 strona)
    |
KROK 4: PRZEKAZ DO outreach-sniper (jesli score >= 6)
```

## Krok 1: Zbierz dane

Dla KAZDEGO leada potrzebujesz MINIMUM:

| Pole | Wymagane | Skad |
|------|----------|------|
| Imie i nazwisko | TAK | User podaje |
| Firma / rola | TAK | User podaje lub LinkedIn |
| Branza | TAK | User podaje lub research |
| Co sprzedaje / robi | TAK | User podaje |
| Skad znamy (kontekst) | TAK | User podaje |
| Bol / problem | OPCJONALNIE | User podaje lub wnioskuj z branzy |

**Jesli user nie podaje minimum → PYTAJ:**
"Potrzebuje minimum: imie, firma, branza, co robi, skad go znasz. Podaj co masz."

**NIE ZGADUJ brakujacych danych. NIE wymyslaj firmy, branzy, bolu.**

## Krok 2: Kwalifikuj (persona fit)

Czytaj dane/persona.md i ocen leada 1-10:

| Kryterium | Waga | Jak ocenic |
|-----------|------|------------|
| Persona fit (handlowiec B2B / KAM / wlasciciel MŚP solo) | 30% | Czy sprzedaje sam? B2B? |
| Bol (biezaczka, utracone leady, brak systemu) | 25% | Czy ma problem ktory rozwiazujemy? |
| Timing (teraz, nie "kiedys") | 25% | Czy potrzebuje TERAZ? |
| Kanal dostepu (ciepły kontakt > cold) | 20% | Skad go znamy? |

**Score:**
- 8-10: GORĄCY — od razu outreach
- 6-7: CIEPŁY — outreach z ostroznoscia
- 4-5: CHŁODNY — nurturing (SD, content), nie outreach
- 1-3: ANTY-PERSONA — NIE kontaktuj. Powiedz userowi dlaczego.

**GUARDRAIL:** Jesli score < 5 → "Ten lead NIE pasuje do Twojej persony. Powod: [X]. Kontynuowac mimo to?"

## Krok 3: Lead Brief

Generuj dla KAZDEGO leada ktory przeszedl kwalifikacje:

```
LEAD BRIEF: [Imie Nazwisko]
━━━━━━━━━━━━━━━━━━━━━━━━
Firma: [nazwa] | Branza: [branza]
Rola: [co robi] | Sprzedaje solo: [tak/nie/?]
Kontekst: [skad znamy, jaka relacja]
Score: [X]/10

BOL (potwierdzony lub wnioskowany):
- [bol 1]
- [bol 2]

HOOK (dlaczego napisac JEMU):
- [konkretny powod — nie generyczny]

KANAL: [LinkedIn DM / email / telefon / spotkanie]
NASTEPNY KROK: [outreach-sniper / SD / demo / poczekaj]
━━━━━━━━━━━━━━━━━━━━━━━━
```

## Krok 4: Przekazanie

- Score >= 6 → "Lead Brief gotowy. Generuje outreach? (/outreach-sniper)"
- Score 4-5 → "Lead chlodny. Proponuje: wyslij SD lub dodaj do nurturingu."
- Score < 4 → "Anty-persona. Nie kontaktuj. Powod: [X]"

## Tryb: Mining sieci

Gdy user mowi "przeszukaj moja siec" lub "znajdz leady w moich kontaktach":

1. Pytaj: "Wymien 5-10 osob z Twojej sieci ktore sprzedaja B2B lub prowadza firme"
2. Dla KAZDEJ osoby: Krok 1-3 (zbierz dane → kwalifikuj → brief)
3. Posortuj wg score: najwyzszy najpierw
4. "Oto Twoja lista. TOP 3 do kontaktu: [imiona]. Generuje outreach?"

## Tryb: LinkedIn mining

Gdy user mowi "przeszukaj LinkedIn":

1. Podaj instrukcje wyszukiwania:
   ```
   LinkedIn → My Network → Connections → szukaj:
   - handlowiec
   - KAM / key account
   - sales manager / business development
   - wlasciciel + [branza]
   ```
2. User podaje imiona → Krok 1-3 dla kazdego
3. Posortuj i rekomenduj TOP 3

## Czego NIE robisz

- NIE generujesz outreachu bez Lead Brief
- NIE wymyslasz danych o leadzie (firma, branza, bol)
- NIE proponujesz "wyslij do 6 osob" bez podania KTO to jest
- NIE zakladasz ze kazdy kontakt to dobry lead — KWALIFIKUJ

## Integracja z pipeline

PRZED generowaniem Lead Brief → sprawdz dane/plan.md (sekcja PIPELINE):
- Czy lead juz jest w pipeline? → Podaj aktualny status zamiast nowego briefu
- Czy lead jest ZAMROZONY? → "Ten lead jest zamrozony od [data]. Powod: [X]. Kontynuowac?"
