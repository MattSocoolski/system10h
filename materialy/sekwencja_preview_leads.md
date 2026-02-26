# SEKWENCJA EMAILI — PREVIEW LEADS
## 3 maile po Live Preview (MailerLite autoresponder)

**Lista:** "preview-leads"
**Wejście:** Formularz "Wyślij wyniki na email" w Live Preview (/preview)
**Kontekst:** Lead WIDZIAŁ output AI dla SWOJEJ branży. Jest cieplejszy niż SD lead.

**Zasady:**
- Ton: kolega z branży, bezpośredni
- Max 150 słów na mail (KRÓTSZE niż SD sekwencja)
- Plain text
- Wysyłka: WT-CZ, 8-10 lub 15-16
- Każdy mail = 1 cel, 1 CTA

---

## MAIL 1 — DZIEŃ 0 (natychmiast po wysłaniu wyników)

**TEMAT:** Twoje wyniki z Live Preview + co dalej

**TREŚĆ:**

Hej {$name},

Właśnie wygenerowałeś próbki dla swojej branży. Masz email sprzedażowy, obronę ceny i follow-up — spersonalizowane pod Twój biznes.

To co widziałeś to 3 z 15 scenariuszy w Systemie 10h+.

Różnica? W Live Preview AI miało 3 dane o Tobie. W pełnym systemie ma 240. Profil, personę klienta, Twój styl pisania, obiekcje, procedury, zasady cenowe... Plus inteligentny routing — nie musisz nawet mówić AI co chcesz. Sam rozpoznaje czy potrzebujesz ofertę, follow-up czy obronę ceny.

Efekt: AI pisze tak, że Twoi klienci myślą że to Ty. Nie robot.

Chcesz zobaczyć pełną wersję na żywo? 15 minut, zero presji:

→ Odpisz "demo" — dobierzemy termin.

Mateusz

**CTA:** Odpowiedz "demo"
**Cel:** Konwersja na rozmowę (lead jest ciepły — WIDZIAŁ produkt)

---

## MAIL 2 — DZIEŃ 3

**TEMAT:** 3 dane vs 240 — dlatego Live Preview to dopiero początek

**TREŚĆ:**

Hej {$name},

Live Preview miało 3 pola: branża, produkt, ból.

System 10h+ ma 240: Twój profil, historię, klientów, styl pisania (z analizy Twoich prawdziwych maili), obiekcje, politykę cenową, procedury, workflow'y.

Praktyczny przykład:

Live Preview: "Dzień dobry, mamy ofertę dla Pana branży."
System 10h+: "Panie Marku, widziałem że rozszerzyliście produkcję o elementy ze stali duplex. Przy takim wolumenie pewnie zaczyna boleć follow-up po ofertach — 20 zapytań rano, a każdy wymaga innego podejścia."

3 dane = generyk. 240 danych = klon Ciebie.

System kosztuje 2 500 PLN. Zwraca się po 1 uratowanym dealu.

→ Odpisz "demo" — pokażę Ci różnicę na żywo.

Mateusz

P.S. Do końca lutego: PILOT 1 990 PLN (zamiast 2 500) z osobistym monitoringiem 30 dni — ja osobiście pilnuję że system Ci działa. Limit 2 miejsca. Napisz "pilot".

**CTA:** Odpowiedz "demo" lub "pilot"
**Cel:** Pokazanie gap (LP vs full system) + ROI + Pilot Deal urgency

---

## MAIL 3 — DZIEŃ 7 (BREAK-UP)

**TEMAT:** Zamykam wątek — Twoje wyniki zostają

**TREŚĆ:**

Hej {$name},

Ostatni mail. Nie będę Cię ścigał.

Twoje wyniki z Live Preview masz na mailu — używaj ich. Działa nawet bez Systemu.

Gdybyś kiedyś chciał pełną wersję (15 workflow'ów, AI które pisze w Twoim stylu, gwarancja 30 dni) — napisz "wracam". Odpowiem.

Powodzenia,
Mateusz

P.S. Jeśli masz znajomego handlowca który mógłby skorzystać z Live Preview — prześlij mu ten link: system10h.com/preview

P.P.S. Ostatnia szansa: PILOT 1 990 PLN (zamiast 2 500) + osobisty monitoring 30 dni. Limit 2 miejsca, tylko do końca lutego. Napisz "pilot".

**CTA:** "Wracam" + referral (LP link do znajomego) + "pilot"
**Cel:** Szacunkowe zamknięcie + viral loop (referral do LP) + last-chance Pilot Deal

---

## PODSUMOWANIE

| # | Dzień | Temat | Typ | CTA |
|---|-------|-------|-----|-----|
| 1 | 0 | Twoje wyniki + co dalej | Delivery + upgrade hook | "Demo" |
| 2 | 3 | 3 dane vs 240 | Gap analysis (LP vs System) | "Demo" |
| 3 | 7 | Zamykam wątek | Break-up + referral | "Wracam" + viral LP |

**Schemat:** 100% sprzedażowe (lead już widział produkt — nie potrzebuje edukacji)
**Benchmark:** Open 50%+ (mail 1 = delivery), CTR 10%+ (mail 2 = curiosity gap)

---

## SETUP W MAILERLITE

1. Stwórz grupę: **preview-leads**
2. Formularz (embedded w LP): imię + email → dodaj do grupy "preview-leads"
3. Automation trigger: "Subscriber joins group preview-leads"
4. 3 emaile z delay'ami: 0, +3 dni, +4 dni (łącznie 7 dni)
5. Tag po zakończeniu: "preview-sequence-complete"

**Deduplikacja z SD:**
- Jeśli subscriber ma tag "self-discovery" → dodaj tag "preview-used" (do pominięcia LP CTA w SD sekwencji)
- Jeśli subscriber jest NOWY (tylko preview) → pełna sekwencja 3 maili

---

*Utworzono: 13.02.2026 | Sekwencja dla leadów z Live Preview*
