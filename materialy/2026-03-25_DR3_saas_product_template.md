# System 10H — strategiczny blueprint od MVP do production SaaS

**System 10H ma realną szansę zająć białą plamę na rynku: żaden z 10 zbadanych konkurentów nie oferuje mobilnego AI ghost-writingu w stylu usera z CRM-aware kontekstem i approval flow z telefonu.** To nie jest kolejny tool do cold email — to AI Operating System dla handlowców, którzy są w terenie, między spotkaniami, na eventach. Superhuman jako jedyny próbuje "pisać głosem usera", ale nie ma CRM, nie ma pipeline'u sprzedażowego, nie ma mobile approval. Twoja aktualna baza Notion CRM (Lead, BANT Score, SD Status, Wartość PLN) stanowi solidny fundament, ale wymaga architektonicznej ewolucji, aby obsłużyć multi-tenant SaaS.

---

## Architektura multi-tenant: jedna apka, runtime branding

Standard w B2B SaaS mobile to **jedna aplikacja w App Store z per-tenant konfiguracją runtime**. Salesforce, HubSpot, Slack — wszyscy tak robią. Osobne buildy per tenant to pattern white-label, który ma sens dopiero przy premium klientach żądających własnego logo na home screenie.

**Na start (MVP → 50 tenants)** potrzebujesz: jednej apki Expo w App Store, `TenantThemeProvider` w React Context ładujący kolory/logo z API Cloudflare Workers, i KV z prefixem `tenant:{id}:config`. Tamagui lub styled-components dają pełne dynamiczne themowanie bez rebuildu — kolory, fonty, logo, feature flagi zmieniasz z serwera. Jedyne co **wymaga rebuildu** to ikona na home screenie, splash screen i bundle ID.

**Tenant isolation w Cloudflare** jest elegancko rozwiązany. Cloudflare D1 jest **wprost zaprojektowany** do wzorca database-per-tenant — obsługuje do 50 000 baz danych na konto bez dodatkowych kosztów. Na MVP wystarczy shared D1 z kolumną `tenant_id`, ale docelowo migracja do per-tenant D1 daje pełną izolację. Tokeny OAuth Gmaila powinny być szyfrowane AES-256-GCM w KV z kluczem per-user (`tenant:{id}:user:{uid}:gmail_tokens`), a master key trzymany w Workers Secrets.

Konkretny stack MVP:

| Warstwa | Narzędzie | Koszt |
|---------|-----------|-------|
| UI theming | Tamagui + TenantThemeProvider | $0 |
| Feature flags | PostHog (1M events free) lub custom CF endpoint | $0 |
| Tenant config | Cloudflare KV (prefix-based) | $0 |
| Baza danych | Cloudflare D1 (shared → per-tenant) | $0-5/mo |
| Token storage | KV + AES-256-GCM + Workers Secrets | $0 |
| Auth | Clerk lub custom JWT | $0-25/mo |

Gdy konkretny klient premium zażąda white-label (własna apka w Store), wzorzec EF World Journeys — Turborepo monorepo z `apps/tenant-a/` zawierającym ~45 linii kodu wiążących shared components z tenant-specific config — pozwala generować osobne buildy: `TENANT=acme eas build --platform all`.

---

## Krajobraz konkurencyjny: realna biała plama w rynku

Zbadałem 10 konkurentów pod kątem cenników, mobile capabilities, AI features i CRM integration. Kluczowe wnioski:

| Competitor | Cena (entry) | Mobile app | AI ghost-writing | CRM-aware drafting | Mobile approval |
|------------|-------------|------------|-----------------|--------------------|-----------------| 
| **Lavender** | $27/mo | ❌ Chrome only | Coaching, nie pisanie | ❌ | ❌ |
| **Apollo.io** | $49/mo | ✅ iOS+Android | Generyczny AI writer | Powierzchowna | ❌ |
| **Superhuman** | $30/mo | ✅ Pełna | ✅ "Twój głos" | Podstawowa (HubSpot) | ❌ |
| **Instantly.ai** | $37/mo | ⚠️ Ograniczona | AI Copilot | ❌ Zapier only | ❌ |
| **Smartlead** | $39/mo | ❌ | ChatGPT basic | ❌ | ❌ |
| **Close CRM** | $35/mo | ✅ Calls/CRM | AI summaries (Growth+) | ✅ Natywna | ❌ |
| **Reply.io** | $89/mo | ❌ | Jason AI SDR | Salesforce/HubSpot | ❌ |
| **Outreach** | ~$130/mo | ✅ Ograniczona | Kaia AI coaching | Salesforce only | ❌ |
| **SalesLoft** | ~$125/mo | ✅ Najlepsza enterprise | AI Rhythm, email assist | SF/HubSpot/Dynamics | ❌ |
| **Regie.ai** | $180/mo | ❌ | Autonomiczne AI agenty | Outreach/HubSpot | ❌ |

**Trzy krytyczne luki w rynku, które System 10H wypełnia:**

**Luka #1: Żaden tool nie jest mobile-first.** Nawet SalesLoft (najlepsza mobile app wśród enterprise SEP) to companion do desktopu — nie samodzielny OS. Instantly, Smartlead, Reply.io, Lavender, Regie.ai nie mają mobile app w ogóle.

**Luka #2: Ghost-writing w stylu usera + approval flow nie istnieje.** Superhuman's Auto Drafts zbliżają się do pisania "Twoim głosem", ale brak mobile approval workflow. Przepływ "AI pisze → notyfikacja → swipe approve → wysyłka" jest **w 0 z 10 konkurentów**.

**Luka #3: CRM-kontekstowe pisanie jest płytkie.** Narzędzia mają albo dobry AI writing, albo dobre CRM — nigdy głęboko połączone. Dream workflow "AI pisze follow-up na podstawie ostatniego spotkania + deal stage + styl komunikacji prospekta" nie jest zrealizowany przez nikogo.

**Pozycjonowanie System 10H:** Nie jesteś narzędziem do mass cold email (Instantly/Smartlead). Nie jesteś email clientem (Superhuman). Jesteś **AI Operating System dla handlowców w terenie** — jedynym produktem łączącym: (1) ghost-writing w stylu usera, (2) głęboki CRM kontekst (BANT, deal stage, notatki ze spotkań), (3) mobile-first approval flow, (4) cenę dostępną dla SMB.

**Rekomendowana cena: $49/mo** — powyżej commodity tools ($37-39), na poziomie Apollo Basic ($49), poniżej enterprise ($125+). Sweet spot "można wydać bez zgody managera".

---

## Dystrybucja Expo: unlisted app + OTA to klucz

**EAS Update** pozwala deployować zmiany JS over-the-air bez przechodzenia App Store review. Nowy bug fix? `eas update --channel production` i użytkownicy dostają aktualizację przy następnym uruchomieniu. SDK 55 (luty 2026) dodaje **Hermes bytecode diffing** — mniejsze OTA, szybszy download.

Kluczowe best practices:
- **Staged rollouts**: `eas update --rollout-percentage 10` → 50% → 100%
- **Runtime versions**: `"runtimeVersion": { "policy": "appVersion" }` zapobiega crashom z niezgodności native/JS
- **SDK 54+ feature**: `setUpdateRequestHeadersOverride()` — wewnętrzni testerzy na `staging`, klienci na `production` **bez rebuildu**
- **Automatic rollback**: EAS Update wykrywa crashe i automatycznie cofa do poprzedniej wersji

**Strategia dystrybucji po fazie:**

| Faza | Metoda | Limit | Koszt |
|------|--------|-------|-------|
| **MVP (1-10 klientów)** | TestFlight + EAS Internal (ad-hoc) | 100 urządzeń iOS | $99/yr Apple |
| **Growth (10-50 klientów)** | **Unlisted App** w App Store | Bez limitu | $99/yr + $19/mo EAS |
| **Scale (50+ klientów)** | Public App Store + Custom Apps (ABM) | Bez limitu | $99/yr + $99/mo EAS |

**Unlisted App** to game-changer dla B2B SaaS: pełna infrastruktura App Store (auto-update, brak wygasania buildów), ale niedostępna publicznie — tylko przez bezpośredni link. Klienci instalują jak normalną appkę. Przejście na public listing możliwe w dowolnym momencie.

**TestFlight NIE nadaje się do produkcji** — 90-dniowe wygasanie buildów to hard blocker. Enterprise Distribution Program ($299/yr) jest **wyłącznie** dla wewnętrznych pracowników (100+ osób) — Apple aktywnie monitoruje nadużycia.

**App Store review timeline**: nowe apki 24-48h, aktualizacje 12-24h. Pro tip: przejście TestFlight Beta Review często przyspiesza finalny App Store review. Zawsze dostarczaj demo credentials w Review Notes.

---

## Notion jako baza danych: migracja jest nieunikniona

Twoja aktualna baza "CRM System 10h+" (Lead, BANT Score, SD Status, Priorytet, Wartość PLN, Źródło) działa na Notion API z limitem **3 req/s per integration**. Realne implikacje:

**Do ~100 tenants: Notion wystarcza.** Przy 50 tenants × 100 leadów = 5 000 rekordów, typowe operacje CRM generują ~7 250 requestów/dzień — wygodnie w limicie. Pełny sync 5 000 rekordów to ~17 sekund (50 paginowanych zapytań).

**Przy 200+ tenants: bottleneck.** Podczas business hours (10h), 200 tenants generuje 0.81 req/s w average — z peakami łatwo przekraczającymi 3 req/s. Przy 500 tenants (2.01 req/s average) rate limit staje się regularnym problemem.

**Fundamentalne ograniczenia Notion jako bazy produkcyjnej:**
- Brak SQL — nie zrobisz JOINa, agregacji, CTE
- Brak transakcji — zero gwarancji ACID
- **10 000 rekordów soft limit** per database zanim performance degraduje
- Relations zwracają max 25 referencji per response
- Brak realtime push (webhooks od API v2025-09-03 ale ograniczone)
- Latencja 78-990ms vs <1ms na D1

**Porównanie alternatyw:**

| Baza | Koszt/mo (50 tenants) | Latencja reads | Multi-tenancy | DX |
|------|----------------------|----------------|---------------|-----|
| **Cloudflare D1** ⭐ | **$5** | <1ms (indexed) | DB-per-tenant natywnie | Dobry (Workers) |
| **Turso** | $4.99 | <10ms (edge) | DB-per-tenant natywnie | Świetny |
| **Neon** | $5-15 | 80-350ms | Shared + RLS | Świetny |
| **Supabase** | $25 | <10ms (warm) | Shared + RLS | Najlepszy (full BaaS) |
| **PlanetScale** | $39+ | <10ms | Shared | Dobry |
| **Notion API** | $0 (API) | 78-990ms | Workspace separation | Słaby (na DB) |

**Rekomendacja: Cloudflare D1** — $5/mo, zero-latency z Workers (in-process, bez network hop), per-tenant databases natywnie, full SQL, Time Travel backups. Natywna integracja z Twoim istniejącym Cloudflare Workers stackiem eliminuje dodatkową złożoność.

**Trzyfazowa migracja bez przerywania pracy klientów:**

**Faza 1 — Shadow Database (tydzień 1-4):** D1 jako shadow, Notion jako source of truth. Cron Worker co 5 minut polluje Notion API (`filter: last_edited_time > lastSync`), upsertuje zmiany do D1. Apka czyta z D1 (sub-ms), pisze do Notion. Klient widzi swoje Notion bez zmian. **Koszt: $5/mo.**

**Faza 2 — Dual-Write (tydzień 4-8):** D1 staje się primary. Zapisy idą najpierw do D1, potem async do Notion via outbox pattern. Walidacja spójności co godzinę. Klient nadal widzi Notion dashboard.

**Faza 3 — D1 Primary (tydzień 8+):** D1 = source of truth. Notion = opcjonalny dashboard (one-way sync D1 → Notion). Albo budujemy własny dashboard zastępujący Notion UI.

---

## Bezpieczeństwo i compliance: Gmail restricted scopes wymagają CASA

**Gmail OAuth scopes dla System 10H:** potrzebujesz `gmail.compose` (tworzenie/wysyłanie drafts) + `gmail.readonly` (czytanie wątków/drafts). Obie są **RESTRICTED** w klasyfikacji Google — to uruchamia pełny proces weryfikacji + obowiązkowy audyt CASA.

**Timeline weryfikacji Google OAuth:**

| Etap | Czas | Wymagania |
|------|------|-----------|
| Brand verification | 2-3 dni | Domena, branding |
| Sensitive scope review | 3-5 dni | Demo video, privacy policy |
| Restricted scope review | **4-12 tygodni** | CASA security assessment |
| **Łącznie** | **6-16 tygodni** | Zaplanuj PRZED launchem |

**CASA Tier 2** (najprawdopodobniejszy dla nowego SaaS z restricted scopes): **$500-1 500/rok** via autoryzowane lab (TAC Security, Bishop Fox). Bez CASA nie przejdziesz weryfikacji i zostaniesz na limicie **100 userów lifetime** — hard blocker dla SaaS.

**Najczęstsze powody odrzucenia:** zbyt szerokie scopes (nigdy nie żądaj `mail.google.com`), demo video niepokazujące wszystkich scopeów w akcji, zepsuty link do privacy policy, dodanie scopeów po weryfikacji (resetuje status).

**GDPR — minimum viable compliance:**
- **DPA (Data Processing Agreement)** z 9 obowiązkowymi elementami z Art. 28 GDPR — template z EU Commission
- **Privacy Policy** opisujący jakie dane email zbierasz, po co, jak długo przechowujesz
- **Right to erasure** — pipeline do usunięcia danych usera na żądanie (30 dni)
- **Sub-processor list**: Cloudflare, Anthropic (Claude), Google (Gmail API)
- **Standard Contractual Clauses (SCCs)** jeśli dane wychodzą z EU

**SOC 2 — kiedy i za ile:**
- **Nie potrzebujesz od razu.** SOC 2 to wymóg rynkowy, nie prawny. Trigger: pierwszy enterprise prospect pyta "Macie SOC 2?"
- **Rule of thumb**: start SOC 2 prep przy ~$500K-1M ARR
- **Type I**: 1-3 miesiące, $10K-25K za audyt
- **Platforma compliance**: Drata (~$7 500/yr, najtańsza) lub Vanta (~$10 000/yr, najpopularniejsza)
- **Year 1 TCO: $25K-50K** (platforma + audyt + pen test)
- **Pro tip**: CASA i SOC 2 mają overlapping controls — Prescient Security oferuje combined services

**Na start (Month 1-2) wystarczy: $2K-5K** — privacy policy, DPA template, OAuth token encryption, audit logging, breach response plan. CASA ($500-1500) w miesiącu 2-4. SOC 2 odkładasz do $500K ARR.

---

## Unit economics: $49/mo daje 74% gross margin przy 278 tenantach do break-even

**Koszt per tenant per miesiąc (główny driver: Claude API):**

AI email assistant przetwarzający ~50 maili dziennie zużywa: Haiku do klasyfikacji ($0.001/email) + Sonnet do draftów ($0.012/email) = **~$0.013/email**. Z prompt cachingiem spada do ~$0.010. Miesięcznie (1 500 emaili): **$12.50/tenant** z cachingiem, $15-19.50 bez.

| Komponent | Koszt/mo (50 tenants) | Per tenant |
|-----------|----------------------|------------|
| **Claude API** (Haiku+Sonnet, cached) | $625 | **$12.50** |
| Cloudflare Workers Paid | $5 | $0.10 |
| Expo EAS Starter | $19 | $0.38 |
| Apple Developer | $8.25 | $0.17 |
| Other (Sentry, domain) | $22 | $0.44 |
| **TOTAL** | **$679** | **$13.58** |

**Claude API stanowi 92% zmiennych kosztów.** Infrastruktura jest praktycznie darmowa dzięki Cloudflare free/paid tiers. To oznacza, że koszty skalują się liniowo z liczbą tenantów — mało jest do "zoptymalizowania" na infra.

**Break-even analysis:**

| Cena | Gross margin | Margin % | Break-even (infra) | Tenants na $10K/mo salary |
|------|-------------|----------|-------------------|--------------------------|
| $29/mo | $16.50 | 57% | 8 tenants | 614 — za dużo |
| **$49/mo** ⭐ | **$36.50** | **74%** | **4 tenants** | **278** |
| $79/mo | $66.50 | 84% | 2 tenants | 153 |
| $99/mo | $86.50 | 87% | 2 tenants | 117 |

**$29/mo nie ma sensu** — potrzebujesz 614 tenantów na pensję solo developera. **$49/mo to sweet spot**: 74% margin, 278 tenantów do self-sustainability, price point poniżej "wymaga approval managera" w większości firm.

**14-day free trial bez karty kredytowej** zamiast freemiuma. Powód: przy freemium każdy darmowy user kosztuje $12.50/mo w Claude API. Przy konwersji 3-5% (benchmark freemium), koszt akwizycji jednego płatnego klienta to **$250-417 w Claude costs** — zabójcze dla bootstrapped produktu. Free trial limituje ekspozycję do ~$6-7 per trialist (14 dni).

**MRR milestones i co zmienić na każdym etapie:**

| MRR | Tenants | Kluczowe zmiany |
|-----|---------|-----------------|
| **$1K** | ~21 | Brak zmian. Notion API OK. Expo Starter. |
| **$5K** | ~103 | Expo Production ($99/mo). Notion potrzebuje caching layer (D1 shadow). Paid Sentry. |
| **$10K** | ~205 | **Notion bottleneck** — D1 primary, Notion async sync. Batch API Claude (-50%). Part-time support hire. |
| **$50K** | ~1 020 | Pełna migracja off Notion. Negocjuj volume discount z Anthropic. SOC 2 start. Team 2-3 osoby. |

---

## Migration path: od obecnego MVP do production SaaS

**Miesiąc 1-2: Fundament techniczny**
- [ ] Expo SDK 54/55, `app.config.js` z tenant config, EAS Build profiles (dev/preview/prod)
- [ ] Cloudflare Workers + D1 (shadow database), KV dla tenant configs i tokenów
- [ ] OAuth flow Gmail z `gmail.compose` + `gmail.readonly`, tokeny encrypted w KV
- [ ] Privacy policy, DPA template, audit logging
- [ ] **Koszt: ~$110/mo** (CF $5 + EAS $19 + Apple $8 + inne ~$78)

**Miesiąc 2-4: Weryfikacja Google + pierwsi klienci**
- [ ] Brand verification → Sensitive scope → CASA Tier 2 assessment
- [ ] Unlisted App w App Store (przez direct link do klientów)
- [ ] 5-10 pilot klientów na free trial, zbieranie feedbacku
- [ ] AI ghost-writing MVP: system prompt z kontekstem z CRM (BANT, notatki, deal stage)
- [ ] **Koszt: $500-1 500 CASA + ~$200/mo infra**

**Miesiąc 4-8: Product-market fit**
- [ ] Iteracja na AI quality (fine-tune system prompts na real email data)
- [ ] Mobile approval flow: push notification → swipe → approve/edit → send
- [ ] D1 jako shadow database (Faza 1 migracji z Notion)
- [ ] Pricing launch: $49/mo, 14-day trial
- [ ] Target: 20-50 paying tenants → **$1K-2.5K MRR**

**Miesiąc 8-14: Growth**
- [ ] D1 primary (Faza 2-3 migracji), Notion opcjonalny dashboard
- [ ] Staged OTA rollouts, CI/CD z GitHub Actions
- [ ] Feature tiers: Starter ($29) / Pro ($49) / Team ($79)
- [ ] Content marketing: "mobile-first AI sales OS" positioning
- [ ] Target: 100+ tenants → **$5K+ MRR**

**Miesiąc 14-24: Scale**
- [ ] SOC 2 Type I prep ($25-50K) jeśli enterprise deals wymagają
- [ ] White-label builds dla premium klientów (Turborepo pattern)
- [ ] Public App Store listing
- [ ] Claude API volume discount negotiation
- [ ] Target: 250+ tenants → **$12K+ MRR**

## Kluczowe decyzje do podjęcia teraz

**Architektura**: Jedna apka, runtime theming, Cloudflare D1 per-tenant — nie overengineeruj. White-label dopiero gdy klient zapłaci za to premium.

**Baza danych**: Zacznij shadow D1 od dnia 1. Twoja Notion CRM z polami Lead/BANT/SD Status/Wartość PLN mapuje się 1:1 na D1 tabelę. Migracja jest non-breaking — klienci dalej widzą Notion.

**Weryfikacja Google**: Zacznij TERAZ — 6-16 tygodni to realny timeline. Bez CASA jesteś zablokowany na 100 userach. Kluczowy blocker.

**Cena**: $49/mo z 14-day free trial. Nie freemium (Claude API kosztuje za dużo per user). Nie $29 (za mały margin). Nie $99 (za wysokie na wejście bez brand recognition).

**Pozycjonowanie**: "AI Operating System dla handlowców w terenie — jedyny produkt, który pisze maile Twoim głosem, zna Twój CRM i pozwala zatwierdzić jednym swipe'em z telefonu." To jest realna biała plama — exploit it.