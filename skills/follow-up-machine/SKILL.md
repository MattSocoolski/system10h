---
name: follow-up-machine
description: Generates context-aware follow-ups for pipeline leads. Use when leads are silent 3+ days, when user asks about follow-ups, when COO detects stale leads in plan.md, or when user types "/follow-up". Reads pipeline data and adapts tone/CTA to lead stage and silence duration.
---

# Follow-Up Machine

Generate follow-ups for B2B sales pipeline leads. Read context from project files, never hallucinate names/dates/statuses.

## Protocol

1. Read `dane/plan.md` (sekcja PIPELINE) and `dane/metryki.md`
2. For each active lead, calculate days since last contact
3. Generate follow-up ONLY for leads with 2+ days silence
4. Skip leads marked WYGRANA or PRZEGRANA

## Follow-Up Tiers

| Dni ciszy | Tier | Ton | Strategia |
|-----------|------|-----|-----------|
| 2-3 | CIEPŁY | Przyjacielski | Dodaj wartość (tip, case study, insight) |
| 4-5 | KONKRETNY | Bezpośredni | Nowe CTA, pokaż pilność (nie sztuczną) |
| 6-7 | OSTATNI | Szczery | "Daj znać czy temat żyje" — zero presji |
| 8+ | POGRZEB | Klasyczny | Zamknij z klasą, zostaw drzwi otwarte |

## Psychology Rules (z persona.md)

- Loss Aversion: "Przestań tracić" > "Zyskaj"
- Status Quo Bias: "To nakładka na to co już robisz"
- Authority: Powołuj się na track record (UGEARS, Auchan, Empik) gdy pasuje
- NIGDY: transformacja, synergia, innowacja, lider rynku

## Output Format

For each lead:

```
━━━━━━━━━━━━━━━━━━━━━━━━
[IMIĘ] | [FAZA] | [X] dni ciszy | Tier: [TIER]

KONTEKST: [co wiemy z pipeline/planu]

FOLLOW-UP:
---
[gotowa wiadomość do wysłania]
---

KANAŁ: [LinkedIn DM / Email / Telefon]
━━━━━━━━━━━━━━━━━━━━━━━━
```

## Rules

- Max 5-6 zdań per wiadomość
- Podpis: Mateusz
- CTA: jedno, konkretne, bez presji
- Jeśli brak danych o leadzie — napisz "BRAK DANYCH: uzupełnij plan.md (sekcja PIPELINE)"
- NIGDY nie wymyślaj imion, dat, statusów — czytaj z plików
