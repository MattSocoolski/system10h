# INSTRUKCJA: ZAMAWIANIE PBN (Z Chin — pelen cykl)

> Data utworzenia: 21.11.2025 | Dla: Mariana Sokulska (Gliwice)
> System: IdoSell (IAI) | Waluta: USD | 1 karton = 30 sztuk

---

## I. ANALIZA SPRZEDAZY — Czy i co zamawiac?

### 1. Zrodla danych
- Raport z **Plannera** (pomijaj status "wycofane")
- Szablon **"Order Artnapi"**
- Widok w IAI: **Towary > Analiza > Do zamowienia** (reczna weryfikacja)

### 2. Kryteria decyzyjne

| Warunek | Decyzja |
|---------|---------|
| >= 30 szt. w 180 dni | ZAMAWIAJ (pelny karton = 30 szt.) |
| < 30 szt. w 180 dni | SPRAWDZ: okres (Q3/Q4? sezonowosc?) + marza (niska = czy warto?) |

### 3. Nowe obrazy
- Grafika: dopasowanie do zdjec > jakosc linii, kolory
- 2-4 iteracje korekt przed finalnym zatwierdzeniem
- Uwzglednij **sezonowosc motywow** (np. "morskie" = wiosna, "boze narodzenie" = lato/zamowienie)

### 4. Kalkulacja ilosci
W raporcie — dodaj kolumne **"Zapotrzebowanie (kartony)"**:
```excel
=ZAOKR.DO.WIELOKR(JEZELI([obrot]>0; [obrot]; 0); 30)
```
Umiec **pomiedzy kolumnami "obrot" a "stan dysp."**

---

## II. PRZYGOTOWANIE ZAMOWIENIA

### 1. Dane zrodlowe
Skopiuj z arkusza od Chinczykow:
- kody towarow (EAN / kod producenta)
- ceny jedn. netto [USD]
- waga [kg], objetosc [m3], nazwy

### 2. CSV do IAI
Format wiersza:
```
KOD_PRODUKTU;ILOSC;CENA_NETTO
```

Formula Excel:
```excel
=A2&";"&B2&";"&C2
```
Przyklad: `PBN-789;30;8.95`

> Uzyj `$` przy stalych, np. `$E$1` dla kursu USD.

### 3. W IAI — przy tworzeniu zamowienia
- [x] Transport **spoza UE**
- [x] Waluta: **USD**
- [x] Notatka: `"PBN — kontener [nr], plan. przyj. [dd.mm], Artnapi"`

---

## III. PRZYGOTOWANIE PZ (PRZED PRZYJECIEM)

> PZ tworzymy zaraz po zamowieniu / przed przyjazdem towaru, by miec pelny obraz kosztow.

### Skladniki kosztow PZ

| Skladnik | Waluta | Zrodlo |
|----------|--------|--------|
| Towar (wartosc zakupu) | USD | Z faktury dostawcy lub arkusza Chinczykow |
| Clo (A00) | PLN | Moze byc laczna kwota dla calej dostawy |
| Transport z Chin | USD | Kwota w dolarach |
| Transport w Polsce | PLN/USD | Oznacz walute! |
| Dane logistyczne | — | Waga, m3, nazwy, kody |

### Wazne
- **Kurs USD:** NBP z dnia **poprzedzajacego** przyjecie
- **Data przyjecia w IAI:** dzien **po** fizycznym odbiorze (procedura ksiegowa)

### Szablon kosztow
Uzyj: **"szablon koszty dostawy artnapi kontener"**
- Uzupelnij: clo A00 + transport USD + transport PL + towar z faktury
- Przelicz po kursie NBP

---

## IV. ROZLICZENIE ROZNIC — po otrzymaniu faktury

> Czesto: cena lub ilosc w fakturze =/= zamowienie (braki, rabaty, zmiana kursu).

### Procedura w IAI

**1. Porownaj:**
- Zamowienie (CSV)
- Fakture (od Chinczykow)
- Przyjecie (PZ)

**2. Ustal roznice:**

| Typ | Przyklad |
|-----|---------|
| Ilosciowa | Zamowiono 300 szt., dostarczono 280 = 20 szt. braku |
| Cenowa | Cena 10,00 USD > faktycznie 9,75 USD (rabat) |

**3. W IAI:**
- Edytuj PZ lub zamknij dostawe z korekta
- W polu "Notatka" dodaj: `"Korekta po fakturze: -20 szt. [kod], cena jedn. skorygowana z 10,00 > 9,75 USD"`
- Jesli clo/transport sie zmienil — zaktualizuj A00 i koszty dostawy

**4. Dokumentuj:**
Zapisz fakture i mail z uzgodnieniem roznic w folderze:
```
PBN / Rok / [Nr kontenera] / Korekty
```

> Wskazowka: Jesli roznice sa systematyczne (Chinczycy czesto obnizaja cene po fakcie), zapytaj czy mozna wprowadzic "cene orientacyjna" w zamowieniu + pole "cena faktyczna" w PZ.

---

## V. RAPORT DLA WLADYSLAWA (way2send)

> Z PZ (niezamknietego) generujesz raport do sprawdzenia podczas fizycznego przyjecia.

### Procedura
1. PZ dla towarow jakie maja przyjechac — wpisz wszystkie ceny zakupu
2. Raport z Plannera (NIE brac pod uwage "wycofane")
3. Plik: **szablon order artnapi**
4. Wyslij na way2send do Wladyslawa
5. Wladyslaw sprawdza fizycznie co faktycznie zostalo wyslane
6. Jego plik pozwala dookrelic jak przyjac PZ (roznice ilosc/jakosc)

---

## VI. DOSTAWY W IAI — nawigacja

- **PZ w drodze:** Pokaz dostawy niezamkniete > "w drodze"
- **Zamkniecie PZ:** Dopiero po rozliczeniu roznic + fizycznym przyjecia

---

## CHECKLIST — przed zamknieciem cyklu

### Zamowienie
- [ ] CSV zgodny z szablonem (KOD;ILOSC;CENA)
- [ ] W IAI: waluta USD, "spoza UE", notatka z nr kontenera

### Przyjecie
- [ ] PZ zawiera: towar + clo + transport
- [ ] Data przyjecia = dzien po przyjezdzie
- [ ] Dane logistyczne (kg, m3) zapisane
- [ ] Kurs NBP z dnia poprzedzajacego

### Rozliczenie
- [ ] Faktura porownana z zamowieniem i PZ
- [ ] Roznice wprowadzone w IAI + opisane w notatce
- [ ] Braki zgloszone dostawcy (mail + potwierdzenie)

### Magazyn
- [ ] Towar przyjety fizycznie i logicznie
- [ ] Ew. braki zarejestrowane jako "brak fizyczny"
- [ ] Raport Wladyslawa rozliczony

---

*Ostatnia aktualizacja: 19.02.2026 (przeniesienie do projektu ARTNAPI_OS)*
