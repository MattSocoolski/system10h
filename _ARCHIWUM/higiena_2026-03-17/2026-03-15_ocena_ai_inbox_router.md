# OCENA KONCEPTU: AI INBOX ROUTER (AWS)
# Perspektywa: @CEO + @CTO
# Data: 15.03.2026

---

## KONCEPT (streszczenie)

System "Human-in-the-loop" oparty na AWS:
1. Input wpada do inbox (maile, zgłoszenia, automaty)
2. AI przetwarza i proponuje akcje
3. System przydziela akcje do odpowiednich agentów
4. Agenci implementują zmiany
5. User tylko zatwierdza — "8h roboty w 8 minut"

**Stack autora:** AWS Lambda + DynamoDB + EventBridge/cron + CLI skrypt + AI routing + dispatch. Nowe źródło = nowa Lambda + put_item do tej samej tabeli.

---

## 1. CZY TO JEST WARTOŚCIOWE DLA NASZEGO SYSTEMU?

### Odpowiedź: TAK — konceptualnie. NIE — w formie AWS.

Koncept jest trafny. Dokładnie ten sam problem rozwiązujemy: multiple inputs -> AI analysis -> routing to agents -> human approval. Ale my już to mamy — w innym stacku.

**Wartość koncepcyjna:**
- Centralizacja inputów (inbox, CRM, formularze) w jedno miejsce przetwarzania
- AI routing (kto powinien obsłużyć?) — to nasz inquiry-router.js i email-radar.js
- Agent dispatch (przypisanie do agenta) — to nasz system @coo/@cso/@ghost w CLAUDE.md
- Human-in-the-loop (user zatwierdza) — to nasze Gmail drafty (user sam wysyła)

**Różnica:**
- Autor: pełna infrastruktura chmurowa (Lambda, DynamoDB, EventBridge)
- My: lokalne Node.js skrypty + cron (LaunchAgent) + Notion CRM + Gmail API + Telegram

---

## 2. JAK TO SIĘ MA DO TEGO CO JUŻ MAMY

### Mapowanie 1:1 — nasz system vs koncept AWS

| Funkcja (koncept) | Nasz odpowiednik | Status |
|-------------------|------------------|--------|
| **Lambda przetwarza input** | `email-radar.js` (co 30 min, Gmail scan) | DEPLOYED |
| | `morning-scan.js` (8:00, Gmail+CRM cross-check) | DEPLOYED |
| | `inquiry-router.js` (co 15 min, kalkulator B2B) | DEPLOYED |
| **DynamoDB — centralna tabela** | `automatyzacje/state/*.json` (lokalne JSON state) + Notion CRM | DEPLOYED |
| **EventBridge/cron** | macOS LaunchAgent (plist cron) | DEPLOYED |
| **AI analizuje i proponuje routing** | Claude Haiku w `followup-guardian.js` i `inquiry-router.js` | DEPLOYED |
| **Dispatch do agenta** | `@ghost` (ghost_styl.md) jako gatekeeper + agenci w CLAUDE.md | DEPLOYED |
| **Digest codzienny** | `pipeline-brief.js` (Telegram 9:30) + `morning-scan.js` (morning-feed.md) | DEPLOYED |
| **Nowe źródło = nowy moduł** | Nowy skrypt JS + import z `lib.js` (shared library) | WZORZEC USTALONY |
| **Human approval** | Gmail drafty (user sprawdza i wysyła) + Telegram alerty | DEPLOYED |

### Nasz stack — kompletna lista automatyzacji (17 skryptów)

| Skrypt | Rola | Cron |
|--------|------|------|
| `email-radar.js` | Alert o nowych mailach (CRM cross-check) | co 30 min 8-18 pn-pt |
| `morning-scan.js` | Morning feed: Gmail + CRM + rekomendacje | 8:00 pn-pt |
| `pipeline-brief.js` | Telegram digest (overdue, today, hot) | 9:30 pn-pt |
| `followup-guardian.js` | Auto-draft follow-upów (Claude Haiku) | 17:00 pn-pt |
| `inquiry-router.js` | Auto-draft odpowiedzi na zapytania kalkulatora | co 15 min 8-18 pn-pt |
| `restock-reminder.js` | Auto-draft restocków (klienci AM/REPEAT) | pon 9:00 |
| `stock-monitor.js` | Monitoring zapasów + alert < 4 tyg | pon 9:00 |
| `weekly-report-reminder.js` | Telegram reminder o raporcie tygodniowym | czw 8:30 |
| `generate-weekly-report.js` | Generowanie raportu MD+TSV | on-demand |
| `speed-to-lead.js` | Monitoring czasu odpowiedzi na leady | — |
| `carousel-generator.js` | Generowanie karuzeli LinkedIn | on-demand |
| `style-match.js` | Style Match Test (lead magnet) | on-demand |
| `setup-cykl-dni.js` | Setup pól CRM (cykl_dni) | jednorazowy |
| `notion-archive.js` | Archiwizacja starych leadów w CRM | on-demand |
| `gmail-auth.js` | OAuth flow Gmail | setup |
| `create-gmail-draft.js` | Tworzenie draftów Gmail (helper) | wywoływany przez agentów |
| `lib.js` | Shared library (Gmail, Notion, Telegram, state) | importowany |

### Czego NAM brakuje vs koncept AWS

| Gap | Opis | Priorytet |
|-----|------|-----------|
| **Multi-source input** | Mamy: Gmail, Notion CRM. Nie mamy: formularze, Slack, WhatsApp, inne kanały | NISKI (wystarczą obecne) |
| **Unified action queue** | Brak centralnej kolejki "akcji do zatwierdzenia". Mamy rozproszony state (JSON per skrypt) | ŚREDNI (fajne, nie krytyczne) |
| **Routing intelligence** | Nasz routing jest hardcoded (inquiry-router obsługuje zapytania z kalkulatora, followup-guardian obsługuje overdue leady). AI routing na podstawie treści = brak | ŚREDNI (wartościowe dla skalowania) |
| **Dashboard** | Brak wizualnego dashboardu. Mamy: Telegram + morning-feed.md | NISKI (Telegram wystarczy) |

---

## 3. CZY WARTO BUDOWAĆ? JAKIM KOSZTEM?

### Porównanie: AWS vs nasz stack

| Aspekt | AWS (koncept autora) | Nasz stack (Node.js + cron) |
|--------|---------------------|---------------------------|
| **Koszt infrastruktury** | ~$5-20/msc (Lambda free tier + DynamoDB + EventBridge) | $0 (lokalne, macOS LaunchAgent) |
| **Koszt API** | Claude API (~$2-5/msc przy Haiku) | Claude API (~$2-5/msc — identycznie) |
| **Czas budowy od zera** | 40-60h (Lambda, DynamoDB schema, IAM, EventBridge, CLI) | 0h (JUŻ ZBUDOWANE — 17 skryptów) |
| **Czas migracji** | 20-30h (przepisanie 17 skryptów na Lambda + DynamoDB) | — |
| **Skalowalność** | Teoretycznie "nieskończona" (Lambda auto-scale) | Wystarczająca (1 user, max 50 leadów CRM) |
| **Reliability** | AWS SLA 99.9% | macOS LaunchAgent — działa dopóki Mac jest włączony |
| **Debugowanie** | CloudWatch logs (trudniejsze, rozproszony monitoring) | Console.log + lokalne pliki (proste, natychmiastowe) |
| **Nowe źródło** | Nowa Lambda + IAM role + EventBridge rule | Nowy plik .js + import lib.js + plist cron |
| **Vendor lock-in** | AWS (DynamoDB, Lambda runtime) | Zero (plain Node.js, portable) |
| **Backup** | DynamoDB backup (dodatkowy koszt) | Git (darmowe, automatyczne) |

### Verdict: NIE MIGROWAĆ NA AWS

**Powody:**
1. **Mamy to.** 17 skryptów pokrywa 90%+ konceptu. Działa od tygodni.
2. **Koszt migracji > wartość.** 20-30h pracy na przepisanie = ~2-3 tygodnie robocze. W tym czasie lepiej zamknąć 2 deale Bliźniaka (6 000 PLN).
3. **Skala nie wymaga AWS.** Nasz system obsługuje 1 usera i ~50 leadów. AWS skaluje do milionów requestów — nie potrzebujemy tego.
4. **Reliability concern jest realny, ale rozwiązalny inaczej.** Jeśli Mac jest wyłączony, cron nie odpali. Rozwiązanie: tani VPS ($5/msc) lub Raspberry Pi, NIE cała infrastruktura AWS.

---

## 4. CZY TO POMYSŁ NA PRODUKT (BLIŹNIAK PRO)?

### Odpowiedź: TAK — ale w uproszczonej formie

Koncept "AI Inbox Router" to dokładnie to, co planujemy jako **Bliźniak PRO** (dane/system10h/blizniakpro_architektura.md):

| Bliźniak PRO (nasz plan) | AI Inbox Router (koncept) | Wspólne? |
|--------------------------|--------------------------|----------|
| morning-brief (Telegram, rano) | Codzienny digest | TAK |
| followup-alert (Telegram, real-time) | Routing do agenta | TAK |
| weekly-pulse (Telegram, piątek) | Agregacja i sortowanie | TAK |
| stan.md (pamięć operacyjna) | DynamoDB (centralna tabela) | TAK (inny format) |

### Kluczowa różnica w podejściu do produktu:

**Koncept AWS:** "Zbuduj sobie system na AWS" = DIY, wymaga programisty, typowy podejście inżynierskie.

**Bliźniak PRO (nasz):** "Dostajesz gotowy system za 4 999 PLN" = DFY, zero wiedzy technicznej, działa od dnia 1 z Telegramem.

To jest nasza przewaga. Autor konceptu opisuje coś co sam zbudował w 20-40h. My to sprzedajemy jako gotowy produkt. To jak różnica między "zrób sobie meble z IKEA" a "przyjeżdżam i montuję Ci kuchnię".

### Pomysł na content:
Post LinkedIn: "Widziałem koncept AI Inbox Router na AWS. Fajne — ale wymaga 40h i programisty. Moi klienci dostają to samo w Bliźniaku PRO. Gotowe. Na Telegramie. Za cenę jednego dnia pracy konsultanta."

---

## 5. REKOMENDACJA

### ZAINSPIROWAĆ SIĘ — ALE ZROBIĆ PO SWOJEMU

| Decyzja | Status |
|---------|--------|
| Migracja na AWS | **NIE** — zbyt kosztowne, niepotrzebne przy naszej skali |
| Budowa nowego systemu | **NIE** — mamy 17 skryptów, działa |
| Inspiracja architekturą | **TAK** — 3 konkretne ulepszenia poniżej |
| Produkt z tego (PRO) | **TAK** — potwierdzenie że architektura Bliźniak PRO jest poprawna |

### 3 ULEPSZENIA ZAINSPIROWANE KONCEPTEM

#### U1: Unified Action Log (niski koszt, wysoka wartość)
**Co:** Centralny plik `automatyzacje/state/action-log.json` — każdy skrypt loguje swoje akcje (typ, lead, timestamp, wynik). Morning-scan czyta log i generuje podsumowanie.
**Koszt:** 2-3h pracy @cto.
**Wartość:** Jedno miejsce do sprawdzenia "co system zrobił wczoraj?" zamiast czytania 5 osobnych state plików.
**Priorytet:** TIER 2 (kwiecień)

#### U2: Smarter Routing (Claude classifies email intent)
**Co:** email-radar.js dostaje mini-classification: Claude Haiku analizuje snippet i przypisuje intent (inquiry / followup / complaint / info / spam). Różne intenty = różne Telegram alerty.
**Koszt:** 4-5h pracy @cto. ~$1-2/msc ekstra API.
**Wartość:** Automatyczny priorytet wiadomości. Complaint = natychmiast. Info = digest.
**Priorytet:** TIER 2 (kwiecień-maj)

#### U3: VPS Failover (reliability)
**Co:** Przenieść crony na tani VPS ($5/msc — np. Hetzner, DigitalOcean). Mac wyłączony = system działa dalej.
**Koszt:** 3-4h setup + $5/msc.
**Wartość:** System działa 24/7, nie zależy od uptime'u Maca.
**Priorytet:** TIER 3 (maj — dopiero gdy system jest stabilny i przetestowany)

### CZEGO NIE ROBIĆ

1. **Nie budować DynamoDB equivalent.** Notion CRM + lokalne JSON state = wystarczające. DynamoDB to over-engineering przy 50 leadach.
2. **Nie budować dashboardu.** Telegram + morning-feed.md = wystarczające. Dashboard to "shiny object".
3. **Nie budować multi-source input (Slack, WhatsApp).** Mamy Gmail + Notion. Dodatkowe źródła = dodatkowa złożoność bez dodatkowego przychodu.

---

## PODSUMOWANIE JEDNYM ZDANIEM

Koncept AI Inbox Router to walidacja naszej architektury — mamy 90% tego systemu w 17 skryptach Node.js za $0/msc. Nie migrować na AWS, nie budować nowego. Zainspirować się trzema ulepszeniami (action log, smart routing, VPS failover) i potwierdzić że Bliźniak PRO to ten sam koncept sprzedany jako DFY produkt za 4 999 PLN.

---

*Ocena: 15.03.2026 | @ceo + @cto*
*Kontekst: koncept z sieci networkingowej, stack AWS + Claude Code*
