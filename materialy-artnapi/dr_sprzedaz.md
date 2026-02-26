# Deep Research: Lejki Sprzedazowe i Taktyki
## Jak sprzedaje konkurencja + najlepsze lejki dla Twojej branzy + sprawdzone taktyki

**Typ:** Deep Research (wymaga uzycia ChatGPT / Gemini / Perplexity w przegladarce)

**Cel:** Zbadac jakie lejki sprzedazowe dzialaja w Twojej branzy, jak sprzedaje konkurencja i jakie taktyki daja najlepsza konwersje.

---

## INSTRUKCJA DLA ASYSTENTA

Ponizej znajduje sie pelna instrukcja dla Twojego asystenta AI. Asystent przeczyta Twoje dane, wygeneruje JEDEN spersonalizowany prompt do Deep Research, a nastepnie pomoze Ci przeanalizowac wyniki.

---

### Krok 1: Przeczytaj dane uzytkownika

Przeczytaj nastepujace pliki (OBOWIAZKOWE przed wygenerowaniem promptu):

1. **dane/oferta.md** - Co sprzedajesz (KRYTYCZNE - okresla typ lejka!):
   - Produkt/usluga/kurs/abonament
   - Cena (przedzial cenowy - to okresla jaki lejek zadziala!)
   - B2C czy B2B (calkowicie zmienia podejscie)
   - Czym sie roznisz od konkurencji
   - Kategoria rynkowa

2. **dane/persona.md** - Jak kupuje klient:
   - Cykl zakupowy (jak dlugo sie zastanawia)
   - Gdzie szuka rozwiazan
   - Co go przekonuje do zakupu
   - Typowe obiekcje
   - Jakie ma alternatywy (konkurencja)

3. **dane/profil.md** - Twoje zasoby:
   - Dostepny czas (ile godzin/tydzien na sprzedaz)
   - Budzet na marketing
   - Doswiadczenie w sprzedazy
   - Dotychczasowe kanaly i lejki

**Weryfikacja przed przejsciem dalej:**
- [ ] Wiesz DOKLADNIE co sprzedajesz (produkt/usluga)?
- [ ] Wiesz JAKI przedzial cenowy (997 PLN vs 50 000 PLN = INNY lejek!)?
- [ ] Wiesz CZY to B2C czy B2B?
- [ ] Wiesz JAK kupuje klient (cykl zakupowy)?
- [ ] Wiesz JAKIE obiekcje ma klient?
- [ ] Sprawdziles czy persona.md wymienia konkurentow?

Jesli ktores NIE - wroc do plikow i przeczytaj dokladnie.

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
- Aktywny lejek sprzedazowy: [jaki, dla ktorego produktu]
- Znani konkurenci: [z persona.md/oferta.md]
- Co dziala w sprzedazy: [co generuje konwersje]
- Co nie dziala: [co probowano bez efektu]

Zapytaj uzytkownika o potwierdzenie zakresu zanim przejdziesz dalej.

---

### Krok 2: Podsumuj dane uzytkownikowi

Wyswietl krotkie podsumowanie:

```
Przeczytalam Twoje pliki i przygotowuje badanie lejkow sprzedazowych:

Oferta: [Co sprzedajesz + cena]
Typ: [B2C czy B2B]
Kategoria: [np. "Edukacja online", "Konsulting B2B", "E-commerce kosmetyki"]
Persona: [Kim jest klient + jak kupuje]
Zakres: [Jeden produkt: NAZWA / Caly biznes: X produktow]
Obecny lejek: [jaki lub "Brak"]
Znani konkurenci: [lista lub "Brak"]

Na tej podstawie przygotowalam JEDEN prompt do Deep Research,
ktory zbada 3 obszary:
A. Jak sprzedaje konkurencja (ich lejki krok po kroku)
B. Najlepsze lejki dla Twojej branzy (sprawdzone modele + benchmarki)
C. Taktyki sprzedazowe (techniki, sekwencje, triggery zakupowe)
```

---

### Krok 3: Wygeneruj prompt do Deep Research

Na podstawie danych z plikow uzytkownika, wygeneruj spersonalizowany prompt.
**WAZNE:** Wybierz odpowiedni WARIANT w zaleznosci od zakresu z Kroku 1.5.

Wyswietl wygenerowany prompt w bloku kodu:

````
Skopiuj ponizszy prompt i wklej go do ChatGPT, Gemini lub Perplexity
w przegladarce (uzyj trybu Deep Research jesli dostepny):
````

#### WARIANT A: Jeden produkt (skupiony)

Uzyj gdy uzytkownik wybral JEDEN konkretny produkt/usluge.

```
Jestem przedsiebiorca w branzy {BRANZA}. Sprzedaje {PRODUKT_USLUGA}
w cenie {CENA} dla {B2C_B2B} na rynku polskim.

Moj idealny klient to: {OPIS_PERSONY_1_2_ZDANIA}
Cykl zakupowy klienta: {JAK_DLUGO_SIE_ZASTANAWIA}
Typowe obiekcje: {TOP_3_OBIEKCJE}

{JESLI_ZNANI_KONKURENCI}
Znani mi konkurenci: {LISTA_KONKURENTOW}
Szukam rowniez NOWYCH ktorych jeszcze nie znam.
{/JESLI_ZNANI_KONKURENCI}

{JESLI_ISTNIEJACY_LEJEK}
Mam juz lejek: {OPIS_LEJKA}. Szukam lepszych opcji lub sposobow na optymalizacje.
{/JESLI_ISTNIEJACY_LEJEK}

Potrzebuje KOMPLEKSOWEJ analizy lejkow sprzedazowych w 3 obszarach:

---

## CZESC 1: JAK SPRZEDAJE KONKURENCJA (lejki krok po kroku)

Znajdz TOP 5 konkurentow sprzedajacych {PRODUKT_USLUGA} w przedziale
cenowym {CENA} dla {B2C_B2B} w Polsce i zdekonstruuj ich lejki.

A. DLA KAZDEGO KONKURENTA ZBIERZ:
   1. Nazwa firmy i URL
   2. Co sprzedaja i za ile
   3. PELNY LEJEK SPRZEDAZOWY - krok po kroku:
      - Etap 1: Jak przyciagaja uwage (reklamy, content, SEO - KONKRETNE przyklady)
      - Etap 2: Jak zbieraja kontakty (jaki lead magnet, jaki formularz)
      - Etap 3: Jak rozgrzewaja (sekwencja maili, webinary, content)
      - Etap 4: Jak zamykaja sprzedaz (strona ofertowa, rozmowa, techniki)
      - Etap 5: Co po zakupie (onboarding, upsell, cross-sell)
   4. Jakie LEAD MAGNETY uzywaja (tytuly, formaty - PDF, webinar, quiz, mini-kurs)
   5. Jakie SEKWENCJE EMAIL widac (ile maili, jak czesto, jakie tematy)
   6. Jakie TECHNIKI ZAMYKANIA stosuja (urgency, social proof, gwarancje)

B. POROWNANIE LEJKOW KONKURENCJI:
   | Konkurent | Typ lejka | Lead magnet | Metoda zamykania | Szacowana skutecznosc |
   Ktory konkurent ma NAJLEPSZY lejek i dlaczego?

C. CO MOZESZ SKOPIOWAC (quick wins):
   - Najlepsze lead magnety do adaptacji
   - Najskuteczniejsze techniki zamykania
   - Elementy lejka ktore dzialaja najlepiej

---

## CZESC 2: NAJLEPSZE LEJKI DLA MOJEJ BRANZY

Jakie MODELE lejkow sprzedazowych sa najskuteczniejsze dla
{KATEGORIA_PRODUKTU} w przedziale cenowym {CENA} ({B2C_B2B})?

A. TOP 3 SPRAWDZONE MODELE LEJKOW:
   Dla kazdego podaj:
   - Nazwa modelu (np. Webinarowy, Tripwire, Challenge, VSL)
   - Dlaczego dziala dla {KATEGORIA_PRODUKTU} w cenie {CENA}
   - Typowa konwersja (benchmark dla branzy)
   - Przyklad firmy ktora go stosuje z sukcesem (case study)
   - Ile kosztuje wdrozenie (czas + pieniadze)
   - Dla kogo NIE zadziala (ograniczenia)

B. BENCHMARKI KONWERSJI DLA BRANZY:
   - Konwersja landing page: [X-Y]% (norma dla {BRANZA})
   - Konwersja lead magnet: [X-Y]%
   - Konwersja email -> sprzedaz: [X-Y]%
   - Konwersja webinar -> sprzedaz: [X-Y]%
   - Konwersja konsultacja -> sprzedaz: [X-Y]%
   - Sredni cykl sprzedazy: [X] dni

C. LEAD MAGNETY KTORE DZIALAJA W BRANZY:
   - TOP 5 typow lead magnetow dla {KATEGORIA_PRODUKTU}
   - Dla kazdego: format, przyklad tytulu, szacowana konwersja
   - Ktore NIE dzialaja (i dlaczego)

D. NARZEDZIA KTORE UZYWAJA NAJSKUTECZNIEJSI:
   - Do landing page
   - Do email marketingu
   - Do automatyzacji lejka
   - Do webinarow/demo
   - Do CRM i sledzenia leadow

---

## CZESC 3: TAKTYKI SPRZEDAZOWE DLA MOJEGO PRODUKTU

Jakie taktyki sprzedazowe dzialaja najlepiej przy sprzedazy
{PRODUKT_USLUGA} w cenie {CENA} dla {B2C_B2B}?

A. TECHNIKI ZAMYKANIA SKUTECZNE W BRANZY:
   - Jakie techniki close dzialaja przy produkcie w cenie {CENA}?
   - Ktore NIE dzialaja (i dlaczego)?
   - Jak najlepsi w branzy zamykaja sprzedaz (cytaty ze stron, maili)?

B. OBIEKCJE I JAK JE ROZWIAZUJA:
   Dla typowych obiekcji w branzy:
   - "Za drogo" - jak odpowiadaja najskuteczniejsi?
   - "Musze sie zastanowic" - jakie techniki follow-up dzialaja?
   - "Nie wiem czy to dla mnie" - jak buduja pewnosc?
   - [INNE TYPOWE DLA BRANZY] - jak je rozwiazuja?

C. SEKWENCJE EMAIL/FOLLOW-UP:
   - Ile maili w typowej sekwencji sprzedazowej?
   - Jaki timing (co ile dni)?
   - Jakie tematy maili maja najlepszy open rate?
   - Jaki ton dziala (agresywny vs edukacyjny vs storytelling)?
   - Przyklad skutecznej sekwencji (5-7 maili, tytuly + krotki opis)

D. TRIGGERY ZAKUPOWE (co popycha do kupna):
   - Urgency: jakie deadline'y dzialaja w branzy (sezonowe, limitowane)?
   - Social proof: jakie formaty opinii konwertuja najlepiej?
   - Gwarancje: jakie oferuja konkurenci?
   - Bonusy: jakie dzialaja (a jakie nie)?
   - Pricing: raty, pakiety, early bird - co konwertuje lepiej?

---

Rynek: Polska
Format: Konkretne przyklady, URL-e, cytaty ze stron sprzedazowych.
Gdzie sprawdzic: strony konkurentow, Biblioteka Reklam Facebook,
sekwencje email (zapisz sie do newsletterow), landing page'e,
opinie klientow, webinary konkurencji.
```

#### WARIANT B: Caly biznes (strategiczny)

Uzyj gdy uzytkownik chce patrzec na CALY biznes z wieloma produktami/uslugami.

```
Prowadze firme {NAZWA_FIRMY} w branzy {BRANZA}.
Moj portfel ofert:
- {PRODUKT_1}: {CENA_1}, dla {PERSONA_1}
- {PRODUKT_2}: {CENA_2}, dla {PERSONA_2}
- {PRODUKT_3}: {CENA_3}, dla {PERSONA_3}
[dodaj wiecej jesli sa]

Typ klientow: {B2C_B2B_MIX}

{JESLI_ZNANI_KONKURENCI}
Znani mi konkurenci: {LISTA_KONKURENTOW}. Szukam NOWYCH.
{/JESLI_ZNANI_KONKURENCI}

Potrzebuje KOMPLEKSOWEJ analizy lejkow sprzedazowych w 3 obszarach:

---

## CZESC 1: JAK SPRZEDAJE KONKURENCJA

A. MAPA LEJKOW KONKURENCJI PER PRODUKT:
   | Moj produkt | Konkurent | Ich lejek | Lead magnet | Metoda close |

B. KONKURENCI PORTFELOWI (firmy z wieloma produktami jak ja):
   - Jak prowadza klienta z produktu A do B (cross-sell)?
   - Jak buduja drabine wartosci?
   - Jakie lejki uzywaja dla ROZNYCH produktow?

C. DEKONSTRUKCJA TOP 3 LEJKOW:
   Dla 3 najskuteczniejszych konkurentow - pelny lejek krok po kroku
   (etapy, lead magnety, sekwencje email, techniki close).

---

## CZESC 2: NAJLEPSZE LEJKI PER PRODUKT

A. REKOMENDACJA LEJKA DLA KAZDEGO PRODUKTU:
   - {PRODUKT_1} ({CENA_1}): najlepszy model lejka + dlaczego
   - {PRODUKT_2} ({CENA_2}): najlepszy model lejka + dlaczego
   - {PRODUKT_3} ({CENA_3}): najlepszy model lejka + dlaczego

B. STRATEGIA DRABINY WARTOSCI:
   Jak polaczyc lejki w system (tani produkt -> sredni -> drogi)?
   Gdzie sa naturalne przejscia miedzy produktami?

C. BENCHMARKI per kategoria produktu.

---

## CZESC 3: TAKTYKI SPRZEDAZOWE

A. TECHNIKI ZAMYKANIA per przedzial cenowy:
   - Produkty do 500 PLN: jakie taktyki?
   - Produkty 500-5000 PLN: jakie taktyki?
   - Produkty 5000+ PLN: jakie taktyki?

B. OBIEKCJE typowe per produkt i jak je rozwiazuja najlepsi.

C. SEKWENCJE EMAIL/FOLLOW-UP ktore dzialaja w branzy.

D. TRIGGERY ZAKUPOWE per przedzial cenowy.

---

Rynek: Polska
Format: Konkretne przyklady, URL-e, cytaty ze stron.
```

#### WARIANT C: E-commerce (sklep/katalog)

Uzyj gdy uzytkownik ma sklep online lub katalog produktow.

```
Prowadze sklep {NAZWA} z kategoria produktow: {KATEGORIA_PRODUKTU}.
Przedzialy cenowe: {OD} - {DO} PLN.
Sprzedaje {B2C_B2B} na rynku polskim.

{JESLI_ISTNIEJACY_LEJEK}
Obecne lejki: {OPIS}
{/JESLI_ISTNIEJACE_LEJKI}

Potrzebuje analizy lejkow sprzedazowych dla e-commerce w 3 obszarach:

---

## CZESC 1: JAK SPRZEDAJE KONKURENCJA

A. TOP 5 SKLEPOW KONKURENCYJNYCH:
   Per sklep: URL, lejek zakupowy (od odkrycia do powtornego zakupu),
   remarketing, email marketing, program lojalnosciowy.

B. DEKONSTRUKCJA LEJKOW E-COMMERCE:
   - Jak pozyskuja pierwszy zakup?
   - Jak buduja powrotnosc?
   - Jakie sekwencje post-purchase maja?

---

## CZESC 2: NAJLEPSZE LEJKI DLA E-COMMERCE W {KATEGORIA_PRODUKTU}

A. TOP 3 MODELE LEJKOW (np. Tripwire, Subscription, Flash Sale).
B. BENCHMARKI: konwersja koszyka, AOV, retencja, LTV.
C. Jakie lead magnety dzialaja w e-commerce (kody rabatowe, quizy, probki).

---

## CZESC 3: TAKTYKI SPRZEDAZOWE

A. TECHNIKI ZWIEKSZANIA AOV (average order value).
B. SEKWENCJE EMAIL: powitalna, porzucony koszyk, post-purchase, win-back.
C. TRIGGERY: urgency, social proof, darmowa dostawa od X, pakiety.

---

Rynek: Polska
Format: Konkretne nazwy, URL-e, benchmarki.
```

**Ktory wariant wybrac?**
Asystent automatycznie dobiera wariant na podstawie Kroku 1.5:
- 1 produkt, 1 persona → WARIANT A
- Wiele produktow/uslug → WARIANT B
- Sklep/katalog → WARIANT C

---

### Krok 4: Pokaz instrukcje kopiowania

Wyswietl uzytkownikowi:

```
CO TERAZ ZROBIC:

1. Skopiuj powyzszy prompt (caly blok kodu)
2. Wklej go do ChatGPT (Deep Research), Gemini lub Perplexity
   w przegladarce
3. Poczekaj na wyniki (Deep Research moze trwac 5-10 minut)
4. Skopiuj CALY wynik i wklej go tutaj

To JEDEN prompt ktory zbada 3 tematy:
- Lejki sprzedazowe konkurencji (krok po kroku)
- Najlepsze modele lejkow dla Twojej branzy
- Taktyki sprzedazowe ktore dzialaja

Gdy wkleisz wyniki, przeanalizuje je i przygotuje pelny raport.
```

---

### Krok 5: Analiza wynikow (gdy uzytkownik wklei wyniki)

Gdy uzytkownik wklei wyniki z Deep Research, przeanalizuj je wedlug ponizszej struktury.

#### Struktura raportu

Przygotuj raport w formacie:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALIZA LEJKOW SPRZEDAZOWYCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ZAKRES: [Jeden produkt: NAZWA / Caly biznes / E-commerce]
KATEGORIA: [np. "Edukacja online B2C, cena 2000-5000 PLN"]
OBECNY LEJEK: [opis lub "Brak"]

PODSUMOWANIE WYKONAWCZE (3-5 zdan)
"Najskuteczniejsi konkurenci w Twojej branzy uzywaja lejka [typ].
Typowa konwersja to [X-Y]%. Najlepszy lead magnet to [format].
Kluczowa taktyka zamykania: [technika].
Najwieksza szansa: [luka ktora mozesz wykorzystac]."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CZESC 1: LEJKI KONKURENCJI

### Dekonstrukcja TOP 3

1. [KONKURENT] - [URL]
   Lejek: [nazwa modelu]
   Cena: [ich produkt + cena]

   ETAP 1 - UWAGA: [jak przyciagaja]
   ETAP 2 - LEAD: [jaki lead magnet]
   ETAP 3 - NURTURING: [jak rozgrzewaja]
   ETAP 4 - CLOSE: [jak zamykaja]
   ETAP 5 - POST-SALE: [co po zakupie]

   Mocne strony: [co robia dobrze]
   Slabe strony: [gdzie mozna ich pobic]

[Powtorz dla kolejnych]

### Porownanie

| Element | Konkurent 1 | Konkurent 2 | Konkurent 3 |
|---------|-------------|-------------|-------------|
| Typ lejka | [X] | [Y] | [Z] |
| Lead magnet | [X] | [Y] | [Z] |
| Metoda close | [X] | [Y] | [Z] |
| Skutecznosc | [ocena] | [ocena] | [ocena] |

### Quick wins do skopiowania
- [ ] [Element 1 od Konkurenta X]
- [ ] [Element 2 od Konkurenta Y]
- [ ] [Element 3 od Konkurenta Z]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CZESC 2: REKOMENDACJA LEJKA

### TOP 3 modele lejkow dla Twojego biznesu

1. [NAZWA LEJKA] - Rekomendowany

   Dlaczego pasuje: [2-3 zdania]
   Typowa konwersja: [X-Y]%
   Case study: [firma + wynik]
   Koszt wdrozenia: [czas + pieniadze]
   Ograniczenia: [dla kogo NIE zadziala]

2. [NAZWA LEJKA] - Alternatywa
   [Analogicznie]

3. [NAZWA LEJKA] - Plan B
   [Analogicznie]

### Benchmarki dla Twojej branzy

| Metryka | Slabe | Dobre | Swietne |
|---------|-------|-------|---------|
| Konwersja landing page | [X]% | [Y]% | [Z]% |
| Konwersja lead magnet | [X]% | [Y]% | [Z]% |
| Konwersja email -> sprzedaz | [X]% | [Y]% | [Z]% |
| Cykl sprzedazy | [X] dni | [Y] dni | [Z] dni |

### TOP 3 lead magnety dla Twojej branzy
1. [Format + przyklad tytulu] - konwersja: [X]%
2. [Format + przyklad tytulu] - konwersja: [X]%
3. [Format + przyklad tytulu] - konwersja: [X]%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CZESC 3: TAKTYKI SPRZEDAZOWE

### Techniki zamykania skuteczne w branzy
1. [Technika] - dlaczego dziala przy cenie {CENA}
2. [Technika] - dlaczego dziala
3. [Technika] - dlaczego dziala

### Obiekcje i sprawdzone odpowiedzi
- "Za drogo" → [jak odpowiadaja najlepsi w branzy]
- "Musze przemyslec" → [co dziala]
- [Inna typowa] → [co dziala]

### Sekwencja email ktora dziala
Mail 1 (dzien 0): [temat + cel]
Mail 2 (dzien X): [temat + cel]
Mail 3 (dzien X): [temat + cel]
Mail 4 (dzien X): [temat + cel]
Mail 5 (dzien X): [temat + cel]

### Triggery zakupowe
- Urgency: [co dziala w branzy]
- Social proof: [jaki format opinii konwertuje]
- Gwarancje: [jakie oferuja konkurenci]
- Pricing: [raty/pakiety/early bird - co lepsze]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PLAN DZIALANIA

Na podstawie analizy, Twoje TOP 3 akcje:
1. [Akcja - lejek do wdrozenia]
2. [Akcja - taktyka do zastosowania]
3. [Akcja - element do skopiowania od konkurencji]

Nastepny krok: Wybor lejka (plik materialy/wybor_lejka.md)
```

#### Pytania koncowe

Po prezentacji raportu zapytaj:
1. "Ktory model lejka najbardziej Ci pasuje?"
2. "Ktore elementy od konkurencji chcesz skopiowac?"
3. "Ktore taktyki chcesz wdrozyc NAJPIERW?"
4. "Mam zapisac wyniki do plan.md?"

Zaproponuj: Przejscie do wyboru lejka sprzedazowego (plik materialy/wybor_lejka.md)

---

## INSTRUKCJA ANALIZY WYNIKOW

### Zasady antyhalucynacji

- Czytaj dane TYLKO z plikow uzytkownika i wynikow Deep Research
- Jesli czegos nie ma w wynikach - napisz "Nie znaleziono w badaniu"
- Gdy cytujesz - podaj zrodlo: "Ze strony [konkurent]", "Wedlug badania [URL]"
- Zaznaczaj poziomy pewnosci:
  - "Potwierdzam" - znaleziono konkretne dane (cena na stronie, lejek widoczny)
  - "Szacuje" - obliczasz na podstawie danych
  - "Prawdopodobnie" - wnioskujesz logicznie
  - "Nie znaleziono" - brak danych, pytaj uzytkownika
- NIGDY nie wymyslaj: cen konkurencji, sekwencji email, lead magnetow
- Konwersje i benchmarki: podawaj TYLKO jesli znalezione w wynikach Deep Research. Jesli brak danych - napisz "Brak danych w badaniu" zamiast szacowac
- NIE analizuj konkurencji z innej kategorii cenowej
- NIE mieszaj B2C z B2B

### Hierarchia wiarygodnosci danych

**Najwyzsza pewnosc:**
- Informacje publiczne ze stron (ceny, oferty, lejki)
- Biblioteka Reklam Facebook (konkretne kampanie)
- Landing page'e konkurencji (mozna sprawdzic)
- Opinie klientow (Opineo, Google, Trustpilot)

**Srednia pewnosc:**
- Narzedzia analityczne (SimilarWeb, Ahrefs)
- Badania branzowe (raporty, benchmarki)
- Oferty pracy konkurencji (tech stack)

**Niska pewnosc (zaznacz jako szacunki):**
- Szacunki konwersji konkurencji
- Szacunki udzialu w rynku
- Wnioskowanie z ruchu na stronie

### Czego NIE robic

- [ ] NIE dodawaj informacji o kanalach dotarcia (to jest w persona.md)
- [ ] NIE szukaj gdzie sa klienci (to nie jest temat tego DR)
- [ ] NIE obiecuj konkretnych wynikow ("10 klientow w tydzien")
- [ ] NIE pisz wiecej niz 1500 slow raportu
- [ ] NIE twórz szablonow emaili (to robi CSO na podstawie wynikow)

---

## ZAPISYWANIE WYNIKOW

Po zatwierdzeniu przez uzytkownika, zapisz w plan.md:

```markdown
---
## WARSZTAT 7: Analiza Lejkow Sprzedazowych
Data analizy: [DD.MM.RRRR]

### Podsumowanie:
[3-5 zdan]

### TOP 3 Lejki Konkurencji:
1. [Konkurent] - [typ lejka]
   - Lead magnet: [jaki]
   - Metoda close: [jaka]
   - Co skopiowac: [element]
[2-3 analogicznie]

### Rekomendowany Lejek:
[Nazwa modelu] - konwersja: [X-Y]%
Dlaczego: [1-2 zdania]

### Benchmarki Branzy:
- Konwersja LP: [X]%
- Konwersja email: [X]%
- Cykl sprzedazy: [X] dni

### Kluczowe Taktyki:
1. [Technika close]
2. [Trigger zakupowy]
3. [Format lead magnetu]

### Nastepny krok:
Wybor lejka sprzedazowego (plik materialy/wybor_lejka.md)
---
```

---

### Krok 6: Zapis wynikow

Po zakonczeniu analizy, proponuje zapis:

```
PROPONUJE ZAPIS WYNIKOW:

1. oferta.md - aktualizacja sekcji lejkow i konkurencji
2. plan.md - dodanie do sekcji STRATEGIA SPRZEDAZY
3. decyzje.md - zapis kluczowych decyzji

Zapisac? (tak/nie/edytuj)
```

---

**NASTEPNY KROK:** Po uzyskaniu wynikow przejdz do **wyboru lejka sprzedazowego** (plik materialy/wybor_lejka.md)

**HANDOFF:** Skopiuj CALY raport z Kroku 5 - wybor_lejka.md potrzebuje wynikow Deep Research jako input. Nie musisz otwierac nowego czatu - CSO automatycznie uzyje wynikow jesli sa w kontekscie rozmowy.
