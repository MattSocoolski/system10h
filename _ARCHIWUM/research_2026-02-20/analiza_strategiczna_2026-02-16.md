# ANALIZA STRATEGICZNA — BLIZNIAK BIZNESOWY
> Data: 16.02.2026 | Zrodlo: Deep Research rynku + analiza 41 plikow produktu (Opus 4.6)

---

## KLUCZOWE INSIGHTY Z DEEP RESEARCH

- **Zero bezposredniej konkurencji** w stylometrii jako core feature (SaaS ani done-for-you)
- Segment done-for-you AI sales → **nienasycony** (Halper jedyny bliski gracz)
- Rynek AI sales CAGR **25,9%** — ogromny wzrost
- Regie.ai = najblizszy konkurent ideologiczny, ale nie oferuje pelnej stylometrii
- Model jednorazowy = strategicznie poprawny na start
- PLG z Live Preview = najsilniejsza taktyka
- Polskie eventy: AI Summit Poland, Bielik Summit, Data & AI Warsaw → niewykorzystane

### Segmenty rynku AI Sales

| Segment | Gracze | Relacja z Blizniakiem |
|---------|--------|----------------------|
| Asystenci AI (notatki/analiza) | Fireflies, Avoma, Otter, Fathom | Uzupelniajacy |
| CRM z AI | HubSpot, Odoo | Konkurent w CRM; Blizniak = alternatywa/addon |
| Prospekting/Lead gen | Apollo.io, Manychat | Komplementarny |
| Coaching sprzedazy | Gong, Spiky.ai | Konkurent w analityce, inny cel |
| Personalizacja maili | Regie.ai | Najblizszy ideologicznie; Blizniak bardziej kompleksowy |
| AI Business Assistant | Halper | Bezposredni w segmencie; inny model (SaaS vs done-for-you) |
| Autonomiczny AI Agent | AiSDR | Konkurent w outreach; bardziej autonomiczny |

---

## ANALIZA PRODUKTU (41 plikow)

### Architektura
3-warstwowa: Onboarding (Architekt 35 pytan) → Konfiguracja (dna.md + CLAUDE.md + SKILL.md) → Operacja (15 WF + router)

### 15 Workflow'ow
| # | WF | Opis |
|---|-----|------|
| 1 | Email Reply | Analiza intencji + odpowiedz w stylu klienta |
| 2 | Offer Creation | Problem > Rozwiazanie > USP > Cena > CTA |
| 3 | Price Defense (Bad Cop) | NIGDY nie prowadzi z rabatem. Battle cards BC1-BC6 |
| 4 | Follow-up | Kadencja 3/7/14+ dni |
| 5 | Windykacja | 4-etapowa eskalacja |
| 6 | Outreach (Cold/Warm) | Hook + value prop + soft CTA |
| 7 | Prospect Research | Fit Score + talking points |
| 8 | Meeting Prep | Full prep sheet + 3 pytania otwierajace |
| 9 | Content Creation | LinkedIn, case study, artykuly |
| 10 | Pipeline Briefing | Red/Yellow/Green + top 3 na dzis |
| 11 | Formal Proposal | Dokument propozycji handlowej |
| 12 | Complaint Handling | Acknowledge > Investigate > Resolve |
| 13 | Deep Research | Meta-prompt do Gemini/Claude |
| 14 | Folder Hygiene | Health check plikow + limity |
| 15 | Business Development | 6 sub-trybow (audyt, segmenty, upsell, ceny, polecenia, plan 90 dni) |

### DNA (dna.md v2.0) — 8 sekcji, ~240 pol
S1 Profil | S2 Klient | S3 Oferta | S4 Zasady gry | S5 Styl i glos | S6 Obiekcje (6 BC) | S7 Procedury | S8 Workflow

### Unikalne USP vs generyczne AI
- Stylometria z prawdziwych maili
- Bad Cop (obrona marzy)
- 15 pre-built workflows z NL triggers
- Anty-halucynacja (strict rules)
- File governance (WF14)
- Solopreneur-focused (1-2h/dzien)

---

## LUKI PRODUKTOWE (do naprawy)

1. Scenariusze 12/15 (brak WF13-15 w BIBLIOTEKA_SCENARIUSZY.md)
2. INSTRUKCJA_KLIENTA.md mowi "13 WF" w jednym miejscu
3. SCENARIUSZ_WIDEO.md mowi "13 opcji" w intro
4. Worker na innej domenie niz system10h.com
5. Brak testow / sample dna.md
6. Self-Discovery skill nie w folderze produktu
7. Premium tier zarchiwizowany, nie rozwiniety
8. Zero testimoniali / case study na stronie
9. Brak changelog

---

## STRATEGIA: 3 FAZY PODBOJU

### FAZA 1: DOWOD (luty-marzec)
- Quick fixes spojnosc (15 WF w docs)
- Live Preview → email capture + share + watermark (LEAD MACHINE)
- Case study Stalton (HOLD — Natan konczy Architekta)

### FAZA 2: LEJEK (marzec-kwiecien)
- 3 tiers: Lite (0 PLN, 3 WF) / Solo (2 500, 15 WF) / Pro (4 500-5 000, S9+S10+MCP)
- Self-service Architekt AI na stronie (formularz MVP, nie konwersacja)
- Vertical Pack CNC/Produkcja
- Landing page z pricing table
- Pro = "coming soon" w F2, budowa w F3

### FAZA 3: SKALA (maj-lipiec)
- Partner program (trenerzy sprzedazy, 30-40% prowizji)
- "Blizniak sie uczy" (S9 Historia dealow + S10 Siec referralowa)
- Recurring: 197-297 PLN/msc (DNA refresh + nowe WF)
- 3 vertical packs (CNC, insurance, IT)
- 1 event/speaking

---

## NOWE WORKFLOW'Y (v6.0 — propozycja)

| # | WF | Opis | Impact |
|---|-----|------|--------|
| 16 | LinkedIn Automation | Connection requests, komentarze, InMail | WYSOKI |
| 17 | Win/Loss Analysis | Post-mortem po dealu | SREDNI |
| 18 | Phone Script | Scenariusz rozmowy telefonicznej | WYSOKI |
| 19 | Upsell Detector | Co jeszcze sprzedac klientowi | SREDNI |
| 20 | Weekly Report | Auto-podsumowanie tygodnia | NISKI |

## ULEPSZENIA ISTNIEJACYCH WF

| WF | Ulepszenie |
|----|------------|
| WF1 | + Urgency scoring + sentiment |
| WF4 | + Multi-channel cadence (email → LI → telefon) |
| WF6 | + A/B warianty zaczepek |
| WF10 | + Revenue forecast (prawdopodobienstwo x wartosc) |
| WF13 | + Auto-execute z WebSearch |

## NOWE SEKCJE DNA (v3.0)

| Sekcja | Nazwa | Co zawiera |
|--------|-------|------------|
| S9 | HISTORIA DEALOW | Won/lost log, wzorce, AI uczy sie z dealow |
| S10 | SIEC REFERRALOWA | Kto poleca, partnerzy, AI sugeruje prosby o polecenia |

---

## KILLER FEATURE: "BLIZNIAK SIE UCZY"

DNA dynamiczne → po kazdym dealu AI pyta "wygrana/przegrana?" → aktualizuje S9 → przy nastepnym dealu sugeruje pitch ktory zadzialal → battle cards ewoluuja z danymi

Zmienia pozycjonowanie: "konfiguracja jednorazowa" → "AI ktore rosnie z biznesem"
Argument na recurring revenue.

---

## PROJEKCJE REVENUE

| Scenariusz | Q1-Q2 | Dlug 0 |
|-----------|--------|--------|
| A: Konserwatywny (Solo only) | 13 720 PLN | Nie w Q2 |
| B: Z tiersami (Lite konwertuje) | 32 000 PLN | Maj 2026 |
| C: Z partnerami (F3) | 16-29k PLN/msc | Kwiecien 2026 |

---

## KOREKTY KRYTYCZNE

1. Pro tier → TYLKO definicja w F2, budowa w F3
2. Architekt AI → formularz MVP, nie konwersacja (oszczedz 10h)
3. Deadline F2 → 15.04 realistycznie
4. ZASADA 60/40: sprzedaz/produkt (NIGDY odwrotnie)
5. Vertical CNC → rob BEZ case study, dodaj liczby pozniej

---

## MAPA ZALEZNOSCI

```
NIEZALEZNE (rob kiedy chcesz):
├── Quick fixes spojnosc ← 30 min
├── LP email capture ← Worker + frontend
└── LP share button + watermark

ZALEZNE OD DEFINICJI:
├── Lite tier ← decyzja ktore 3 WF + 3 sekcje DNA
├── Pro tier ← S9 + S10 + MCP
├── Landing page 3 tiers ← Lite + Solo + Pro zdefiniowane
└── Architekt AI na stronie ← tiers zdefiniowane

ZABLOKOWANE PRZEZ NATANA:
├── Case study Stalton
├── Vertical CNC (z twardymi danymi)
└── Social proof na stronie

ZALEZNE OD FAZY 2:
├── Partner program ← tiers + case study + dokumentacja
├── Recurring model ← S9/S10 zbudowane
└── Event/speaking ← case study + demo
```

---

## BUDZET CZASU

| Zadanie | Godziny | Tydzien |
|---------|---------|---------|
| Quick fixes spojnosc | 0.5h | T1 |
| LP email capture | 3h | T2 |
| LP share + watermark | 2h | T2 |
| Definicja tiers | 2h | T3 |
| Wydzielenie Lite | 3h | T3 |
| Zaprojektowanie Pro | 4h | T3-T4 |
| Landing page 3 tiers | 4h | T4 |
| Architekt AI MVP (formularz) | 12-16h | T4-T5 |
| Vertical CNC | 4h | Po Natanie |
| **TOTAL** | **~36-40h** | **~6-8 tyg** |

Realnie: 5-6h/tyg na produkt → deadline F2: polowa kwietnia

---

## MATRYCA RYZYK

| Ryzyko | Prawd. | Impact | Mitygacja |
|--------|--------|--------|-----------|
| Architekt MVP rozrasta sie | WYSOKIE | Blokuje F2 | Timeboxuj: 12h max, formularz nie konwersacja |
| Natan nie konczy Architekta | SREDNIE | Blokuje case study | Napisz: "Jak Ci idzie? Pomoc?" |
| 0 sprzedazy w lutym | SREDNIE | Cashflow | SPRZEDAZ > PRODUKT |
| Lite kanibalizuje Solo | NISKIE | Mniej revenue | Lite = tylko 3 WF, wyrazna sciana |
| Scope creep Pro tier | WYSOKIE | F2 opozniony | Pro = definicja teraz, budowa F3 |

---

## DEEP RESEARCH — META-PROMPT (gotowy do wklejenia w Gemini)

KONTEKST:
Jestem tworca produktu "Blizniak Biznesowy" — done-for-you system AI
dla handlowcow B2B w Polsce. Format: 3 pliki markdown (DNA biznesu
+ 15 workflow'ow sprzedazowych + config) instalowane w Claude/ChatGPT.
Cena: 2 500 PLN jednorazowo. 1 klient, pipeline 12 500 PLN.

Moj produkt wyroznnia:
- Analiza stylometryczna (AI pisze w stylu klienta)
- "Bad Cop" — obrona marzy (AI NIGDY nie proponuje rabatu)
- 15 gotowych workflow'ow (email, follow-up, windykacja, research, outreach...)
- Onboarding 45 min → system dziala od dnia 1
- Live Preview demo na stronie (AI generuje probki na zywo)

PYTANIA DO ZBADANIA:

1. KONKURENCJA I RYNEK:
   - Jakie produkty AI dla handlowcow B2B istnieja na rynku polskim
     i globalnym w 2025-2026?
   - Kto oferuje "personalized AI sales assistant" jako produkt?
   - Czy ktos oferuje "stylometric analysis" lub "business DNA" jako feature?

2. MODEL BIZNESOWY:
   - Jakie modele cenowe stosuja firmy oferujace AI tools dla sprzedazy?
   - Case studies firm ktore przeszly z "productized service" do "self-service platform"
   - Najskuteczniejsze strategie cenowe w segmencie SMB/solopreneur (2 000-5 000 PLN)

3. SKALOWANIE:
   - Jak skalowac produkt oparty na prompt engineering bez budowy SaaS?
   - Przyklady "AI consultant to AI platform" transitions

4. PRODUCT-LED GROWTH:
   - Jakie taktyki PLG dzialaja dla AI tools w B2B?
   - Czy "live preview / interactive demo" jest stosowane przez konkurencje?

5. RYNEK POLSKI:
   - Wielkosc rynku handlowcow B2B solo w Polsce (JDG, KAM, freelance sales)
   - Jakie AI tools dla sprzedazy sa popularne w Polsce 2025-2026?
   - Czy istnieje "AI for sales" community/meetup/event w Polsce?

FORMAT: Fakty z zrodlami + wnioski dla mojego produktu. Top 5 rekomendacji na koncu.

---

*Zrodlo: Sesja COO 16.02.2026 | Deep Research + analiza 41 plikow produktu | Opus 4.6*
