# Production architecture for a React Native CRM with AI streaming

**A Cloudflare Workers BFF serving pre-computed Notion data through KV cache can deliver sub-200ms dashboard loads to an Expo SDK 55 app — if you never call the Notion API on the user's critical path.** This report covers nine architectural domains for building a mobile CRM dashboard with AI-generated content, focusing on the specific stack of Expo SDK 55 (React Native 0.83, Hermes, New Architecture mandatory), Cloudflare Workers, and a Zustand + TanStack React Query state management layer. Each section provides production-ready patterns, library versions, performance benchmarks, and real-world examples rather than tutorial-level guidance. The core architectural insight threading through every topic: push computation to the edge, cache aggressively in Cloudflare KV, and keep the mobile client thin.

---

## 1. Cloudflare Workers as BFF: Hono + oRPC at the edge

The BFF pattern on Cloudflare Workers is production-proven at companies like Lightricks (millions of requests/day) and Shopify (Oxygen storefronts). The V8 isolate model delivers **<1ms cold starts** across 330+ data centers, making it ideal for a mobile BFF aggregating Notion, Gmail, and Telegram APIs.

**Framework choice matters significantly.** Three viable options exist: Hono v4.x (402,820 ops/sec on Workers, first-class Cloudflare support), tRPC v11.x (excellent type safety but poor REST/webhook support), and oRPC v1.x (stable since late 2025, **2.8x faster runtime than tRPC**, half the bundle size at ~103MB vs 268MB memory, with built-in OpenAPI support). The recommended architecture is **Hono as the HTTP layer with oRPC mounted for type-safe RPC endpoints**, while using Hono's native routing for Telegram webhook endpoints and Gmail push notifications that require standard REST. The T4 Stack (`react-native-cloudflare-starter` by rmarscher) provides a working reference for React Native + tRPC + Cloudflare Workers.

**Three-layer caching is essential for mobile-grade performance.** Layer 1 is the Cloudflare Cache API — free, per-PoP, sub-millisecond latency for HTTP response caching with 30–120s TTLs. Layer 2 is Cloudflare KV — globally distributed eventual consistency (~60s propagation), **~10ms hot reads but 300–500ms cold reads** at infrequently accessed PoPs. Layer 3 is D1 for relational tenant data and sync metadata. Always front KV with Cache API to avoid cold-read latency spikes. R2 is only appropriate for file storage (Gmail attachments).

For API aggregation, use `Promise.allSettled` to fetch from Notion, Gmail, and Telegram in parallel. Workers enforce a **limit of 6 simultaneous outbound connections** per request — manageable with three upstream APIs but requires connection discipline. Rate limiting operates on three tiers: the native Rate Limiting binding (zero-latency, per-location) for per-user throttling, Durable Objects token buckets for protecting upstream API limits (Notion's 3 req/s), and Cloudflare Queues for async rate-limited operations like Telegram messages (30 messages/second cap). Request coalescing within a single Worker invocation uses an in-flight `Map<string, Promise>` pattern; cross-invocation coalescing requires Cache API with short TTLs.

---

## 2. SSE streaming that actually works on Hermes

The historical blocker — React Native's `fetch` returning `undefined` for `response.body` — has been **substantially resolved in Expo SDK 52+**. The `expo/fetch` module (imported as `import { fetch } from 'expo/fetch'`) provides a WinterCG-compliant Fetch API with full `ReadableStream` support on native platforms. SDK 54 added `TextEncoderStream` and `TextDecoderStream` specifically "to better support fetch streaming and working with AI." The standard React Native `fetch()` still does not support streaming — you must use the Expo-specific import.

Two primary library choices exist for consuming SSE in the app. **`react-native-sse` v1.2.1** (by binaryminds) is the battle-tested option: pure JavaScript using XMLHttpRequest under the hood, no native modules, Expo-compatible without ejection, with built-in OpenAI streaming examples and TypeScript generics for custom event types. It supports POST requests with custom headers and body — critical for AI streaming endpoints that require authentication. **`expo/fetch` with manual ReadableStream parsing** is the standards-compliant path, requiring no additional dependencies on SDK 55 and integrating directly with the Vercel AI SDK's `useChat` hook for the highest-level abstraction.

On the Workers side, **Hono's `streamSSE()` helper** provides clean SSE response generation. A critical gotcha: Cloudflare can buffer SSE responses through certain response wrappers. Always set `Content-Encoding: Identity` and `Cache-Control: no-cache` headers, and use `TransformStream` directly rather than creating new Response objects. In local development with Wrangler, streaming may not work correctly without these headers.

**Streaming state belongs in Zustand, not TanStack Query.** TanStack Query is not designed for incremental streaming updates (confirmed in TanStack/query Discussion #418). The production pattern is: use `useMutation` to initiate the stream, manage token accumulation in a Zustand store via `appendToken` and `finalizeStream` actions, and invalidate relevant React Query caches on stream completion. For smooth typewriter UX, decouple network chunk arrival from visual rendering using a `requestAnimationFrame` buffer that renders approximately 3 characters per frame (~200 chars/sec at 60fps), matching the polish of ChatGPT and Claude's mobile apps.

Always handle `AppState` changes: close SSE connections on background, reconnect on foreground. For AI streaming specifically, disable auto-reconnect (`pollingInterval: 0` in react-native-sse) since responses are one-shot, and implement `[DONE]` sentinel parsing per the OpenAI convention.

---

## 3. TanStack Query v5 configured for mobile CRM realities

The optimal React Query configuration for a CRM dashboard prioritizes offline resilience and battery efficiency over real-time freshness. Set `networkMode: 'offlineFirst'` globally — this fires one request regardless of connection status (hitting the persisted cache), then pauses retries if offline. This single setting ensures the app serves cached data instantly on cold start, even without connectivity.

**Polling intervals should match data volatility:**

- Pipeline stats: `refetchInterval: 60000` (1 minute) — the most time-sensitive dashboard data
- Leads list: `staleTime: 300000` (5 minutes) — refreshed on screen focus via `useFocusEffect`, not polled
- Morning brief: `staleTime: 1800000` (30 minutes) — computed once per session
- Email drafts: no polling — user-triggered refetch only
- All intervals: `refetchIntervalInBackground: false` to prevent battery drain

Two mobile-specific integrations are mandatory. First, wire `expo-network`'s `addNetworkStateListener` into TanStack Query's `onlineManager` so the library knows the device's actual connectivity state. Second, connect React Native's `AppState` to `focusManager` so `refetchOnFocus` triggers when users return to the app — but set `refetchOnWindowFocus: false` in defaults since the web-oriented default doesn't apply to mobile.

For optimistic updates on quick CRM actions (marking a lead as "followed up" or moving pipeline stage), React Query v5 offers two patterns. The simpler approach renders `mutation.variables` while `isPending` is true, requiring no cache manipulation. The full pattern with rollback uses `onMutate` to cancel in-flight queries, snapshot previous state, update the cache optimistically, and restore on error. Per TkDodo (React Query maintainer): don't overuse optimistic updates — they add code complexity. Reserve them for interactions where instant feedback is critical, like pipeline drag-and-drop.

---

## 4. Swipe-to-approve cards built on Reanimated v4

The email draft review screen benefits from a hybrid of Apple Mail's progressive swipe reveal and Superhuman's single-focus triage model. The primary interaction is swipe-right to approve, swipe-left to reject, with tap-to-expand for editing — always backed by explicit button fallbacks for accessibility.

**`react-native-gesture-handler/ReanimatedSwipeable`** is the recommended component for SDK 55. This is the RNGH team's own Reanimated-powered swipeable, providing `renderLeftActions`/`renderRightActions` with `SharedValue<number>` progress parameters, configurable thresholds, and friction props. For a deck-style card review flow, **`rn-swiper-list`** (by Skipperlla) offers Tinder-like 4-directional swiping built on Reanimated 3+ with per-direction callbacks and spring configuration. For multi-step swipe actions (first step reveals "approve," deeper swipe reveals "edit"), **`react-native-reanimated-swipeable`** (by gkasdorf) provides configurable `triggerThreshold` per action step.

SDK 55 mandates New Architecture (Fabric), which means **Reanimated v4** with the extracted `react-native-worklets` package. Gesture Handler v3 introduces a hook-based API (`usePanGesture`). Performance rules for 60fps: animate only `transform` and `opacity` (GPU-accelerated); never animate `width`, `height`, or `backgroundColor` in gesture callbacks; keep gesture handlers pure with no JS-thread calls; use `withSpring({ damping: 15, stiffness: 150 })` for physical-feeling interactions; and pair threshold crossings with `expo-haptics` (`Haptics.impactAsync(ImpactFeedbackStyle.Medium)`).

**Accessibility is a known gap in swipeable components.** RNGH's `Swipeable` doesn't properly handle screen readers — hidden actions are still announced by VoiceOver because they're always rendered off-screen. The workaround is tracking open/close state and toggling `accessibilityElementsHidden` (iOS) and `importantForAccessibility` (Android). More importantly, provide `accessibilityActions` with `approve`, `reject`, and `edit` handlers on every card, and detect screen readers via `AccessibilityInfo.isScreenReaderEnabled()` to conditionally render explicit buttons instead of the swipe UI.

---

## 5. Offline-first with MMKV and expo-sqlite

**MMKV is 30x faster than AsyncStorage** for read operations — ~0.52ms per operation versus ~2.55ms (benchmarked on iPhone 11 Pro, Hermes, 1000 operations). It uses memory-mapped files for direct memory access, bypassing the JS bridge entirely. Version 4.x is a Nitro Module compatible with New Architecture, installed via `npx expo install react-native-mmkv react-native-nitro-modules && npx expo prebuild`.

The recommended storage architecture splits responsibilities across three layers. **MMKV** handles synchronous key-value needs: auth tokens (with AES-256 encryption), Zustand persistence for UI state and pipeline filters, React Query cache persistence, and feature flags. **expo-sqlite** (bundled in SDK 55, v16.x, supports SQLCipher encryption) handles structured relational data: the leads cache with offline search/filter capability, email draft content, offline mutation queues, and activity logs. **WatermelonDB** (v0.28.x, 11.5K GitHub stars) is generally overkill for a CRM dashboard — expo-sqlite with a thin custom sync layer gives more control with less complexity. A notable addition: SDK 54+ introduced `expo-sqlite/kv-store` as a synchronous drop-in AsyncStorage replacement, useful if you want SQL-backed key-value storage without adding MMKV.

For React Query offline persistence, use `PersistQueryClientProvider` with an MMKV-backed synchronous persister and a `throttleTime` of 1000ms to avoid excessive disk writes. The critical detail: set `onlineManager` state **before** rendering the persistence provider to prevent unnecessary fetches while offline on cold start. Use `shouldDehydrateQuery` to selectively persist only small, frequently-accessed queries — skip large paginated datasets and activity feeds. For mutations that must survive app restarts, register default `mutationFn` at the `QueryClient` level since serialized mutations lose their function references.

Conflict resolution should be data-type-specific: **last-write-wins** for pipeline stage changes (atomic operations), **client-wins** for email drafts (user's local version is authoritative), **field-level merge** for lead edits, and **server-wins** for computed aggregates and the morning brief. Track pending changes with `syncedAt` timestamps and flush them with idempotency keys when connectivity returns.

---

## 6. Actionable push notifications that replace Telegram alerts

Expo's `expo-notifications` (v55.0.x, bundled with SDK 55) supports notification categories with interactive action buttons — the foundation for an approve/reject/edit workflow that eliminates the Telegram bot dependency. Register categories at app initialization using `setNotificationCategoryAsync` with three actions: "Approve" (`opensAppToForeground: false` for background processing), "Reject" (`isDestructive: true` for iOS red styling, with optional `textInput` for rejection reasons), and "Edit" (`opensAppToForeground: true` for deep-linking to the review screen).

**iOS and Android differ significantly in notification capabilities.** Android limits notifications to **3 action buttons maximum** (iOS supports ~10). iOS requires long-press or 3D Touch to reveal action buttons; Android requires expanding the notification. iOS supports `isDestructive` (red) and `isAuthenticationRequired` (Face ID/Touch ID to act) styling — Android has neither. Android requires notification channels (since API 26) for per-type user control. A critical Android gotcha: there are open issues (#36282, #31710) where action buttons fail to appear when the app is in background or killed state — test thoroughly on physical devices using development builds, never Expo Go.

For background processing of approve/reject actions, `expo-task-manager` allows defining tasks at module scope that execute when notification actions are tapped while the app is backgrounded. The task receives the action identifier and notification data, enabling a background `fetch` call to the BFF to process the approval. On iOS, this requires `enableBackgroundRemoteNotifications: true` in the expo-notifications config plugin and `_contentAvailable: true` in the push payload. Apple throttles background notifications to approximately 2–3 per hour.

The Telegram-to-push migration path: keep the Telegram bot as a fallback notification channel during transition, send Expo push tokens to the BFF during registration, and have the Workers backend send notifications via `POST https://exp.host/--/api/v2/push/send` with the `categoryId: 'draft_review'` field and draft metadata in the `data` payload.

---

## 7. Notion API performance: never touch it on the critical path

Notion's API enforces **3 requests per second per integration** (averaging to ~2,700 calls per 15-minute window with burst allowance). Individual query latency ranges from 100–300ms for simple filtered queries to 300–800ms for complex queries involving rollups, formulas, or relations. The 25-reference ceiling on relation properties means pagination calls that add ~400ms per round-trip. These constraints make synchronous Notion API calls on user request fundamentally incompatible with a sub-1-second dashboard target.

**The solution is complete decoupling through pre-computation.** A Cloudflare Cron Trigger running every 5 minutes queries Notion for records changed since the last sync (`last_edited_time > lastSyncTimestamp`), computes pipeline aggregates (stage counts, total values, recent activities), and stores dashboard-ready JSON in KV. Notion now supports native integration webhooks (available as of 2025) that deliver metadata-only payloads within ~1 minute of changes — use these to trigger targeted cache invalidation rather than waiting for the next cron cycle. The webhook payload contains only the page ID and event type; you still need an API call to fetch actual content.

**The resulting latency budget is transformative:**

| Path | Latency |
|------|---------|
| Hot cache (KV at edge) | **60–120ms** total round-trip |
| Cold KV (central store read) | **70–160ms** total |
| Full Notion fetch (never on user path) | 300–1000ms per call |

Every Notion API query should use the `filter_properties` parameter to fetch only needed fields — Notion's docs confirm this "can make a significant improvement to the speed of the API." Filter on simple property types (select, status, number, date) rather than text, formula, or rollup. Paginate at `page_size: 100` (maximum) with cursor-based iteration and a self-imposed 2 req/s rate to leave headroom. Run a full reconciliation sync every 6 hours to catch missed webhooks. For the 25-reference limit on relations, denormalize relation data into KV during background sync — this drops read latency from ~400ms (paginated API calls) to **~80ms** (single KV read).

---

## 8. JWT auth with expo-secure-store and biometric gating

`expo-secure-store` (v55.0.x) wraps iOS Keychain Services and Android Keystore, providing encrypted storage suitable for JWT tokens. The critical constraint is a **~2KB soft limit per value on iOS** — a typical JWT at 800–1500 bytes fits, but tokens with large custom claims payloads may fail silently. Store access and refresh tokens as separate keys, never as a JSON blob. On iOS, Keychain data **persists across app uninstallation** (a security consideration requiring server-side revocation capability). On Android, data is lost on uninstall.

**Biometric authentication should use the two-library pattern** rather than `expo-secure-store`'s built-in `requireAuthentication`. The reason: `requireAuthentication` binds storage access to biometric enrollment state — if a user adds a new fingerprint, **stored values become permanently inaccessible**. Additionally, Android's face recognition may be classified as `BIOMETRIC_WEAK` and fail with `ERR_SECURESTORE_AUTH_NOT_CONFIGURED` on Samsung devices. The robust pattern: use `expo-local-authentication` to verify biometrics first (with passcode fallback via `disableDeviceFallback: false`), then read tokens from `expo-secure-store` without the `requireAuthentication` flag. This provides granular error handling and graceful degradation.

The token refresh interceptor must handle a specific race condition: when an access token expires, multiple simultaneous requests all receive 401, potentially triggering concurrent refresh attempts that break refresh token rotation. The production pattern uses an `isRefreshing` flag and a `failedQueue` array — the first 401 triggers the refresh, subsequent 401s queue their retry promises until the refresh completes, then all queued requests replay with the new token. On the Workers side, **Hono's built-in JWT middleware** (`hono/jwt`) or the `jose` library (v6.x, zero dependencies, native WebCrypto) handles verification. Store JWT secrets as Worker Secrets (`wrangler secret put JWT_SECRET`), never in configuration files. For future multi-tenancy, embed `tenantId` in JWT claims from day one.

---

## 9. Multi-tenant readiness without over-engineering today

The correct multi-tenancy model for a BFF aggregating external APIs is **shared Worker with logical tenant isolation** — a single Worker handles all tenants, identified via JWT claims, with data isolated by `tenant_id` prefixes in KV keys and row-level filtering in D1. Cloudflare's Workers for Platforms (per-tenant V8 sandboxes) is designed for platforms where tenants run custom code — overkill for a BFF.

**The four-phase migration path from single-user to multi-tenant avoids rewrites:**

- **Phase 1 (do now)**: Add `tenant_id` to all data store keys (`tenant:{id}:user:{userId}:cache:notion`), create a default tenant for the existing user, scope all queries by tenant ID by construction. This is the zero-cost architectural insurance that prevents a future rewrite.
- **Phase 2 (when adding second user)**: Embed `tenant_id` in JWT claims, add tenant extraction middleware to all routes, implement per-tenant OAuth token storage for Notion and Gmail.
- **Phase 3 (when adding self-service)**: Automate onboarding: new tenant = D1 row insert + KV config entries + OAuth flow for Notion/Gmail workspace authorization.
- **Phase 4 (when differentiating plans)**: Per-tenant feature flags and rate limits stored in KV, plan-based access control.

The Notion API multi-workspace pattern requires **public OAuth integration** (not internal integration tokens) for multi-tenancy. Each tenant authorizes via OAuth, and the BFF stores per-tenant `access_token` and `refresh_token` in KV (encrypted), including them in the `Authorization` header when proxying to Notion's API. Gmail follows the same OAuth pattern. Telegram is simpler — each tenant provides their bot token. Per-tenant rate limiting uses the native Rate Limiting binding keyed by `tenant:{id}:{path}`, with Durable Objects token buckets preventing any single tenant from exhausting Notion's 3 req/s global limit.

---

## Conclusion: the architecture in one diagram

The system operates on a clear principle — the Workers BFF does the heavy lifting so the mobile client stays fast and simple:

```
Expo SDK 55 App (Hermes, New Architecture)
├── Zustand: streaming state, UI preferences, offline drafts (persisted to MMKV v4)
├── TanStack Query v5: server state (offlineFirst mode, persisted to MMKV)
├── react-native-sse: AI content streaming from Workers
├── ReanimatedSwipeable: approve/reject card interactions
├── expo-notifications: actionable push (approve/reject/edit buttons)
└── expo-secure-store: JWT tokens + expo-local-authentication biometric gate
         ↕ HTTPS
Cloudflare Workers BFF (Hono v4 + oRPC v1)
├── JWT auth middleware (hono/jwt, tenant-aware from day one)
├── 3-layer cache: Cache API → KV → D1
├── SSE streaming via Hono streamSSE() for AI responses
├── Cron Triggers: 5-min Notion sync, aggregate pre-computation
├── Notion webhooks: targeted cache invalidation
├── Queues: rate-limited upstream API calls
└── Per-tenant OAuth tokens in KV (Notion, Gmail, Telegram)
```

The most impactful architectural decisions are not framework choices but caching strategy. Pre-computing dashboard aggregates in background Workers and serving them from KV delivers **60–120ms dashboard loads** — a 10x improvement over synchronous Notion API calls. Combining this with `offlineFirst` network mode in TanStack Query, MMKV persistence, and expo-sqlite for structured offline data creates a CRM that works reliably on spotty mobile connections. The swipe-to-approve workflow, actionable push notifications, and SSE streaming for AI content are the UX polish layers that make the app feel native rather than a web wrapper — but the performance foundation underneath is what makes them feel instant.