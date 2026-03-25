# Production architecture for a React Native CRM with AI and Cloudflare Workers

**A solo B2B salesperson's mobile CRM — three screens, five APIs, one BFF — can achieve sub-second load times and 60fps gesture animations using the patterns below.** This report covers the full production stack: Cloudflare Workers as a BFF aggregating Notion, Gmail, and Claude AI; streaming AI-generated drafts via SSE; swipe-to-approve card workflows; offline-first persistence; and a JWT auth layer that evolves gracefully from single-user to multi-tenant. Every library version and benchmark is current for **Expo SDK 55** (React Native 0.83, React 19.2, New Architecture only) as of March 2026.

---

## Cloudflare Workers BFF: caching tiers and API aggregation

**Hono.js v4.11.x** (~14kB for `hono/tiny`) is the recommended routing framework. Cloudflare uses Hono internally for D1, KV, Queues, and Workers Logs — it's zero-dependency, Web Standard–only, and its RegExpRouter is the fastest in the Workers ecosystem. The BFF's job is to aggregate Notion, Gmail, Claude, and Telegram into single-response payloads that the mobile client can render without waterfall fetches.

The critical runtime constraints shape every design choice. Workers get **30 seconds of CPU time** on the paid plan (recently extended to 5 minutes for heavy workloads), but this measures only active processing — time spent `await`ing API calls doesn't count. You're capped at **6 simultaneous outbound connections** and **1,000 subrequests per invocation**, which comfortably supports parallel calls to four upstream APIs. Memory is **128MB per isolate** shared across concurrent requests.

The aggregation pattern uses `Promise.allSettled()` to call all APIs in parallel and return partial data when any upstream fails:

```typescript
const [contacts, emails, aiInsight] = await Promise.allSettled([
  fetchNotionDatabase(env.NOTION_TOKEN),
  fetchGmailThreads(env.GMAIL_TOKEN),
  fetchClaudeAnalysis(env.CLAUDE_API_KEY),
]);
return c.json({
  contacts: unwrap(contacts, []),
  emails: unwrap(emails, []),
  aiInsight: unwrap(aiInsight, null),
  _meta: { partial: results.some(r => r.status === 'rejected') }
});
```

Always return HTTP 200 with an `_meta.errors` array for partial failures. Reserve 5xx for total BFF failures. The mobile client renders available sections and shows degraded UI for failed ones.

**Caching should be tiered across three storage layers.** Cache API provides **sub-millisecond** edge-local reads — ideal for user-specific dashboard payloads with 1–5 minute TTLs. Workers KV delivers **0.5–10ms hot reads** (improved 3x since September 2024) with global distribution and 60-second eventual consistency — best for shared reference data and AI-generated summaries at 5–60 minute TTLs. R2 is S3-compatible object storage at **40–100ms** uncached reads — reserve it for attachments and exports over 25MB. The multi-tier lookup is: check Cache API first (free, local), then KV (global, persistent), then fetch upstream. Use `ctx.waitUntil()` for write-behind to cache without blocking the response.

| Data type | Storage | TTL | Latency |
|---|---|---|---|
| Per-user dashboard | Cache API | 1–5 min | ~0ms (edge-local) |
| Shared reference data | KV | 5–60 min | 0.5–10ms hot |
| AI-generated summaries | KV | 15–30 min | 0.5–10ms hot |
| Pre-computed aggregations | KV | Updated via cron | 0.5–10ms hot |
| Large exports, attachments | R2 + Cache front | Hours/days | 40–100ms uncached |

For progressive loading, Hono's `streamSSE()` helper streams partial results as each API resolves — the Notion contacts section can render before the Claude analysis finishes.

---

## SSE streaming delivers AI drafts token by token

The breakthrough for SSE in React Native came with **Expo SDK 52's `expo/fetch`**, which provides native `ReadableStream` support via OkHttp (Android) and URLSession (iOS). SDK 55 inherits and extends this: `ReadableStream`, `WritableStream`, `TransformStream`, `TextEncoder`, and `TextDecoder` are all globally available in the Hermes engine.

Two viable approaches exist, and the choice depends on risk tolerance. **`react-native-sse` v1.2.1** is the battle-tested option — pure JS using XMLHttpRequest internally, works in Expo Go, supports POST with custom headers, and has proven patterns for Claude/OpenAI streaming (33 dependents on npm). Set `pollingInterval: 0` to disable auto-reconnect for one-shot AI generation. The modern alternative uses `expo/fetch` directly to get a proper `ReadableStream`, which is more efficient but has edge cases: stream cancellation bugs have been reported, and the Vercel AI SDK still has type incompatibilities with expo/fetch's polyfilled stream.

**The `@microsoft/fetch-event-source` library does NOT work with React Native** — confirmed in their issue tracker. Use `react-native-sse` or `expo/fetch` instead.

On the Cloudflare Workers side, the simplest SSE proxy passes Claude's stream through verbatim:

```typescript
const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-sonnet-4-20250514', stream: true, messages }),
});
return new Response(claudeResponse.body, {
  headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
});
```

Avoid wrapping the `Response` multiple times (a known Hono + CF Workers buffering issue where the entire stream buffers before sending). Pass the `ReadableStream` directly.

**Token-by-token rendering requires batching to avoid jank.** Calling `setState` on every token (arriving every 10–50ms) causes excessive re-renders. The production pattern accumulates tokens in a `useRef` and batches visual updates via `requestAnimationFrame`, resulting in one `setState` call per frame regardless of token arrival rate. On New Architecture, Android's `requestAnimationFrame` runs at ~40–50fps (a known regression from legacy arch's 70–100fps), which is still adequate for text streaming.

For background handling: iOS suspends network connections after ~30 seconds in background, and Android's Doze mode restricts network access. Close SSE connections on `AppState` change to `background`, reconnect on `active`. For AI draft generation (typically 5–30 seconds), this rarely matters — but abort the stream if the user navigates away.

---

## TanStack Query v5 and Zustand form the state architecture

**@tanstack/react-query v5.95.x** is fully compatible with Expo SDK 55 (pure JS, no native dependencies). **Zustand v5.0.12** works with React 19.2 and pairs with **react-native-mmkv v4.3.0** (now a Nitro Module requiring New Architecture — satisfied by SDK 55).

The golden rule from TkDodo (React Query's maintainer): **never store server data in client state libraries.** React Query handles caching, refetching, and invalidation for all API responses. Zustand owns only client state: active tab, filter selections, selected deal ID, draft edit buffers, theme preference, and auto-refresh interval. This separation eliminates an entire class of synchronization bugs.

Three React Native–specific configurations are essential and often missed. Wire `onlineManager` to `expo-network` so React Query knows when the device goes offline. Wire `focusManager` to `AppState` so queries refetch when the app returns from background. Add a `useFocusEffect` hook from `@react-navigation/native` so stale queries refetch on screen navigation.

Polling intervals should match data volatility:

| Data type | Strategy | Rationale |
|---|---|---|
| Dashboard KPIs | `staleTime: 5min`, refetch on screen focus | Changes infrequently |
| Pipeline deals | `refetchInterval: 60s` | Moderate change frequency |
| Draft review queue | `refetchInterval: 30s` | Time-sensitive approvals |
| User settings | `staleTime: Infinity` | Invalidate only on explicit update |

For the approve/reject workflow, **optimistic updates at the cache level** are essential — binary actions with high success probability should provide instant UI feedback. The pattern: cancel outgoing refetches, snapshot previous state, update the cache optimistically, return rollback context in `onMutate`, rollback on error, and always invalidate `onSettled`. For concurrent optimistic updates (rapid approve/reject on different drafts), only invalidate when `queryClient.isMutating()` returns 1 — preventing intermediate refetches from overwriting other in-flight optimistic updates.

Prefetch adjacent screens while the user is on the Dashboard. Call `queryClient.prefetchQuery()` for Pipeline and Draft Review data on mount — navigation becomes instant because the data is already cached.

React Query v5's **structural sharing** (enabled by default) compares new JSON responses with cached data and preserves unchanged references, so components only re-render when their specific data changes. The `select` option further narrows re-render scope — a component displaying only the deal count won't re-render when deal details change. **Tracked queries** (also default in v5) mean that if a component only reads `data` but not `error` or `isFetching`, it won't re-render when those properties change.

---

## Swipe cards: lessons from Superhuman, Linear, and Tinder

**Superhuman's mobile email triage** is the closest production analog to this use case. It offers customizable swipe actions (archive, snooze, delete), a bottom triage bar with scrollable options, and — since its Grammarly acquisition — AI-generated draft replies for every incoming email. The critical lesson from UX reviews: **keep action positions consistent across states.** Superhuman drew criticism for placing trash (pull-down) and archive (bottom-right scroll) in different interaction zones.

**Linear's Triage Intelligence** provides the best model for AI-assisted approval flows. AI analyzes incoming issues and suggests assignee, labels, and projects. Users accept or dismiss per suggestion. The UI uses the same visual language as the rest of the app, shows the model's reasoning on tap, displays a "thinking" progress indicator, and clearly distinguishes AI-suggested from human-set metadata. The design principle: "trust, transparency, natural extension."

For the React Native implementation, **react-native-gesture-handler (bundled with SDK 55) + react-native-reanimated v4.x** is the production-grade combination. Reanimated v4 runs all animation logic on the UI thread via worklets — gestures never cross the JS bridge during interaction, maintaining **60fps** animations. The key parameters calibrated from Tinder's canonical pattern: swipe threshold at **120–150px** (~35% of screen width), velocity threshold at **~800px/s** for quick flicks, card rotation interpolated to **±15°** at full extent, and overlay label opacity tied proportionally to drag distance.

The pre-built **`rn-swiper-list`** package (built on reanimated + gesture-handler + worklets) provides a solid starting point with left/right/up/down swipe support, overlay labels, `swipeBack()` for undo, and velocity-based thresholds. For full control, a custom `Gesture.Pan()` implementation with `withSpring()` snap-back gives exactly the behavior needed.

The recommended card layout for AI draft review shows: recipient and subject at top, an **AI confidence score** (e.g., "82% match" with factors like tone, personalization, CTA strength), the draft preview with AI-generated sections highlighted via subtle background tint or sparkle icon, and an edit-on-tap affordance. High-confidence drafts (>85%) allow quick-approve via swipe; low-confidence drafts force expansion before approval.

**Haptic feedback** via `expo-haptics` should fire at three points: `selectionAsync()` at the threshold crossing, `notificationAsync(Success)` on approve, and `notificationAsync(Warning)` on reject. After any destructive action, show a **5-second undo snackbar** (Gmail's standard) — delay the actual API call and cancel on undo. For accessibility, always provide visible Approve/Reject tap buttons as alternatives to swipe, and register `accessibilityActions` for VoiceOver/TalkBack custom action cycling.

---

## Offline-first: MMKV for speed, SQLite for structure

**react-native-mmkv v4.3.0** is the clear winner for key-value storage: **~30x faster than AsyncStorage** with synchronous JSI-based access (~0.5ms per read vs ~2.5ms), built-in AES-256 encryption, and no size limits. It requires a development build (not Expo Go) and `react-native-nitro-modules` ≥0.35.0. Use MMKV for React Query cache persistence, auth tokens, user preferences, and the offline mutation queue.

**expo-sqlite v55.0.x** handles structured CRM data: contacts, deals, pipeline, and drafts. SDK 55 adds a SQLite Inspector DevTools plugin, a `kv-store` drop-in replacement for AsyncStorage (with sync APIs), a `localStorage` polyfill, SQLCipher encryption support, and Drizzle ORM integration. Use SQLite when you need relational queries, joins, indexes, or full-text search across thousands of records.

**AsyncStorage v3.0.1** is the slowest option (bridge-based, async-only, 6MB default limit on Android) but works in Expo Go. Use it only for prototyping.

For TanStack Query persistence, `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` with an MMKV adapter serializes the entire query cache to disk. Set `gcTime` ≥ the persister's `maxAge` (default 24 hours) to prevent garbage collection from discarding restored cache. On app startup, `PersistQueryClientProvider` restores the cache; its `onSuccess` callback calls `resumePausedMutations()` then `invalidateQueries()` — replaying offline mutations first, then fetching fresh data.

Configure `networkMode: 'offlineFirst'` so queries fire their first request regardless of network status. If it hits the persisted cache, the app renders immediately. Failed requests pause retries until online. For conflict resolution, use **last-write-wins with timestamps** for deal stage changes (single-owner per deal), **server-wins** for dashboard metrics (read-only aggregations), and **client-wins** for email drafts (user's local edits take priority).

A realistic cache budget for a CRM with ~500 deals and ~2,000 contacts: **20–50MB total** — well within device limits. Pipeline data runs 2–5MB, contacts 5–10MB, dashboard metrics 50–200KB, React Query cache 5–20MB.

The sync architecture layers client-side MMKV/SQLite for instant access with server-side KV for fast global reads. Use ETags and `If-Modified-Since` headers for conditional requests, and a `?since=timestamp` delta sync endpoint that returns only created/updated/deleted records since the last sync.

---

## Push notifications with approve/reject action buttons

**expo-notifications v55.0.x** supports interactive notification categories with action buttons via `setNotificationCategoryAsync`. Register a `draft_review` category at app startup with three actions: Approve (opens app to foreground), Reject (fires in background, marked as destructive), and Reply (inline text input). When sending via Expo Push API from the Cloudflare Worker, include `categoryId: 'draft_review'` in the payload.

Handle action taps via `addNotificationResponseReceivedListener`. The `actionIdentifier` tells you which button was pressed; `response.userText` contains inline reply text. **Register this listener at module top-level** (not in a lifecycle method) — on iOS cold start, the notification response fires before components mount. Also call `getLastNotificationResponse()` during startup to catch the initial launch notification.

For background execution when the app is killed, `expo-task-manager` with `Notifications.registerTaskAsync()` runs a defined task on notification arrival. iOS requires `enableBackgroundRemoteNotifications: true` in the expo-notifications config plugin and limits headless background deliveries to ~2–3 per hour. Android runs the background task on action button taps even when terminated.

**Expo Push API rate limits**: 600 notifications/second per project, max 100 per request. The API is free. From Cloudflare Workers, it's a straightforward `fetch` POST to `https://exp.host/--/api/v2/push/send` — the `tomheaton/expo-push-worker` GitHub repo demonstrates the pattern. Always check push receipts (available ~15 minutes after sending) via a scheduled Cloudflare Worker Cron Trigger, and remove tokens that return `DeviceNotRegistered`.

A notable SDK 55 change: **push notifications are unavailable in Expo Go on Android** from SDK 53+. A development build is required. Local in-app notifications still work in Expo Go.

---

## JWT auth with biometric unlock

Store the **access token** (15–30 minute lifespan) in both memory and `expo-secure-store` for persistence across restarts. Store the **refresh token** (7–30 day lifespan) exclusively in SecureStore with `keychainAccessible: AFTER_FIRST_UNLOCK`. expo-secure-store v55.0.x uses iOS Keychain Services and Android SharedPreferences encrypted with the Keystore system. The historical ~2KB size limit is now soft/platform-dependent — JWTs typically fit at 500–1500 bytes.

The token refresh flow uses a request queue to handle concurrent 401 responses: when one request triggers a refresh, subsequent 401s queue rather than spawning parallel refresh calls. After the refresh completes, queued requests replay with the new token. Implement this as a custom `authFetch` wrapper that React Query's `queryFn` calls.

For **biometric unlock**, `expo-local-authentication v17.0.x` checks hardware availability, enrollment status, and supported types (fingerprint, facial recognition, iris). The `authenticateAsync()` call presents the system biometric prompt. On success, retrieve tokens from SecureStore. On failure, check the error type: `user_fallback` → show PIN/password screen, `lockout` → too many attempts. You can also use SecureStore's `requireAuthentication: true` option to gate token retrieval at the OS level — the value won't be released without biometric verification, but **keys are invalidated when biometric data changes** (e.g., new fingerprint enrolled).

On the Cloudflare Workers side, **`@tsndr/cloudflare-worker-jwt`** is purpose-built for the Workers runtime (zero dependencies, uses Web Crypto API). For more complex scenarios with JWKS rotation, **`jose`** by panva works across all runtimes including Workers. Do NOT use libraries that depend on Node.js `crypto` — they throw `TypeError: crypto2.createHmac is not a function` in Workers.

---

## Notion API: from 800ms queries to 5ms cached reads

Notion's API enforces **3 requests/second average per integration token** (2,700 calls per 15 minutes). Typical database query latency runs **200–800ms** for simple queries and **500ms–2s+** for complex filtered queries on large databases. No official p50/p95/p99 numbers are published — these are community-observed ranges.

The path to sub-1-second dashboard loads uses **Cloudflare Cron Triggers** to pre-compute aggregations every 5 minutes. A scheduled handler fetches all deals from Notion (handling pagination at `page_size: 100`), computes pipeline totals, deal counts by stage, and recent activity metrics, then writes a denormalized JSON payload to KV. The fetch handler serves this pre-computed payload directly from KV at **0.5–10ms** — a 100x improvement over live Notion queries.

```toml
# wrangler.toml
[triggers]
crons = ["*/5 * * * *"]
```

Implement **stale-while-revalidate** at the KV layer: store `updatedAt` in KV metadata, serve stale data if within the SWR window, and trigger async refresh via `ctx.waitUntil()`. As of February 2026, Cloudflare CDN also supports native async SWR for cached responses.

For incremental sync, filter by `last_edited_time` to fetch only changed records — this minimizes rate limit consumption. Use `page_size: 100` for bulk sync jobs (minimizes round-trips) and `page_size: 20–50` for user-facing queries (smaller payload, faster time-to-first-byte). Always use API-side filters rather than fetching all data and filtering locally — each unfiltered query returns all pages with pagination, wasting your rate budget.

Fallback strategies: always write to KV on successful Notion fetches, and serve last-known-good data with an `X-Data-Age` header when Notion is slow or down. Implement a circuit breaker that skips Notion entirely after N consecutive failures, serving from KV for M minutes.

---

## Multi-tenant design starts with one abstraction

The single most important preparation for multi-tenancy is a **`TenantContext` interface** that wraps all per-tenant configuration: Notion token, database IDs, KV key prefix, and role information. In phase 1 (single user), this returns hardcoded values from environment variables. In phase 2, it's extracted from JWT claims and looked up in KV or D1.

```typescript
interface TenantContext {
  tenantId: string;
  notionToken: string;
  notionDatabaseIds: { deals: string; contacts: string };
  kvPrefix: string;
}
```

All KV operations flow through a helper that prepends the tenant prefix: `kvKey(tenant, 'dashboard')` returns `'dashboard'` today and `'tenant_abc:dashboard'` tomorrow. All Notion calls use the tenant's token and database IDs. This costs almost nothing to implement now and prevents a rewrite later.

**Cloudflare D1** is GA and production-ready, with **<1ms indexed reads** and support for up to **50,000 databases per account** (requestable to millions). D1 explicitly supports database-per-tenant as a first-class pattern — each database is capped at 10GB, which is generous for per-tenant CRM data. For the early phase, a shared D1 database with a `tenant_id` column and composite indexes is simpler. Add `tenant_id` columns now even with a single default value — the migration path from single-tenant to shared-database multi-tenancy becomes a config change rather than a schema rewrite.

The recommended evolution: **Phase 1** uses env vars for all config, KV keys without prefix, single D1 database. **Phase 2** adds the TenantContext abstraction, `tenant_id` columns, and prefixed KV keys — all returning hardcoded defaults. **Phase 3** resolves tenant context dynamically from JWT claims, stores per-tenant Notion tokens in KV, and runs per-tenant Cron Trigger sync. No rewrites — just swapping the tenant resolution strategy.

---

## Conclusion

The most impactful architectural choices are the ones that prevent round-trips: **pre-computed dashboard payloads in KV** eliminate Notion's 800ms latency, **React Query cache persistence to MMKV** makes cold starts feel instant, **prefetching adjacent screens** removes navigation delays, and **optimistic updates** make approve/reject feel zero-latency. The entire stack runs on **$5/month** (Workers paid plan) with sub-10ms edge responses.

Three non-obvious findings stand out. First, `expo/fetch` in SDK 55 provides native `ReadableStream` support that makes raw fetch-based SSE viable — but `react-native-sse` v1.2.1 remains more battle-tested for production AI streaming. Second, react-native-reanimated v4's worklet-based gestures run entirely on the UI thread, making 60fps swipe cards achievable without any bridge overhead — but you must render only 2–3 cards in the stack and defer JS callbacks via `runOnJS()` until after animation completes. Third, the `TenantContext` abstraction costs perhaps 20 lines of code today but saves a complete rewrite when the second user signs up — embed it from day one.