# PROJEKT: AGENCI AI DLA URZEDOW (KPO)
## Partner: Krystian Szczypek | Status: DISCOVERY | Data: 02.03.2026

---

## ELEVATOR PITCH

Krystian Szczypek prowadzi zaawansowane szkolenia z KPO dla urzedow w Pomorskim. Urzednicy zobaczyli jak AI moze przyspieszyc ich procesy (dokumenty, analiza wnioskow). Krystian proponuje wspolprace — on ma relacje z urzedami, Mateusz buduje agentow AI. Wspolnie oferuja dedykowanych, RODO-compliant agentow AI dla sektora publicznego.

---

## MODEL WSPOLPRACY

| Rola | Kto | Co robi |
|------|-----|---------|
| **Relacje + sprzedaz + analiza** | Krystian Szczypek | Pozyskuje urzedy, prowadzi faze analizy, zbiera wymagania |
| **Silnik AI + wdrozenie** | Mateusz Sokolski | Buduje agentow, konfiguruje, wdraza, szkoli |
| **Tech / infrastruktura** | Kamil Andrusz (do potwierdzenia) | Cloud, Vertex AI, architektura, DevOps |

### 4 FAZY WDROZENIA

```
FAZA 1: ANALIZA (Krystian)
  Audyt procesow urzedu, identyfikacja use case'ow,
  oszacowanie wolumenu, kontakt z IOD

FAZA 2: WYWIAD / PRZYGOTOWANIE (Krystian + Mateusz)
  Zbieranie danych (odpowiednik Architekta AI),
  checklista procesow, wymagania RODO, specyfikacja agenta

FAZA 3: BUDOWA SILNIKA (Mateusz + Kamil)
  Konfiguracja agenta, prompty, workflow'y,
  hosting na Google Vertex AI (Frankfurt),
  testy, dokumentacja RODO (DPIA)

FAZA 4: WDROZENIE + SZKOLENIE (Mateusz + Krystian)
  Instalacja, szkolenie uzytkownikow,
  wsparcie 30-90 dni, iteracje
```

---

## USE CASE'Y (z rozmowy z Krystianem)

1. **Powtarzalne dokumenty** — agent automatyzuje podmienianie danych, formatowanie, przygotowanie do podpisu i wyslania
2. **Analiza wnioskow** — agent sprawdza wypelnione wnioski wg wgranej checklisty, flaguje bledy/braki
3. **[DO ODKRYCIA]** — kolejne procesy po audycie urzedu

---

## TECHNOLOGIA — RODO COMPLIANT

### REKOMENDACJA: Google Vertex AI + Claude (Frankfurt)

```
URZEDNIK (przegladarka)
    |
    v
APLIKACJA WEBOWA (serwer EU — Hetzner DE / Google Cloud EU)
    |
    v
GOOGLE VERTEX AI — CLAUDE (Frankfurt, europe-west3)
```

**Dlaczego ta architektura:**
- Przetwarzanie danych FIZYCZNIE w EU (Frankfurt)
- Google Cloud DPA — GDPR compliant
- Claude API — dane NIE sa uzywane do treningu modeli
- Regional endpoint — gwarantowany routing przez EU
- Audit log w aplikacji — kto, kiedy, co pytal
- Retencja danych konfigurowalna

### POROWNANIE OPCJI

| Opcja | Serwery EU | In-region processing | DPA | Jakosc AI | Status |
|-------|-----------|---------------------|-----|-----------|--------|
| **Google Vertex AI + Claude (Frankfurt)** | TAK | **TAK (prawdziwe)** | TAK | Najwyzsza | REKOMENDOWANA |
| Amazon Bedrock + Claude (Frankfurt) | TAK | Czesciowe (cross-region) | TAK | Najwyzsza | BACKUP |
| Mistral La Plateforme | TAK (Francja) | TAK | TAK | Dobra (nizsza niz Claude) | ALTERNATYWA |
| Anthropic API bezposrednio | NIE (US) | NIE | TAK (SCCs) | Najwyzsza | RYZYKOWNA dla gov |

### KOSZTY INFRASTRUKTURY (szacunek per urzad)

| Pozycja | Koszt/msc |
|---------|-----------|
| Vertex AI Claude (API) | 200-800 PLN |
| Hosting aplikacji (EU) | 80-200 PLN |
| **Lacznie** | **300-1 000 PLN/msc** |

---

## CENNIK (propozycja robocza)

| Usluga | Cena | Co zawiera |
|--------|------|------------|
| **Warsztat AI** (1 dzien) | 3 000-5 000 PLN | Demo agentow, hands-on, identyfikacja procesow |
| **Pilot: 1 agent, 1 proces** | 15 000-25 000 PLN | Analiza + budowa + RODO docs + 30 dni wsparcie |
| **Wdrozenie: 3-5 agentow** | 40 000-80 000 PLN | Pelny audyt + agenci + integracje + RODO + szkolenie + 90 dni |
| **Abonament wsparcia** | 2 000-5 000 PLN/msc | Utrzymanie, aktualizacje, nowi agenci |

**Revenue split Mateusz/Krystian:** Do ustalenia (propozycja: 60/40 lub 70/30 na korzysc tech)

---

## DOKUMENTACJA RODO — CHECKLIST

| # | Dokument | Kto robi | Status |
|---|----------|----------|--------|
| 1 | DPA z Google Cloud (umowa powierzenia) | Google — gotowy szablon | DO PODPISANIA |
| 2 | DPIA (ocena skutkow dla ochrony danych) | Mateusz + IOD urzedu | DO ZROBIENIA |
| 3 | Rejestr czynnosci przetwarzania | Mateusz — szablon | DO ZROBIENIA |
| 4 | Klauzula informacyjna | Mateusz — szablon | DO ZROBIENIA |
| 5 | Polityka retencji danych | Ustalenie z urzedem | DO ZROBIENIA |
| 6 | Audit log (wbudowany w app) | Mateusz + Kamil | DO ZBUDOWANIA |

**Koszt jednorazowy: prawnik RODO ~3 000-5 000 PLN za szablony (potem powielasz)**

---

## CO WIEMY vs CZEGO NIE WIEMY

### WIEMY
- Krystian ma dostep do urzedow Pomorskiego (szkolenia KPO)
- Urzednicy zainteresowani AI (powtarzalne dokumenty, analiza wnioskow)
- RODO = bezwzgledne wymaganie
- Lokalne modele odpodaja (jakosc + koszt)
- Google Vertex AI Frankfurt = najlepsza sciezka RODO-compliant z Claude
- KPO = budzety na cyfryzacje (musza byc wydane)
- Kamil Andrusz potencjalnie dostepny na tech

### NIE WIEMY (KRYTYCZNE)
- [ ] Ile urzedow Krystian ma w pipeline?
- [ ] Jakie KONKRETNE procesy do automatyzacji? (nazwy, wolumen, systemy)
- [ ] Procedura zakupowa: przetarg czy zamowienie bezposrednie? (prog: 130k netto)
- [ ] Budzet KPO per urzad na AI
- [ ] **Timeline KPO — kiedy musza wydac pieniadze?** (deadline = nasz deadline)
- [ ] Jakie systemy IT uzywaja (ePUAP, EZD, inne)
- [ ] Czy Kamil Andrusz ogarnie cloud/Vertex AI?
- [ ] Czy urzedy maja IOD?

### LUKI / RYZYKA
- [ ] Brak doswiadczenia B2G (gov IT) — szukac partnera?
- [ ] DPIA wymaga prawnika RODO
- [ ] Integracja z systemami urzedu (EZD, ePUAP) — nieznany zakres
- [ ] Cykl decyzyjny urzedu: 1-6 msc
- [ ] Skalowanie: 1 urzad = pilot, ale 10 = inny poziom supportu

---

## PLAN AKCJI

| # | Akcja | Kto | Kiedy | Status |
|---|-------|-----|-------|--------|
| 1 | Wyslac Krystianowi podsumowanie modelu wspolpracy (4 fazy) | Mateusz | Ten tydzien | [ ] |
| 2 | Spotkanie z Krystianem: ile urzedow, budzet, timeline KPO | Mateusz + Krystian | Ten tydzien | [ ] |
| 3 | Rozmowa z Kamilem Andruszem: kompetencje cloud/Vertex AI | Mateusz | Ten tydzien | [ ] |
| 4 | Email do Anthropic Enterprise (pubsec@anthropic.com): EU gov options | Mateusz | Ten tydzien | [ ] |
| 5 | Zalozenie konta Google Cloud + test Vertex AI Claude Frankfurt | Mateusz / Kamil | 1-2 tyg | [ ] |
| 6 | Prototyp: 1 agent (analiza wniosku wg checklisty) | Mateusz | 2-3 tyg | [ ] |
| 7 | Znalezc prawnika RODO — szablony DPIA | Mateusz | Przed pilotem | [ ] |
| 8 | Ustalenie cennika i revenue split z Krystianem | Mateusz + Krystian | Przed pierwsza oferta | [ ] |
| 9 | Pierwsza oferta pilotowa do urzedu | Mateusz + Krystian | Marzec/kwiecien | [ ] |

---

## SHINY OBJECT TEST

| Test | Odpowiedz |
|------|-----------|
| Przyniesie kase w 30 dni? | Watpliwe (gov = dlugi cykl). ALE warsztat moze byc w 2-3 tyg. |
| Ile otwartych priorytetow masz? | Pipeline 10H: 18 490 PLN, 8 leadow, cel 7k do maja |
| Co usuwasz? | NIC — dziala rownolegle JESLI Krystian robi sprzedaz, Ty tech |
| Verdict | NIE jest shiny object JESLI nie zjada czasu z pipeline'u handlowcow B2B |

---

## ZRODLA (research 02.03.2026)

- Anthropic Privacy Center — serwery EU: https://privacy.claude.com/en/articles/7996890
- Claude Public Sector FAQs: https://support.claude.com/en/articles/13756069
- Google Vertex AI — Claude models: https://docs.google.com/vertex-ai/generative-ai/docs/partner-models/claude
- Vertex AI locations: https://docs.cloud.google.com/vertex-ai/docs/general/locations
- Anthropic DPA: https://privacy.claude.com/en/articles/7996862
- Mistral AI GDPR: https://weventure.de/en/blog/mistral
- innFactory — Claude EU options: https://innfactory.ai/en/ai-models/anthropic-claude/
- Claude data retention: https://www.datastudios.org/post/claude-data-retention-policies

---

*Wygenerowane: 02.03.2026 | @cso + @ceo + research | System 10H*
