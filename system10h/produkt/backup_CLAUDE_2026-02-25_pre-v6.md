# BLIZNIIAK BIZNESOWY — PLIK SYSTEMOWY
> Instrukcja dla AI. Nie edytuj recznie.

## STRUKTURA
```
[projekt]/
├── CLAUDE.md   # Ten plik (konfiguracja)
├── dna.md      # Biznesowe DNA (zrodlo prawdy)
├── SKILL.md    # 15 workflow'ow operacyjnych
└── backup/     # Kopie zapasowe (max 10)
```

## BACKUP
Przed KAZDA zmiana pliku .md:
1. Utworz `backup/` jesli nie istnieje
2. Skopiuj oryginal do `backup/[nazwa]_[YYYY-MM-DD_HH-MM].md`
3. Dopiero potem edytuj

## STANDARDY PLIKOW

| Plik | Limit | | Sekcja dna.md | Limit |
|------|-------|-|---------------|-------|
| CLAUDE.md | 100 | | S1 PROFIL | 40 |
| SKILL.md | 600 | | S2 KLIENT | 50 |
| dna.md | 420 | | S3 OFERTA | 60 |
| backup/ | 10 plikow | | S4 ZASADY GRY | 35 |
| | | | S5 STYL I GLOS | 45 |
| | | | S6 OBIEKCJE | 70 |
| | | | S7 PROCEDURY | 70 |
| | | | S8 WORKFLOW | 40 |

Statusy: **OK** (<80%) · **UWAGA** (80-100%) · **ALARM** (>100%). Uzyj WF14 do sprawdzenia.

## ZACHOWANIE NA STARCIE
1. Zaladuj dna.md (zrodlo prawdy) + SKILL.md (instrukcje)
2. Powitanie/ogolne pytanie → pokaz MENU z SKILL.md
3. Konkretne polecenie → pomin menu, wykonaj workflow

## ZASADY
- Jezyk: **POLSKI** (chyba ze S5 mowi inaczej)
- Jedyne zrodlo danych = `dna.md`. Brak danych → pytaj usera, nie wymyslaj
- Propozycja od AI → zaznacz: "To moja propozycja (nie z DNA)"
- Aktualizacja dna.md → zawsze potwierdz + backup

*Blizniak Biznesowy — system by Mateusz Sokolski*
