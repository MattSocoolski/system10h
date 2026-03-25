# DEEP RESEARCH PROMPTS — System 10H Mobile App Excellence

> Wygenerowane z pełnego audytu kodu (Opus 4.6, 25.03.2026)
> Cel: wycisnąć max z iPhone UX + zbudować powtarzalny product template

---

## PROMPT 1: PREMIUM DARK UI — iPhone-first AI Business App

```
Jestem twórcą mobilnej aplikacji AI Operating System dla przedsiębiorców (Expo + React Native, iPhone-first).

Obecny stan designu:
- Dark theme: #0F172A (base), #1E293B (card), #334155 (elevated)
- Akcenty: #A855F7 (purple brand), #4ADE80 (success), #F87171 (danger), #60A5FA (info), #FBBF24 (warning)
- Typografia: system font, skala 11-32pt, weights 500-800
- Ikony: emoji (📊👥✉️) zamiast icon library
- Brak custom fontów, brak gradientów, brak micro-animacji

Ekrany:
1. Dashboard — metryki (overdue, drafty, closed), action cards z leadami, activity feed
2. Pipeline — lista leadów z status dots, filter chips, bottom sheet (native) / full page (web)
3. Drafts — swipeable cards (approve/reject), Gmail-style undo snackbar, source badges (Autopilot/Ghost/Manual)
4. Draft Preview — email header + body + edit mode + action bar
5. Lead Detail — header z wartością, quick actions (+3d, follow-up, call), notatki, kontakt

Pytania do deep research:

1. **Jakie są najlepsze praktyki designu premium dark UI na iPhone w 2025-2026?**
   - Porównaj: Linear, Arc Browser, Raycast, Superhuman, Notion mobile, Things 3, Apollo (Reddit)
   - Co sprawia że app "czuje się premium" na iPhone? (haptics, animacje, transitions, blur, glassmorphism?)
   - Jakie fonty (Google Fonts / system) dają premium feel w dark mode?
   - Czy gradientowe akcenty (mesh gradient, subtle glow) działają na dark bg?

2. **Jak zaprojektować palety kolorów specjalnie dla dark mode AI/productivity tools?**
   - Czy moja paleta (#0F172A base) jest optymalna? Porównaj z Tailwind dark, Linear, Vercel
   - Kontrasty WCAG AA/AAA w dark mode — gdzie moje kolory failują?
   - Jak unikać "flat dark" efektu (wszystko wygląda tak samo)? Depth layers, elevation, shadows?
   - Semantic colors: jaki jest state-of-the-art dla success/danger/warning/info w dark mode?

3. **Micro-interactions i animacje na iPhone (React Native Reanimated 4):**
   - Jakie animacje dodają premium feel bez bycia gadżeciarskimi? (spring physics, shared transitions)
   - Haptic feedback patterns — kiedy Light, kiedy Medium, kiedy Success/Warning/Error?
   - Transition między ekranami — shared element, fade, slide? Co jest "iPhone native feel"?
   - Loading states — skeleton loaders vs shimmer vs progressive? Co jest 2026 standard?

4. **Icon system:**
   - Emoji vs SF Symbols (expo-symbols) vs Lucide vs Phosphor — co daje best look na iPhone?
   - Jak mieszać icon library z custom brand elements?
   - Animated icons — worth it? (Lottie vs Reanimated)

5. **Spacing i typography scale:**
   - Moja skala: 11-12-13-14-15-16-17-18-20-22-26-32pt. Czy to optymalne?
   - Porównaj z Apple HIG typography scale
   - Spacing: 8pt grid? 4pt grid? Mam mix (8, 10, 12, 16, 20, 24px) — jaki system?
   - Font weight: czy 500 jako "regular" jest OK? Czy lepiej 400 regular + 600 semibold?

Daj mi KONKRETNE rekomendacje z hex kolorami, wartościami pt, nazwami fontów — nie ogólne zasady. Pokaż before/after dla mojej palety.
```

---

## PROMPT 2: UX PATTERNS — AI-Powered CRM/Email Mobile App

```
Buduję mobilną aplikację (iPhone-first, Expo/React Native) która jest front-endem do AI Operating System. System automatycznie:
- Skanuje Gmail co 30 min
- Klasyfikuje maile (Claude AI)
- Generuje drafty odpowiedzi w stylu użytkownika
- Aktualizuje CRM (Notion)
- Wysyła push notifications na telefon

Użytkownik w aplikacji:
- Przegląda dashboard (overdue leady, nowe drafty, metryki pipeline)
- Approves/rejects AI-generated email drafts (swipe right/left)
- Zarządza pipeline leadów (status, due dates, notatki)
- Edytuje drafty przed wysłaniem

Obecne UX patterns:
- Swipeable draft cards z Gmail-style 5s undo
- Bottom sheet na native / full page na web
- Pull-to-refresh
- Filter chips (status filter, brak search)
- Haptic feedback na approve/reject
- Push notifications z actionable buttons (Approve/Reject/Snooze)

Pytania do deep research:

1. **Jak najlepsze mobile CRM/email apps rozwiązują "draft review" UX?**
   - Porównaj: Superhuman, Spark, Edison Mail, HubSpot Mobile, Salesforce Mobile, Front
   - Swipe vs tap vs long-press — co jest najskuteczniejsze dla approve/reject?
   - Batch approve — jak robią to inne apps? (select mode, "approve all safe", AI confidence score)
   - Draft preview — inline expand vs full page? Rich HTML vs plain text?

2. **AI confidence & transparency w mobile UX:**
   - Jak pokazać "AI pewność" (np. 85% match ze stylem) bez przytłaczania usera?
   - "AI badge" — jakie apps robią to dobrze? (GitHub Copilot, Notion AI, Grammarly)
   - Explain AI decision — "Dlaczego tak napisał?" — czy mobile potrzebuje?
   - Trust building: jak stopniowo budować zaufanie usera do AI drafts?

3. **Pipeline/CRM na mobile — best practices:**
   - Porównaj: Pipedrive Mobile, Close.io, HubSpot, Attio, Folk CRM
   - Kanban vs lista vs grouped list — co działa na małym ekranie?
   - Quick actions (postpone, follow-up, call) — floating action button vs inline vs contextual menu?
   - Search & filter na mobile — bottom sheet filter vs top bar vs command palette?

4. **Push notifications strategy dla AI OS:**
   - Kiedy pushować vs kiedy czekać? (urgency levels: immediate, batch, morning digest)
   - Actionable notifications (approve draft z notification center) — conversion rates?
   - Notification grouping — per lead? Per type? Mixed?
   - "Quiet hours" i smart delivery — jak implementować?

5. **Offline-first architecture dla CRM mobile:**
   - TanStack Query offline mode — wystarczy? Czy potrzebna SQLite (expo-sqlite)?
   - Optimistic updates — approve draft offline → sync gdy online?
   - Conflict resolution — co jeśli lead zaktualizowany z 2 urządzeń?
   - Graceful degradation — co pokazać gdy brak sieci?

6. **Onboarding flow dla AI OS mobile:**
   - Jak tłumaczyć "AI czyta Twoje maile i pisze odpowiedzi" bez straszenia?
   - Permissions ask: Gmail access, Notifications, CRM — kolejność?
   - First draft review experience — jak poprowadzić użytkownika?
   - Value-to-time: ile sekund od instalacji do "wow moment"?

Daj mi KONKRETNE wzorce UX z nazwami apps, screenshotami do referencji, i flow diagrams. Nie ogólne zasady — pokaż jak Top 5 apps to robi.
```

---

## PROMPT 3: REPEATABLE PRODUCT TEMPLATE — AI OS Mobile as SaaS

```
Buduję produkt "System 10H" — AI Operating System dla przedsiębiorców/handlowców. Obecna architektura:

Backend:
- Cloudflare Worker (Hono.js) jako BFF
- Notion CRM jako database (per-tenant, Database ID w config)
- Gmail API (OAuth2, per-user refresh token)
- Claude API (Sonnet/Haiku) do email classification + draft generation
- KV store (cache, rate limiting, session state)
- Expo Push Notifications

Mobile:
- Expo SDK 55 + React Native 0.83 + TypeScript
- Expo Router (file-based)
- TanStack React Query + Zustand
- React Native Reanimated 4
- 5 ekranów: Dashboard, Pipeline, Drafts, Lead Detail, Draft Preview

Cel: Zrobić z tego POWTARZALNY PRODUKT (SaaS) — każdy klient dostaje "swojego Bliźniaka" (AI asystenta) z mobilną appką.

Pytania do deep research:

1. **Multi-tenant mobile app architecture:**
   - Jedna app w App Store z per-tenant config? Czy osobne buildy?
   - White-label vs branded — co jest standard w B2B SaaS mobile?
   - Tenant isolation: jak oddzielić dane klientów (Notion databases, Gmail accounts, KV namespaces)?
   - Config-driven UI: jak zmienić kolory/logo/branding per tenant bez rebuildu?

2. **Productized AI email assistant — competitive landscape:**
   - Kto buduje podobne produkty? (Lavender, Regie.ai, Outreach, SalesLoft, Apollo.io)
   - Czym się różnię? (ghost writing w stylu usera, nie generic AI, + CRM + mobile approval)
   - Jakie features mają competitors w mobile? Co jest table stakes, co jest differentiator?
   - Pricing models — per seat? Per email? Per AI call? Flat fee?

3. **Expo OTA updates + multi-tenant distribution:**
   - EAS Build + EAS Update — jak robić OTA updates dla production users?
   - TestFlight → App Store review → production — timeline i flow?
   - Expo config plugins — jak zarządzać per-tenant splash screens, icons, bundle IDs?
   - Internal distribution (EAS Build) vs public App Store — co wybrać na start?

4. **Notion as production database — limits i alternatywy:**
   - Notion API rate limits (3 req/sec per integration) — co przy 50 tenants × 100 leads?
   - Notion vs Supabase vs PlanetScale vs Turso — koszt, latency, DX?
   - Migration path: Notion → "real DB" bez breaking klientów?
   - Hybrid: Notion jako UI dla klienta + shadow DB (SQLite/Turso) jako query layer?

5. **Security & compliance dla SaaS z dostępem do emaili:**
   - Gmail API OAuth scopes — jakie minimum dla draft read/create/send?
   - Google Cloud verification process — timeline, requirements, rejection reasons?
   - GDPR/data processing — co muszę mieć dla EU klientów?
   - SOC2 — kiedy jest wymagane? Jakie shortcuts (Drata, Vanta, manual)?

6. **Revenue model i unit economics:**
   - Koszt per tenant per miesiąc: ~$10 Claude API + ~$0 Cloudflare + ~$0 Notion (free API) = ~$10
   - Ile mogę charge? Benchmarki: Lavender ($29/mo), Apollo ($49/mo), Close.io ($59/mo)
   - Freemium vs trial vs paid-only — co działa w B2B SaaS PLG?
   - Przy jakiej skali (tenants) Notion API staje się bottleneck?

Daj mi STRATEGICZNE rekomendacje z konkretnymi narzędziami, kosztami, timeline'ami. Porównaj z minimum 5 competitors. Pokaż migration path od MVP do production SaaS.
```

---

## PROMPT 4: PERFORMANCE & POLISH — React Native na iPhone

```
Mam aplikację React Native (Expo SDK 55, Reanimated 4, FlashList, Gesture Handler) z 5 ekranami.

Obecne problemy z performance/polish (z audytu kodu):

1. Drafts list używa ScrollView zamiast FlashList — może być wolne przy 20+ draftach
2. Dashboard ScrollView renderuje wszystkie elementy naraz (brak lazy loading)
3. Brak skeleton loaders — spinner "Ładowanie..." wygląda jak 2020
4. Animacje entry (FadeIn 300ms) są OK ale brak shared element transitions między ekranami
5. Haptic feedback bug: recursive call zamiast Haptics API
6. Brak offline cache — każdy render = API call
7. Tab navigation nie ma badge na Drafts tab (brak draft count indicator)
8. Activity feed ma max 5 items, brak "load more"
9. Brak search w Pipeline (tylko status filter chips)

Pytania do deep research:

1. **React Native performance optimization 2025-2026:**
   - New Architecture (Fabric + TurboModules) — jak wpływa na performance w Expo SDK 55?
   - FlashList vs FlatList vs RecyclerListView — kiedy który?
   - React.memo vs useMemo vs useCallback — co jest overused w RN community?
   - Bundle size optimization — jak zmniejszyć initial load time?

2. **Skeleton loaders & loading states w React Native:**
   - @shopify/skeleton-shimmer vs react-native-skeleton-placeholder vs custom Reanimated?
   - Jak zaprojektować skeleton który matchuje layout? (content-aware vs generic)
   - Progressive loading: skeleton → partial data → full data — pattern?

3. **Shared element transitions w Expo Router:**
   - react-native-shared-element vs Reanimated shared transitions?
   - Expo Router: jak animować przejście lista→detail z shared card?
   - iOS-native feel: interactive pop gesture (swipe back) z shared elements?

4. **Offline-first z TanStack Query:**
   - persistQueryClient + MMKV vs AsyncStorage — co jest fastest?
   - Stale-while-revalidate patterns — optimal staleTime/gcTime?
   - Mutation queue: jak kolejkować offline approvals i syncować?
   - Network-first vs cache-first per endpoint — strategia?

5. **Tab badge + real-time updates:**
   - Jak pokazać badge (3) na Drafts tab bez ciągłego pollingu?
   - WebSocket vs polling vs push-triggered refresh — co jest practical?
   - Expo Notifications background fetch — czy może triggerować badge update?

6. **Search implementation na mobile:**
   - In-memory search (fuse.js) vs API search vs edge search (KV)?
   - Search UX: always-visible vs tap-to-expand vs command palette?
   - Debounce strategy: 300ms? 500ms? Instant on local data?

Daj mi KOD (React Native/Expo snippets) i BENCHMARKS (FPS, memory, bundle size). Nie ogólne porady — konkretne implementacje z npm packages i config.
```

---

## JAK UŻYWAĆ

1. Skopiuj wybrany prompt do przeglądarki (Gemini Deep Research, Perplexity Pro, ChatGPT Deep Research)
2. Wyniki wklej do materialy/ jako `2026-03-25_DR_mobile_[topic].md`
3. Użyj wyników jako spec dla @cto do implementacji

**Priorytet:**
- PROMPT 1 (design) — natychmiastowy ROI, visual upgrade
- PROMPT 2 (UX patterns) — średnioterminowy, feature roadmap
- PROMPT 4 (performance) — przed App Store submit
- PROMPT 3 (product template) — strategiczny, po walidacji MVP
