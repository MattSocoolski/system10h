# PROMPT ENGINEERING GUIDE — ARTNAPI OS

> Zasób do ulepszania promptów asystentów (@coo, @cso, @ghost, @cmo, @content).
> Użycie: COO health check, budowa nowych asystentów, iteracja istniejących.
> Model: Claude Opus 4.6 — pełne wykorzystanie: XML tags, chain-of-thought, role prompting, prefill, long context.

---

## KIEDY UŻYWAĆ

| Sytuacja | Akcja |
|----------|-------|
| Nowy asystent (np. @logistics) | Zbuduj prompt od zera wg tego guide'a |
| Asystent halucynuje / daje słabe wyniki | Diagnoza → popraw wg checklista |
| Health check plików COO [5] | Sprawdź czy prompty asystentów są zgodne |
| User mówi "popraw prompt" / "ulepsz @X" | Zastosuj pełną procedurę poniżej |

---

## PROCEDURA ULEPSZANIA PROMPTA

### KROK 1: WSTĘPNA ANALIZA

Przed jakąkolwiek zmianą, sprawdź czy prompt zawiera:

```
[ ] Jasno zdefiniowany CEL — co asystent ma osiągnąć
[ ] KRYTERIA SUKCESU — po czym poznać że zadziałało
[ ] PRZYKŁADY oczekiwanego wyniku (min. 3)
[ ] Wystarczający KONTEKST do zrozumienia zadania
[ ] GRANICE — czego asystent NIE robi (matryca granic z CLAUDE.md)
```

**Jeśli coś nie jest jasne → dopytaj usera. Nie zgaduj.**

---

### KROK 2: STRUKTURA I JASNOŚĆ

**Traktuj AI jak nowego pracownika** — dodaj jasne wskazówki:

| Element | Pytanie do siebie | Przykład (Artnapi) |
|---------|-------------------|---------------------|
| CEL | Do czego wynik będzie użyty? | "Draft maila B2B do klienta eventowego" |
| ODBIORCA | Dla kogo jest output? | "Dla usera do wysłania (draft, nie send)" |
| KONTEKST | Gdzie to pasuje w procesie? | "Etap 3 lejka — po próbce, przed zamówieniem" |
| SUKCES | Jak wygląda dobry wynik? | "Mail <150 słów, styl ghost_styl.md, konkretna cena z oferta.md" |

**Konkretność:**
- Instrukcje jako ponumerowane kroki (nie akapity)
- Napisz tak, żeby ktoś BEZ kontekstu Artnapi zrozumiał zadanie
- Unikaj: "napisz dobry mail" → Pisz: "napisz mail FU D+7, max 5 zdań, z ceną all-in z oferta.md, styl B2B z ghost_styl.md"

---

### KROK 3: ORGANIZACJA Z TAGAMI XML

Claude Opus 4.6 doskonale rozumie XML. Używaj tagów do strukturyzacji:

```xml
<instructions>
Główne instrukcje — CO robić, krok po kroku.
</instructions>

<context>
Kontekst biznesowy — dane z plików, stan CRM, historia klienta.
</context>

<data>
Dane wejściowe — cennik, info o kliencie, poprzednie maile.
</data>

<examples>
<example>
Przykład dobrego wyniku (3-5 przykładów).
</example>
</examples>

<constraints>
Ograniczenia — czego NIE robić, limity, zasady.
</constraints>

<thinking>
Przestrzeń na rozumowanie (chain-of-thought).
</thinking>

<answer>
Finalna odpowiedź / output.
</answer>
```

**Zasady:**
- Konsekwentne nazwy tagów w całym prompcie
- Prawidłowe zagnieżdżanie (zamykaj w odwrotnej kolejności)
- Nazwy sensowne do zawartości (nie `<tag1>`, `<tag2>`)

**Przykład Artnapi — sekcja w cso.md:**
```xml
<instructions>
Napisz cold mail B2B do studia eventowego.
1. Otwórz z personalnym hookiem (z researchu firmy)
2. Podaj konkretną cenę z oferta.md (paleta = 9,00 PLN all-in)
3. Dodaj dowód społeczny (4000 szt/mies, 10k na stanie)
4. CTA: próbka lub rozmowa
5. Styl: ghost_styl.md, max 120 słów
</instructions>

<context>
Firma: {{nazwa}} | Segment: eventy | Kraj: {{kraj}}
Produkt: podobrazia 40x50 Adré Artó
Cennik: oferta.md sekcja PODOBRAZIA
USP: dostępność 24h, polski magazyn, all-in pricing
</context>

<constraints>
- NIGDY nie używaj send_email — TYLKO draft_email
- NIGDY nie wymyślaj faktów o firmie klienta
- Ceny WYŁĄCZNIE z oferta.md
- Styl WYŁĄCZNIE z ghost_styl.md
</constraints>
```

---

### KROK 4: TECHNIKI OPUS 4.6

#### A) Przykłady (Few-Shot)
- Dodaj **3-5 przykładów** dobrego wyniku
- Zapewnij: istotne, różnorodne, jasne
- Otocz tagami `<example>`

```xml
<examples>
<example type="cold_mail_eventy">
Temat: Podobrazia na warsztaty — 9 PLN all-in z dostawą

Cześć [imię],

Widzę że [nazwa] robi warsztaty malowania — świetna sprawa.

Mamy podobrazia 40x50 (bawełna 280g, potrójnie gruntowane) z polskiego
magazynu. 9 PLN netto all-in z dostawą przy palecie (320 szt).
10 000 sztuk na stanie, wysyłka 24h.

Mogę wysłać 2-3 sztuki do testów — zero zobowiązań. Daj znać.

Mateusz Sokólski | artnapi.pl
</example>

<example type="FU_D7">
...
</example>

<example type="break_up">
...
</example>
</examples>
```

#### B) Chain of Thought (CoT)
Dla złożonych zadań — daj przestrzeń do myślenia:

```
Zanim napiszesz odpowiedź:
1. Przeczytaj kontekst klienta (CRM, Gmail, plan.md)
2. Zidentyfikuj etap lejka i odpowiedni ton
3. Sprawdź czy masz wszystkie dane (cena, stock, ostatni kontakt)
4. Pomyśl: jaki jest CEL tego maila? (nie "wysłać", ale "co chcę osiągnąć")
5. Dopiero potem pisz

<thinking>
[Twoje rozumowanie tutaj]
</thinking>

<answer>
[Finalny output]
</answer>
```

#### C) Role Prompting
Nadaj AI odpowiednią rolę dopasowaną do zadania:

```
Jesteś doświadczonym KAM-em w B2B wholesale.
Twoja specjalność: sprzedaż fizycznych produktów do firm eventowych.
Styl: bezpośredni, konkretny, zero lania wody.
Mówisz liczbami: ceny, stany, terminy.
```

**Artnapi role mapping:**
| Asystent | Rola | Kluczowy atrybut |
|----------|------|------------------|
| @cso | Jordan Belfort — sales closer | Agresywny ale etyczny, liczby |
| @coo | Logan Roy — execution | Brutalnie szczery, systemy |
| @ghost | Cyfrowy bliźniak usera | Styl z ghost_styl.md, autentyczność |
| @cmo | Growth hacker | Strategia + taktyka |
| @content | Content machine | Efektywność, repurpose |

#### D) Prefill
Rozpocznij odpowiedź AI żeby ukierunkować format:

```
Odpowiedz w formacie:

DIAGNOZA: [1 zdanie]
OPCJE:
A) ...
B) ...
C) ...
REKOMENDACJA: [litera] bo [uzasadnienie]
```

#### E) Long Context (dokumenty)
Dla długich dokumentów:

```xml
<document>
<source>dane/oferta.md</source>
<document_content>
[pełna treść pliku]
</document_content>
</document>

[Pytanie na końcu — po wszystkich dokumentach]
```

**Zasada:** Dokumenty NA POCZĄTKU, pytanie NA KOŃCU.

---

### KROK 5: DLA ZŁOŻONYCH ZADAŃ

**Podział na kroki:**
- Duże zadanie → mniejsze części z jasnym celem każdej
- Każda część → osobna sekcja z instrukcjami

**Przykład (CRM Sync z coo.md):**
```
KROK 1: Fetch Notion CRM (kraj=PL)
KROK 2: Fetch Gmail (ostatnie 7 dni)
KROK 3: Porównaj Due dates CRM vs plan.md
KROK 4: Auto-fix przeterminowanych
KROK 5: Raport + flagi
```

---

### KROK 6: ZASTOSUJ POPRAWKI

Checklist poprawek:

```
[ ] Dodaj brakujące elementy (cel, kryteria, kontekst)
[ ] Przepisz niejasne fragmenty (konkretny język, nie ogólniki)
[ ] Uporządkuj strukturę (XML tagi)
[ ] Popraw/dodaj przykłady (min. 3 różnorodne)
[ ] Rozpisz instrukcje (jasne ponumerowane kroki)
[ ] Dodaj constraints (czego NIE robić)
[ ] Dodaj chain-of-thought dla złożonych sekcji
[ ] Sprawdź spójność z CLAUDE.md (matryca granic, żelazne zasady)
```

---

### KROK 7: POKAŻ ULEPSZONY PROMPT

Przedstaw poprawioną wersję z:
- Wszystkimi wymaganymi elementami
- Jasną strukturą XML
- Konkretnymi instrukcjami krok po kroku
- Min. 3 odpowiednimi przykładami
- **Krótkie wyjaśnienie najważniejszych zmian** (co dodałeś/zmienił i dlaczego)

---

## QUICK-REFERENCE: ANTY-WZORCE

| Anty-wzorzec | Poprawka |
|-------------|----------|
| "Napisz dobry mail" | "Napisz FU D+7, max 5 zdań, cena z oferta.md, styl ghost_styl.md" |
| "Bądź profesjonalny" | "Styl B2B: bezpośredni, konkretny, zero lania wody. Mówisz liczbami." |
| "Pomóż mi z klientem" | "Klient: [nazwa], etap: [X], ostatni kontakt: [data]. Napisz [typ maila]." |
| "Zrób research" | "Znajdź 5 firm [segment] w [kraj], podaj: nazwa, mail, wielkość, co sprzedają." |
| Brak constraints | Dodaj sekcję "NIGDY nie..." z konkretnymi zakazami |
| Brak przykładów | Min. 3 przykłady otoczone tagami `<example>` |
| Ściana tekstu | Podziel na sekcje XML, ponumeruj kroki |

---

## SPECYFICZNE DLA OPUS 4.6

1. **Extended thinking** — Opus 4.6 najlepiej radzi sobie gdy ma przestrzeń na rozumowanie. Zawsze dodawaj `<thinking>` przed `<answer>` dla złożonych zadań.

2. **Instruction following** — Opus 4.6 ściśle trzyma się instrukcji. Im precyzyjniej napiszesz, tym lepszy wynik. Ogólniki = ogólne wyniki.

3. **XML parsing** — Opus 4.6 natively rozumie XML. Używaj tagów agresywnie — to nie jest overhead, to jest poprawa jakości.

4. **Multi-perspective** — Opus 4.6 potrafi symulować wiele perspektyw jednocześnie (jak COO robi z ekspertami). Wykorzystuj to: "Przeanalizuj z perspektywy: (1) klienta, (2) handlowca, (3) konkurencji."

5. **Self-correction** — Opus 4.6 potrafi się poprawiać. Dodaj: "Po napisaniu odpowiedzi, sprawdź: czy wszystkie dane mają źródło w plikach? Czy nie halucynujesz?"

---

*Ostatnia aktualizacja: 24.02.2026*
*Źródło: Anthropic prompt engineering best practices + Artnapi OS adaptacja*
