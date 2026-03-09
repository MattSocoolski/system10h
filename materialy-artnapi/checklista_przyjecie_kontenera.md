# CHECKLISTA PRZYJECIA KONTENERA — ARTNAPI
**Wersja:** 1.0 | **Data:** 2026-03-02
**Zasada naczelna: FAKTURA CHINSKA = JEDYNE ZRODLO PRAWDY. Zawsze.**

---

## ZASADY ZELAZNE

1. **FAKTURA = ZRODLO PRAWDY.** PZ ma sie zgadzac z faktura, nie odwrotnie.
2. **KAZDY produkt z faktury MUSI trafic do PZ.** Brak EAN w IdoSell = dodaj EAN, nie pomijaj produktu.
3. **Wiele linii pakowania = zsumuj RECZNIE przed wprowadzeniem.** Nie ufaj automatycznemu merge.
4. **Koszty ladu liczymy OD WARTOSCI FAKTURY.** Nigdy od kwoty PZ.
5. **Weryfikacja idzie od faktury do PZ, nie od PZ do faktury.**

---

## PRZED ROZPOCZECIEM — DOKUMENTY

- [ ] Faktura chinska (PDF/XLS) — pobrana i zapisana w `/Desktop/PZ CHINA/`
- [ ] Packing list — pobrana i zapisana tamze
- [ ] Znasz lacza wartosc faktury w USD
- [ ] Znasz parametry kosztowe: fracht, clo, dostawa PL, kurs USD/PLN

---

## KROK 1 — PRZYGOTOWANIE ARKUSZA ROBOCZEGO

- [ ] Otworz fakture i packing list jednoczesnie (dwa okna)
- [ ] Stworz arkusz z kolumnami:

| SKU | Nazwa | CTN_1 | QTY/CTN_1 | CTN_2 | QTY/CTN_2 | TOTAL_QTY | CENA_USD | WARTOSC_USD | EAN_IDOSELL | STATUS |

- [ ] Przepisz KAZDY wiersz z faktury do arkusza
- [ ] Dla produktow z WIELOMA liniami pakowania (np. CF01-04: 107 CTN x 20 + 150 CTN x 40):
  - Wpisz obie linie osobno w kolumny CTN_1/CTN_2
  - Policz TOTAL_QTY recznie: (107x20) + (150x40) = 2140 + 6000 = **8140**
  - Sprawdz kalkulatorem — nie licz w glowie

---

## KROK 2 — WERYFIKACJA EAN W IDOSELL

- [ ] Dla kazdego SKU sprawdz czy istnieje w IdoSell i ma EAN
- [ ] Produkty BEZ EAN — **STOP. Nie pomijaj. Dodaj EAN do IdoSell TERAZ.**
- [ ] Kolumna STATUS: wpisz "OK" gdy EAN potwierdzony

**BLOKADA:** Nie przechodzisz do kroku 3 dopoki STATUS = OK dla KAZDEGO wiersza.

---

## KROK 3 — BUDOWANIE PZ / CSV DO IAI

- [ ] Buduj CSV na podstawie arkusza roboczego (nie z faktury bezposrednio)
- [ ] Sprawdz czy CSV zawiera TYLE pozycji ile faktura
- [ ] Suma kontrolna: zsumuj WARTOSC_USD → MUSI = wartosc faktury

---

## KROK 4 — WERYFIKACJA PZ PO IMPORCIE

- [ ] **Liczba pozycji:** PZ = faktura
- [ ] **Kazda pozycja:** SKU, ilosc — porownaj PZ z arkuszem roboczym
- [ ] **Suma PZ w USD** = wartosc faktury (roznica max $1 od zaokraglen)
- [ ] Multi-line produkty: ilosc = suma reczna

---

## KROK 5 — KOSZTY LADU (LANDED COST)

- [ ] Podstawa kalkulacji = **WARTOSC FAKTURY**, nie kwota PZ
- [ ] Wspolczynnik landed = (Fracht + Clo + Dostawa) / WARTOSC FAKTURY
- [ ] Sprawdz: suma landed per pozycja = calkowite koszty importu

---

## PUNKTY KONTROLNE — MUST PASS

| # | Kontrola | OK? |
|---|----------|-----|
| 1 | Liczba pozycji PZ = liczba pozycji faktury | [ ] |
| 2 | Suma USD w PZ = wartosc faktury | [ ] |
| 3 | Kazdy produkt z faktury ma EAN w IdoSell | [ ] |
| 4 | Multi-line produkty: ilosc = suma reczna | [ ] |
| 5 | Landed cost od kwoty faktury (nie PZ) | [ ] |
| 6 | PZ zatwierdzone dopiero po przejsciu 1-5 | [ ] |

---

## TYPOWE PULAPKI

**1. Brak EAN = pominiecie produktu**
Symptom: Mniej pozycji w PZ niz w fakturze.
Fix: Krok 2 blokuje — dodaj EAN przed budowaniem CSV.

**2. Merge wielu linii pakowania**
Symptom: Ilosc w PZ rozni sie od faktury (np. 8120 zamiast 8140).
Fix: Licz multi-line recznie, wpisuj obie linie osobno.

**3. Landed cost od kwoty PZ zamiast faktury**
Symptom: Ceny zakupu WSZYSTKICH produktow sa zle.
Fix: Sprawdz mianownik kalkulacji = kwota faktury.

**4. Praca bezposrednio na PDF bez arkusza posredniego**
Symptom: Trudno sledzic, latwo o przeoczenie.
Fix: Arkusz roboczy = obowiazek.

---

## WERYFIKACJA KONCOWA — 5 PYTAN

1. Ile pozycji ma faktura? ___ Ile ma PZ? ___ → Rowne?
2. Wartosc faktury USD? $___ Suma PZ? $___ → Rowne?
3. Byl produkt bez EAN? → Czy go dodaLem?
4. Byl produkt z wieloma liniami pakowania? → Czy liczylem recznie?
5. Landed cost od kwoty faktury? TAK / NIE

Jesli JAKIEKOLWIEK = NIE → STOP. Napraw przed zatwierdzeniem.

---

*Stworzone: 2026-03-02 po kontenerze PLAP05 (lekcja: 4 pominięte produkty, 20 szt niedoliczone, zły mianownik landed cost).*
