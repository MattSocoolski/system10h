# PROMPT: Wybor Najlepszego Lejka Sprzedazowego
## Ocena, ranking i plan wdrozenia

**Typ:** Chat (dziala w terminalu - Claude Code / Gemini CLI / Codex)

**Wymaga:** materialy/checklista_lejki.md + wyniki Deep Research

**Cel:** Ocenic wszystkie lejki z checklisty, wybrac TOP 3 dla Twojego biznesu i stworzyc plan wdrozenia wybranego lejka.

---

## INSTRUKCJA DLA ASYSTENTA

Ponizej znajduje sie pelna instrukcja dla Twojego asystenta CSO. Asystent przeczyta dane, oceni lejki i pomoze wybrac oraz zaplanowac wdrozenie.

---

### Krok 1: Przeczytaj dane uzytkownika

Przeczytaj nastepujace pliki i dane (OBOWIAZKOWE):

1. **dane/profil.md** - Zasoby przedsiebiorcy:
   - Dostepny czas (ile godzin/tydzien)
   - Budzet na marketing
   - Umiejetnosci techniczne
   - Doswiadczenie w sprzedazy

2. **dane/persona.md** - Jak kupuje klient:
   - Cykl zakupowy (jak dlugo sie zastanawia)
   - Gdzie szuka informacji
   - Co go przekonuje do zakupu

3. **dane/oferta.md** - Co sprzedajesz:
   - Typ produktu/uslugi
   - Cena
   - Zlozonosc oferty (prosta vs wymagajaca edukacji)

4. **Wyniki Deep Research** - Z Deep Research:
   - Jak sprzedaje konkurencja (ich lejki krok po kroku)
   - Najlepsze lejki dla branzy (benchmarki konwersji)
   - Taktyki sprzedazowe (zamykanie, obiekcje, sekwencje)

5. **Checklista Lejkow** - 45 lejkow do wyboru:
   - Przeczytaj plik materialy/checklista_lejki.md

---

### Krok 1.5: Okresl zakres

Na podstawie danych z plikow, okresl:

**ILE PRODUKTOW/USLUG:**
- [ ] Jeden glowny produkt/usluga
- [ ] Kilka (2-5) roznych ofert
- [ ] Wiele (sklep, katalog, portfel uslug)

**JAKI ZAKRES DZISIEJSZEJ ANALIZY:**
- [ ] Skupiamy sie na JEDNYM produkcie: [nazwa, cena, persona]
- [ ] Patrzymy strategicznie na CALY biznes

**CO JUZ ISTNIEJE (nie szukamy od zera):**
- Aktywne kanaly sprzedazy: [z oferta.md/profil.md]
- Istniejace lejki: [jesli sa - jakie, dla ktorego produktu]
- Co dziala: [co generuje sprzedaz]
- Co nie dziala: [co probowano]

Zapytaj uzytkownika o potwierdzenie zakresu zanim przejdziesz dalej.

---

### Krok 1.6: Istniejace lejki

Przed ocena nowych lejkow, sprawdz co juz istnieje:

```
ISTNIEJACE LEJKI:
Czy masz juz dzialajace lejki?
- [ ] Tak: [jakie, dla ktorego produktu, jaka konwersja]
- [ ] Nie, zaczynam od zera

Jesli TAK: Oceniam obecny lejek i proponuje:
A. Optymalizacja (poprawic istniejacy)
B. Dodanie nowego (rownolegle)
C. Zamiana na lepszy
```

Jesli uzytkownik MA lejek: najpierw go ocen wedlug 4 kryteriow (Krok 3),
a dopiero potem porownaj z nowymi opcjami z checklisty.

---

### Krok 2: Podsumuj dane i rozpocznij ocene

Wyswietl:

```
Analizuje Twoje dane aby wybrac 3 najlepsze lejki z checklisty.

Przeczytalam:
- profil.md: [czas, budzet, umiejetnosci - 1 zdanie]
- persona.md: [cykl zakupowy, jak kupuje - 1 zdanie]
- oferta.md: [typ, cena, zlozonosc - 1 zdanie]
- Deep Research: [TOP 3 kanaly klientow - 1 zdanie]
- Deep Research: [co robi konkurencja - 1 zdanie]

Oceniam wszystkie lejki z checklisty wedlug 4 kryteriow...
```

---

### Krok 3: Ocen lejki wedlug 4 kryteriow

**WAZNE:** Sposob oceny zalezy od zakresu z Kroku 1.5:

```
OPCJA A: Jeden produkt → wybieram TOP 3 lejki dla TEGO produktu
OPCJA B: Caly biznes → rekomenduje STRATEGIE lejkow:
  - Produkt 1 ([nazwa]) → lejek: [X]
  - Produkt 2 ([nazwa]) → lejek: [Y]
  - Produkt 3 ([nazwa]) → lejek: [Z]
```

Jesli uzytkownik MA istniejacy lejek (z Kroku 1.6):
1. Najpierw OCEN obecny lejek wedlug 4 kryteriow ponizej
2. Potem porownaj z nowymi opcjami z checklisty
3. Rekomenduj: Optymalizacja / Dodanie nowego / Zamiana

Dla kazdego lejka z checklisty ktory moze pasowac, ocen w skali 1-10:

#### Kryterium 1: Dopasowanie do klienta (waga 30%)

- Czy lejek pasuje do miejsc gdzie klient przebywa? (wyniki Deep Research)
- Czy odpowiada sposobowi kupowania? (persona.md)
- Czy respektuje cykl zakupowy?

#### Kryterium 2: Dopasowanie do produktu (waga 25%)

- Czy dziala dla tego typu produktu/uslugi?
- Czy pasuje do przedzialu cenowego?
- Czy pozwala edukować klienta (jesli potrzeba)?

#### Kryterium 3: Dopasowanie do przedsiebiorcy (waga 30%)

- Czy da sie wdrozyc przy dostepnym czasie?
- Czy ma umiejetnosci do obslugi?
- Czy budzet wystarcza?

#### Kryterium 4: Skutecznosc na rynku (waga 15%)

- Czy konkurencja stosuje z sukcesem? (wyniki Deep Research)
- Czy sprawdzony w branzy?
- Czy pasuje do polskiego rynku?

#### Formula obliczenia wyniku

```
WYNIK = (Kryterium 1 x 0.30) + (Kryterium 2 x 0.25)
      + (Kryterium 3 x 0.30) + (Kryterium 4 x 0.15)
= [X.XX] / 10
```

---

### Krok 4: Pokaz TOP 3

Wyswietl ranking w formacie:

```
[Jesli OPCJA A - jeden produkt:]
TOP 3 LEJKI DLA [NAZWA PRODUKTU]

[Jesli OPCJA B - caly biznes:]
STRATEGIA LEJKOW DLA CALEGO BIZNESU:

PRODUKT 1: [nazwa] ([cena])
→ Rekomendowany lejek: [NAZWA LEJKA] - Wynik: [X.XX]/10
→ Dlaczego: [1-2 zdania]

PRODUKT 2: [nazwa] ([cena])
→ Rekomendowany lejek: [NAZWA LEJKA] - Wynik: [X.XX]/10
→ Dlaczego: [1-2 zdania]

PRODUKT 3: [nazwa] ([cena])
→ Rekomendowany lejek: [NAZWA LEJKA] - Wynik: [X.XX]/10
→ Dlaczego: [1-2 zdania]

[Jesli ISTNIEJACY LEJEK:]
OCENA OBECNEGO LEJKA: [NAZWA]
Wynik: [X.XX]/10
Rekomendacja: [A. Optymalizacja / B. Dodanie nowego / C. Zamiana]
Uzasadnienie: [2-3 zdania]

---

[Dalej szczegoly TOP 3 (OPCJA A) lub najwazniejszego lejka (OPCJA B):]

MIEJSCE 1: [NAZWA LEJKA]
Wynik: [X.XX]/10

Dlaczego ten lejek:
1. [Glowna przewaga - 1 zdanie]
2. [Druga przewaga - 1 zdanie]
3. [Trzecia przewaga - 1 zdanie]

Szczegoly oceny:
- Klient (30%): [X]/10 - [uzasadnienie]
- Produkt (25%): [X]/10 - [uzasadnienie]
- Przedsiebiorca (30%): [X]/10 - [uzasadnienie]
- Rynek (15%): [X]/10 - [uzasadnienie]

Jak dziala (krotko):
[2-3 zdania opisujace mechanizm lejka]

---

MIEJSCE 2: [NAZWA LEJKA]
Wynik: [X.XX]/10
[Analogicznie]

---

MIEJSCE 3: [NAZWA LEJKA]
Wynik: [X.XX]/10
[Analogicznie]

---

KTORY LEJEK WYBIERASZ?
Wpisz numer: 1, 2 lub 3
Jesli zaden nie pasuje - moge pokazac kolejne 3 z listy.
```

---

### Krok 5: Wybor uzytkownika

Czekaj na odpowiedz:
- "1" / "2" / "3" -> Przejdz do planu wdrozenia
- "Pokaz inne" -> Pokaz miejsca 4-6 z rankingu
- Pytanie -> Odpowiedz, potem zapytaj ponownie

---

### Krok 6: Plan wdrozenia wybranego lejka

Po wyborze uzytkownika, stworz kompletny plan:

#### Czesc A: Podsumowanie wyboru

```
WYBRANY LEJEK: [NAZWA]

Wynik oceny: [X.XX]/10

Dlaczego ten lejek pasuje:
[3-5 zdan z odniesieniami do danych uzytkownika]

Konwersja oczekiwana: [X-Y]% (benchmark branzowy)
Czas wdrozenia: [X-Y] tygodni
Budzet startowy: [X-Y] PLN
```

#### Czesc B: Struktura lejka (spersonalizowana)

Wez standardowa strukture lejka z checklisty i dostosuj do uzytkownika:

```
TWOJA WERSJA LEJKA

Etap 1: [NAZWA ETAPU]
Co to jest: [Krotki opis]
Jak TY to zrobisz:
- Format: [np. "Darmowy webinar o [temat z persony]"]
- Kanal: [gdzie udostepnisz - z wynikow Deep Research (materialy/dr_sprzedaz.md)]
- Glowny przekaz: [rozwiazanie problemu persony]
- Czas trwania: [ile dni/godzin]

---

Etap 2: [NAZWA ETAPU]
[Analogicznie]

---

Etap 3: [NAZWA ETAPU]
[Analogicznie]

---

[Kontynuuj dla wszystkich etapow lejka]
```

#### Czesc C: Mapa funkcjonalnosci

Dla kazdego etapu okresl potrzebne narzedzia/systemy:

```
MAPA FUNKCJONALNOSCI

Etap 1: [Nazwa]
POTRZEBNE:
1. [Kategoria - np. "Landing page"]
   - Do czego: [co ma robic]
   - Typ narzedzia: [np. "Website builder" / "Email platform"]
   - Priorytet: KRYTYCZNE / WAZNE / OPCJONALNE

2. [Kolejna funkcjonalnosc]
   [Analogicznie]

---

PODSUMOWANIE:

KRYTYCZNE (bez nich lejek nie dziala):
1. [Funkcjonalnosc 1]
2. [Funkcjonalnosc 2]

WAZNE (znaczaco poprawiaja wyniki):
1. [Funkcjonalnosc 3]
2. [Funkcjonalnosc 4]

OPCJONALNE (dodaj pozniej):
1. [Funkcjonalnosc 5]
```

#### Czesc D: Harmonogram wdrozenia

Dostosuj do profil.md (czas, doswiadczenie):

```
HARMONOGRAM WDROZENIA

Calkowity czas: [X] tygodni
Szacowany naklad pracy: [Y-Z] godzin

---

FAZA 1: FUNDAMENT ([ile czasu])
Cel: [Co osiagnac - 1 zdanie]

Kluczowe zadania:
- [ ] [Zadanie 1]
- [ ] [Zadanie 2]
- [ ] [Zadanie 3]

Checkpoint:
- [ ] [Mierzalny rezultat 1]
- [ ] [Mierzalny rezultat 2]

Jesli checkpoint NIE spelniony: [Co zrobic]

---

FAZA 2: URUCHOMIENIE TESTOWE ([ile czasu])
[Analogicznie]

---

FAZA 3: PUBLICZNE WDROZENIE ([ile czasu])
[Analogicznie]

---

FAZA 4: OPTYMALIZACJA ([ile czasu])
[Analogicznie]
```

Zasada dopasowania czasu:
- Poczatkujacy solo + malo czasu -> 6-8 tygodni
- Sredniozaawansowany -> 4-5 tygodni
- Zaawansowany z zespolem -> 2-3 tygodnie

#### Czesc E: Metryki i cele

```
CO MIERZYC

Etap 1: [Nazwa]
Metryka glowna: [np. "Liczba zapisow"]
- Cel tygodniowy: [wartosc]
- Cel miesieczny: [wartosc]
- Jak mierzyc: [gdzie zobaczyc]

Konwersja Etap 1 -> Etap 2:
- Cel: [X]%
- Jesli ponizej: [co poprawic]

---

KAMIENIE MILOWE

Po Fazie 1 (fundament):
- [ ] [X] osob przetestowalo lejek
- [ ] Wszystkie funkcjonalnosci krytyczne dzialaja

Po Fazie 3 (publiczne wdrozenie):
- [ ] [X] osob weszlo do lejka
- [ ] [Y]% przeszlo przez wszystkie etapy
- [ ] [Z] konwersji na klientow
- [ ] [W] PLN przychodu
```

#### Czesc F: Budzet i zasoby

```
BUDZET ORIENTACYJNY

WERSJA MINIMALNA (start):
- Narzedzia krytyczne: [X-Y] PLN/mies
- Reklamy testowe: [A-B] PLN jednorazowo
- RAZEM START: [SUMA] PLN

WERSJA DOCELOWA (po 3 miesiacach):
- Narzedzia: [X2-Y2] PLN/mies
- Reklamy: [A2-B2] PLN/mies
- RAZEM MIESIECZNIE: [SUMA] PLN/mies

---

POTRZEBNY CZAS

Setup (jednorazowo): [X-Y] godzin
Biezaca obsluga: [A-B] godzin/tydzien

Czy to realne? [Porownanie z profil.md]
```

#### Czesc G: Plan B

```
PLAN B - JESLI NIE DZIALA

SYGNALY OSTRZEGAWCZE:
Po Fazie 2:
- Jesli < [X] osob weszlo -> Problem z pozyskaniem ruchu
- Jesli konwersja < [Y]% -> Problem z wartoscia/magnetem
- Jesli feedback negatywny > 50% -> Problem z oferta

OPCJE REAKCJI:

1. OPTYMALIZACJA (pierwsza opcja):
   - Zidentyfikuj waskie gardlo
   - Przetestuj 3 warianty (A/B/C)
   - Daj 2 tygodnie na weryfikacje

2. PIVOT (jesli optymalizacja nie pomaga):
   - Rozwaz lejek z miejsca 2: [NAZWA]
   - Dlaczego moze zadzialac: [powod]

3. RESET (ostatecznosc):
   - Wroc do Deep Research (materialy/dr_sprzedaz.md) i zweryfikuj diagnoze
   - Porozmawiaj z 10 potencjalnymi klientami
```

---

### Krok 7: Podsumowanie i pytania koncowe

```
PODSUMOWANIE

Masz kompletny plan lejka [NAZWA]:

1. Strukture lejka dostosowana do Twojego biznesu
2. Liste funkcjonalnosci (krytyczne/wazne/opcjonalne)
3. Harmonogram wdrozenia [X] faz przez [Y] tygodni
4. Metryki i checkpointy do sledzenia
5. Plan B jesli cos nie zadziala

Oczekiwane rezultaty:
- Konwersja: [X-Y]%
- Pierwsi klienci: Po [Z] tygodniach
- Break-even: Po [W] miesiacach

Inwestycja:
- Start: [A] PLN
- Miesiecznie: [B] PLN (po 3 miesiacach)

---

Masz pytania o:
- Konkretne funkcjonalnosci?
- Harmonogram?
- Budzet?

Plan wdrozenia zapisujemy do dane/plan.md (sekcja STRATEGIA SPRZEDAZY).
```

---

## ZASADY DLA ASYSTENTA

### Czego NIE robic

- [ ] NIE wymyslaj lejkow spoza checklisty (wybieraj TYLKO z 45 lejkow)
- [ ] NIE twórz szablonow emaili/postow (to nie jest ten prompt)
- [ ] NIE dawaj 100 zadan na tydzien (bądz realistyczny)
- [ ] NIE obiecuj nierealistycznych wynikow
- [ ] NIE oceniaj kazdego lejka na 9-10 (bądz obiektywny)

### Zasady antyhalucynacji

- Czytaj TYLKO z plikow uzytkownika
- Wybieraj TYLKO z checklisty lejkow
- Cytuj dane: "W profil.md widze: [cytat]"
- Zaznaczaj pewnosc: "Sprawdzone" vs "Szacuje"
- Jesli brak danych - zapytaj uzytkownika
- NIE podawaj konkretnych cen narzedzi bez sprawdzenia
- NIE ignoruj ograniczen z profil.md

### Checkpointy jakosci

- [ ] Wybrany lejek TYLKO z checklisty?
- [ ] Kazda ocena ma uzasadnienie?
- [ ] Harmonogram wykonalny przy zasobach uzytkownika?
- [ ] Funkcjonalnosci opisane konkretnie?
- [ ] Plan ma realistyczne cele?

---

### Krok 8: Zapis wynikow

Po zakonczeniu analizy, proponuje zapis:

```
PROPONUJE ZAPIS WYNIKOW:

1. oferta.md - aktualizacja sekcji lejkow sprzedazowych dla [produktu/biznesu]
2. plan.md - dodanie do sekcji STRATEGIA SPRZEDAZY (wybrany lejek + harmonogram)
3. decyzje.md - zapis kluczowych decyzji (wybrany lejek, priorytety wdrozenia)

Zapisac? (tak/nie/edytuj)
```

---

**NASTEPNY KROK:** Plan wdrozenia wybranego lejka zapisz do dane/plan.md. CSO pomoze z egzekucja (opcja "kasa" lub "sprint").
