# SYSTEM 10H — ARCHITEKTURA MARKI-PARASOLA

> Data: 15.03.2026 | Autor: @ceo + @cmo + @cso + @coo
> Status: COMPLETE — z Deep Research Gemini + analiza architektury kodu

---

## 1. EXECUTIVE SUMMARY

System 10H przestaje być "produktem dla handlowców B2B". Staje się **platformą do budowania AI-asystentów** dla dowolnej niszy biznesowej.

**Dlaczego teraz?**
- Natan (CNC) używa Bliźniaka do dokumentacji technicznej — NIE do sprzedaży
- Michał (copywriter) chce Bliźniaka Raportowego — generowanie PDF raportów
- Modul Soft (ERP) chce white-label — wdrażać u swoich 200+ klientów
- Krystian (szkolenia) chce agentów AI dla urzędów

**Jeden silnik. Wiele produktów. Szybkie MVP.**

---

## 2. ANALIZA ARCHITEKTURY — CO JEST REUSABLE

### CORE (80% — identyczne dla każdej niszy)

| Komponent | Plik | Funkcja | Zmiana per niszę |
|-----------|------|---------|------------------|
| **CLAUDE.md** | system file | Boot sequence, backup, limity, wiarygodność | ZERO |
| **stan.md** | pamięć operacyjna | Fokus, pipeline, blokery, lekcje, radar | ZERO |
| **Stylometria** | S5 w dna.md | Analiza stylu komunikacji z prawdziwych maili | ZERO (mechanizm ten sam) |
| **Aktywna Pamięć** | trigger words w SKILL | Wykrywanie decyzji i lekcji | ZERO |
| **Protokół Wiarygodności** | CLAUDE.md | Antyhalucynacja, cytowanie źródeł | ZERO |

### CUSTOMIZABLE (15% — adaptacja, nie rebuild)

| Komponent | Co zmienić | Czas |
|-----------|------------|------|
| **dna-interviewer (Architekt)** | Pytania per niszę: S2 (klient), S3 (oferta), S6 (obiekcje), S7 (procedury) | 2-3h |
| **SKILL.md (workflows)** | Zamień 4-6 workflow'ów branżowych (patrz tabela poniżej) | 3-4h |
| **BIBLIOTEKA_SCENARIUSZY** | Przykłady per niszę | 1-2h |
| **INSTRUKCJA_KLIENTA** | Branding + branżowe screenshoty | 1h |

### NICHE-SPECIFIC (5% — budować od zera)

| Komponent | Opis |
|-----------|------|
| **dna.md klienta** | Tworzony z wywiadu — zawsze unikatowy |
| **Szkolenie Loom** | Nagrać 1 raz per nisza, potem reuse |

### ANALIZA WORKFLOW'ÓW — UNIWERSALNOŚĆ

| WF | Nazwa | Uniwersalny? | Komentarz |
|----|-------|-------------|-----------|
| 1 | Email Reply | ✅ TAK | Każdy odpowiada na maile |
| 2 | Offer Creation | ✅ TAK | Oferty/wyceny → uniwersalne |
| 3 | Price Defense | 🟡 ADAPT | Negocjacje → nie tylko sprzedaż (freelancerzy, agencje) |
| 4 | Follow-up | ✅ TAK | Każdy follow-upuje |
| 5 | Windykacja | 🟡 ADAPT | B2B tak, ale nie urzędy |
| 6 | Outreach | 🟡 ADAPT | Cold outreach → cold pitching, prospecting |
| 7 | Research | ✅ TAK | Research firmy/osoby → uniwersalny |
| 8 | Meeting Prep | ✅ TAK | Każdy się przygotowuje na spotkanie |
| 9 | Content | ✅ TAK | Posty, case studies → każda branża |
| 10 | Pipeline Briefing | ✅ TAK | "Co robić dziś?" → uniwersalne |
| 11 | Proposal | ✅ TAK | Propozycje/oferty formalne → każdy |
| 12 | Reklamacja | ✅ TAK | Obsługa klienta → uniwersalna |
| 13 | Deep Research | ✅ TAK | Metaprompt → każda branża |
| 14 | Higiena | ✅ TAK | System maintenance |
| 15 | Rozwój | ✅ TAK | Audyt biznesu, segmenty |
| 16 | Radar Szans | ✅ TAK | Skan szans → uniwersalny |

**Wynik: 12/16 workflow'ów jest w pełni uniwersalnych. 4 wymagają lekkiej adaptacji.**

---

## 3. KOSZT MVP PER NISZA

| Etap | Co | Czas | Koszt |
|------|----|------|-------|
| Fork SKILL.md | Zamień 4-6 workflow'ów branżowych | 3-4h | 0 PLN |
| Fork Architekt | Adapt pytania wywiadu per branżę | 2-3h | 0 PLN |
| Fork Biblioteka | Przykłady scenariuszy per branżę | 1-2h | 0 PLN |
| Landing page | 1 strona z ofertą (subpage system10h.com/[nisza]) | 1-2h | 0 PLN |
| 1 beta klient | Wywiad + konfiguracja + szkolenie | 3h | 0 PLN |
| **TOTAL MVP** | | **10-14h** | **0 PLN** |

**ROI:** Jeden klient @ 2 999 PLN = ~215-300 PLN/h. Nawet jeśli 50% nisz nie trafi → wciąż profitable.

---

## 4. STRUKTURA MARKI-PARASOLA

```
SYSTEM 10H (marka-parasol)
│
├── system10h.com (główna strona — "AI dla biznesu, nie kurs")
│
├── BLIŹNIAK BIZNESOWY          ← handlowcy B2B (LIVE, v7.0)
│   └── system10h.com/blizniakbiznesowy
│
├── BLIŹNIAK PRODUKCJA          ← produkcja/CNC (validated: Natan)
│   └── system10h.com/produkcja
│
├── BLIŹNIAK RAPORTOWY          ← agencje/copywriterzy (validated: Michał)
│   └── system10h.com/raporty
│
├── BLIŹNIAK ERP/IT             ← firmy IT, white-label (validated: Modul Soft)
│   └── system10h.com/it
│
├── BLIŹNIAK [NISZA X]          ← nowa nisza (po walidacji DR)
│   └── system10h.com/[nisza]
│
└── NARZĘDZIA WSPÓLNE
    ├── Self-Discovery (kwalifikacja)
    ├── Architekt (wywiad DNA)
    ├── Stylometria
    ├── Style Match Test (lead magnet)
    └── Kalkulator ROI
```

### NAMING CONVENTION

**Opcja A (rekomendowana): "Bliźniak [Branża]"**
- Bliźniak Biznesowy (handlowcy)
- Bliźniak Produkcja (CNC, fabryki)
- Bliźniak Raportowy (agencje)
- Bliźniak IT (software house'y, ERP)

**Opcja B: "System 10H dla [Branży]"**
- System 10H dla handlowców
- System 10H dla produkcji
- etc.

**Opcja A > B** bo: "Bliźniak" jest bardziej konkretny i zapamiętywalny. "System" brzmi generycznie.

---

## 5. MODEL CENOWY PER NISZA

| Tier | Cena | Co dostaje | Dla kogo |
|------|------|-----------|----------|
| **BASE** | 2 999 PLN | dna.md + SKILL.md (16 WF) + stylometria + szkolenie + 30 dni wsparcia | Solo przedsiębiorcy |
| **PRO** | 4 999 PLN | BASE + 3 skrypty Telegram (briefy, alerty, pulse) + pamięć aktywna | Firmy 3-10 osób |
| **WHITE-LABEL** | 8 000-15 000 PLN | Know-how transfer + co-delivery + prawo do wdrażania u swoich klientów | Partnerzy/Resellers |

---

## 6. FRAMEWORK TESTOWANIA NISZ (MVP → PMF)

### Krok 1: HIPOTEZA (1 dzień)
- Kto jest klientem? (persona)
- Jaki ból rozwiązuję? (1 zdanie)
- Jak wygląda "dzień z Bliźniakiem" w tej niszy?
- Ile firm w Polsce jest w tej niszy? (TAM)

### Krok 2: MVP (2-3 dni)
- Fork SKILL.md → zamień branżowe WF
- Fork Architekt → adapt pytania
- Landing page (1 subpage)
- 1 post LinkedIn z hookiem branżowym

### Krok 3: WALIDACJA (1-2 tygodnie)
- 5-10 cold outreach do firm w niszy
- 1-2 discovery calls (darmowe 15 min)
- Cel: 1 płacący beta klient

### Krok 4: ITERACJA lub KILL (po 30 dniach)
- ≥1 klient → iteruj (feedback → improve SKILL.md)
- 0 klientów po 30 outreach → kill nisza lub pivot

### ZASADA: Max 2 nisze testowane jednocześnie. Nie więcej.

---

## 7. NISZA SCORING — DOWODY Z PIPELINE'U

| # | Nisza | Dowód | Pain (1-10) | WTP | TAM (PL) | MVP cost | SCORE |
|---|-------|-------|-------------|-----|----------|----------|-------|
| 1 | **Handlowcy B2B** | Bliźniak v7.0 LIVE, Natan, pipeline 10k | 9 | 2 999 PLN | ~50k firm | DONE | ⭐⭐⭐⭐⭐ |
| 2 | **Produkcja/CNC** | Natan używa do dokumentacji, "korytarz możliwości" | 7 | 2 999 PLN | ~15k firm | 10h | ⭐⭐⭐⭐ |
| 3 | **Agencje/Raporty** | Michał Gawlik, 1 000 PLN propozycja | 6 | 1 000-3 000 PLN | ~8k agencji | 10h | ⭐⭐⭐ |
| 4 | **IT/ERP white-label** | Modul Soft, 18-21k PLN deal | 8 | 8 000-15 000 PLN | ~2k firm IT | 15h | ⭐⭐⭐⭐ |
| 5 | **Urzędy/B2G** | Krystian, KPO budżety | 7 | 5 000-50 000 PLN | ~16k urzędów | 20h+ | ⭐⭐ (zamrożone) |

### NOWE NISZE Z DEEP RESEARCH GEMINI (dane rynkowe PL 2026)

| # | Nisza | TAM (PL) | TAM (PLN) | Pain | WTP | Killer Feature | Status |
|---|-------|----------|-----------|------|-----|---------------|--------|
| 6 | **E-commerce** | ~75 000 sklepów | ~225M PLN | 9 | 3-5k PLN | Opisy produktów + obsługa zwrotów w stylu marki | DO TESTOWANIA |
| 7 | **Biura rachunkowe** | 17 181 firm | ~51.5M PLN | 9 | 4k+ PLN | Maile do klientów o podatkach + KSeF compliance | DO TESTOWANIA |
| 8 | **Kancelarie prawne** | ~15 000 firm | ~45M PLN | 8 | 5k+ PLN | Korespondencja prawna w stylu mecenasa (stylometria = killer) | DO TESTOWANIA |
| 9 | **Prywatne kliniki** | ~30 000 | ~90M PLN | 7 | 4k PLN | Komunikacja z pacjentami, onboarding, FAQ | BACKLOG |
| 10 | **Nieruchomości** | ~20 000 | ~60M PLN | 6 | 3k PLN | Opisy nieruchomości, follow-upy, raporty rynkowe | BACKLOG |
| 11 | **HR/Rekrutacja** | ~8 000 | ~24M PLN | 8 | 3.5k PLN | Scoring kandydatów, opisy stanowisk, feedback do HM | BACKLOG |

### POLSKI PARADOKS AI (kluczowe dane z DR)

- **Oficjalna adopcja AI w PL:** 5.9-8.36% firm (dno EU, przed Rumunią)
- **Shadow AI:** 42% pracowników używa AI prywatnie, 78% z prywatnych kont (bez wiedzy firmy!)
- **ROI adopcji:** 87% firm które wdrożyły AI raportuje avg +35% wzrost przychodów
- **Wniosek:** OGROMNA luka między potencjałem a adopcją. "Done-for-you" omija barierę "nie umiem AI".
- **Cena 2 999 PLN:** Strategicznie idealna — premium (sygnał jakości) ale poniżej enterprise IT consulting. Polacy cenią transparentne, stałe ceny.

### TOP 3 NOWE NISZE DO TESTOWANIA (rekomendacja DR + CEO)

1. **E-commerce** — 75k sklepów, ból: Temu/Shein presja, opisy produktów, obsługa klienta. TAM 225M PLN.
2. **Biura rachunkowe** — 17k firm, ból: KSeF regulacje, powtarzalne maile podatkowe, wypalenie. TAM 51.5M PLN.
3. **Kancelarie prawne** — 15k firm, ból: drogie godziny na rutynowe pisma. Stylometria = KILLER (mecenas pisze "swoim głosem"). WTP 5k+ PLN.

### STRATEGIA MARKI (z DR — model Notion)

DR rekomenduje **model Notion** (use-case umbrella): ten sam silnik, ale marketing "brutalnie segmentowany" per niszę. Strona główna = routing "Kim jesteś?" → landing page per branżę.

Case studies z DR: DesignJoy ($1M/rok, 1 osoba, productized design), VideoHusky ($1.2M/rok, productized video), 37signals (Basecamp/HEY — umbrella).

**TOP 2 do testowania TERAZ (obok Bliźniaka Biznesowego):**
1. **Bliźniak Produkcja** — Natan to żywy case study, fork SKILL.md + 4 WF branżowe (dokumentacja techniczna, karty produktowe, ofertowanie CNC, raportowanie jakości)
2. **Bliźniak IT (white-label)** — Modul Soft daje 18-21k PLN + skalę. Ale czekamy na spotkanie ~18.03.

---

## 8. STRONA system10h.com — NOWA ARCHITEKTURA

### Obecna strona: 1 produkt (Bliźniak Biznesowy)
### Docelowa strona: Hub z wieloma produktami

```
system10h.com/
├── / (hero: "AI dla biznesu — nie kurs, gotowy system")
│   ├── Sekcja: "Dla kogo?" (3-4 nisze z ikonami)
│   ├── Sekcja: "Jak to działa?" (Architekt → DNA → Bliźniak)
│   ├── Sekcja: "Case studies" (Stalton CNC, [agencja], [IT])
│   └── CTA: Style Match Test / Self-Discovery
│
├── /sprzedaz (Bliźniak Biznesowy — obecna oferta)
├── /produkcja (Bliźniak Produkcja — NEW)
├── /raporty (Bliźniak Raportowy — NEW)
├── /it (Bliźniak IT / White-label — NEW)
│
├── /style-match (lead magnet — universal)
├── /preview (Live Preview — universal)
└── /discovery (Self-Discovery — universal)
```

### TYPEWRITER DEMO (pomysł z akademia.pl — ZAADAPTOWANY)

Zamiast terminala z kodem → **typewriter demo maila**:
- Animacja: AI pisze maila sprzedażowego w stylu klienta
- 3 rotacje: mail handlowca → mail producenta → mail agencji
- Pod animacją: "To nie szablon. To Twój styl. Sprawdź: [Style Match Test]"

**Implementacja:** CSS @keyframes blink + vanilla JS (45ms/znak) + IntersectionObserver. Koszty: 2h dev.

---

## 9. ROADMAP

| Kiedy | Co | Kto | Priorytet |
|-------|----|-----|-----------|
| **W3 (16-20.03)** | Landing page /produkcja (draft) | @ceo + @cto | MEDIUM |
| **W3 (18.03)** | Spotkanie Modul Soft → walidacja white-label | Mateusz | HIGH |
| **W4 (23-27.03)** | Fork SKILL.md → Bliźniak Produkcja (MVP) | @ceo | MEDIUM |
| **W4** | 5 cold outreach do firm CNC/produkcja | @cso + @ghost | MEDIUM |
| **IV.2026** | Bliźniak Produkcja beta (1 klient) | Mateusz | TARGET |
| **IV.2026** | system10h.com redesign → hub | @cto + @cmo | MEDIUM |
| **IV.2026** | Typewriter demo na stronie | @cto | LOW |
| **V.2026** | Wyniki Modul Soft → decyzja white-label | @ceo | HIGH |
| **V-VI.2026** | Test 3. niszy (na bazie DR) | @ceo | BACKLOG |

---

## 10. RYZYKA I MITYGACJA

| Ryzyko | Prawdopodobieństwo | Impact | Mitygacja |
|--------|-------------------|--------|-----------|
| Rozproszenie (Shiny Object) | WYSOKIE (ENTP!) | Spadek revenue Bliźniaka + Artnapi | Max 2 nisze jednocześnie. 70% czasu = obecne biznesy. |
| Kanibalizacja (Bliźniak Produkcja vs Biznesowy) | NISKIE | Inny klient docelowy | Oddzielne landing pages, oddzielny outreach |
| Over-engineering strony | ŚREDNIE | Czas na redesign zamiast sprzedaż | MVP: 1 subpage per nisza, nie pełny redesign |
| Modul Soft nie wyjdzie | ŚREDNIE | Utrata 18-21k PLN | White-label jako osobny produkt, nie zależny od 1 partnera |

---

## 11. DECYZJA CEO — DO POTWIERDZENIA

1. **GO na architekturę marki-parasola** — System 10H = brand, Bliźniak [Nisza] = produkty
2. **Pierwsza nowa nisza: Bliźniak Produkcja** — Natan = case study, fork MVP w W4
3. **Max 2 nisze testowane jednocześnie** — ochrona przed rozproszeniem
4. **70/30 rule:** 70% czasu = Artnapi + Bliźniak Biznesowy (revenue). 30% = nowe nisze (growth)
5. **Kill switch:** Nisza bez klienta po 30 dniach outreach → kill
6. **Strona:** Subpage per nisza (nie pełny redesign) → MVP approach

---

## 12. DEEP RESEARCH — PEŁNY RAPORT

Pełny raport DR (31 źródeł, TAM, case studies, regulatory factors):
`~/.config/gemini-mcp/output/dbb7ba98c7fca72a/deep-research-2026-03-15T21-29-46-821Z.json`

Kluczowe wnioski zintegrowane w sekcji 7.

---

*Dokument kompletny. Źródła: SKILL.md v7.0, PRODUKT_BLIZNIAKBIZNESOWY.md, decyzje.md, projekty/stalton/, profil.md, Gemini Deep Research (31 źródeł), Agent architektoniczny (17 plików przeanalizowanych)*
