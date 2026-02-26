---
name: demo-wow
description: Generates personalized 5-minute demo scripts for prospects. Use when a lead moves to DEMO stage, before a scheduled call, when user says "przygotuj demo dla [osoba]", or when COO detects lead ready for demo.
---

# Demo WOW

Generate personalized demo scripts that showcase the "Bliźniak Biznesowy" system. Demo = Mateusz's killer move (supermoc #1: mówca publiczny). Make it impossible to say no.

## Protocol

1. User provides: imię, branża/firma, ból (or read from plan.md sekcja PIPELINE)
2. Read `dane/oferta.md` for product details
3. Read `dane/persona.md` for pain points matching
4. Generate: Loom script + talking points + CTA

## Demo Structure (5 min max)

```
[0:00-0:30] HOOK — Ich ból, ich słowami
[0:30-2:00] LIVE DEMO — Pokaż system na PRAWDZIWYM przykładzie
[2:00-3:30] "A TERAZ PATRZ" — WOW moment (AI generuje coś w 10 sek)
[3:30-4:30] WYNIK — Co by to znaczyło dla ICH biznesu
[4:30-5:00] CTA — Jeden krok, zero presji
```

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━
DEMO DLA: [IMIĘ] | [BRANŻA]
━━━━━━━━━━━━━━━━━━━━━━━━

BÓL KLIENTA: [z persony lub z kontekstu]
WARIANT PERSONY: [Solista / Właściciel]

━━━ SCENARIUSZ LOOM (5 min) ━━━

🎬 HOOK (30 sek):
"[dokładny tekst do powiedzenia]"

💻 LIVE DEMO (90 sek):
- Pokaż: [co konkretnie otworzyć/pokazać]
- Powiedz: "[tekst]"
- Kliknij: [co zrobić na ekranie]

🤯 WOW MOMENT (90 sek):
- Pokaż: [jaki skill odpalić live]
- Powiedz: "[tekst reakcji]"
- Efekt: [co klient widzi]

📊 WYNIK (60 sek):
"[tekst — przeliczenie na ich realia]"

📞 CTA (30 sek):
"[dokładny tekst zamknięcia]"

━━━ TALKING POINTS ━━━

Jeśli powie "za drogo": [retort z persona.md]
Jeśli powie "muszę pomyśleć": [retort]
Jeśli powie "a jak to wygląda technicznie": [retort]
━━━━━━━━━━━━━━━━━━━━━━━━
```

## WOW Moments Library

Wybierz najlepszy dla branży klienta:

| WOW | Opis | Najlepszy dla |
|-----|------|---------------|
| FOLLOW-UP BLAST | Generuj 5 follow-upów w 10 sek | Handlowcy z dużym pipeline |
| OFERTA FLASH | Zapytanie → gotowa oferta w 30 sek | Firmy z dużo zapytań |
| BAD COP | Klient "daj rabat" → asystent broni marży | Właściciele z problemem rabatowym |
| RESEARCH | Prześwietl firmę klienta w 15 sek | KAM-owie, account managerowie |

## Rules

- Demo MUSI używać prawdziwych danych (pipeline Mateusza, prawdziwe narzędzia)
- NIGDY slajdy — zawsze LIVE na ekranie
- CTA: "Chcesz to samo? 15 min rozmowa." lub "Napisz — ustawiam."
- Jeśli brak danych o kliencie — poproś usera o: imię, branża, ból
