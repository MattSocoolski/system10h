# React Native performance playbook for Expo SDK 55

**Your 5-screen iPhone app has nine concrete problems — every one of them is solvable with specific packages, configurations, and code changes available today.** Expo SDK 55 ships with React Native 0.83, React 19.2, and mandatory New Architecture (Fabric + TurboModules). This means FlashList v2's JS-only recycling hits **60 FPS** where FlatList drops to 9, MMKV's synchronous storage is **20× faster** than AsyncStorage for offline cache, and Reanimated 4's CSS Animations API can drive skeleton shimmers entirely on the UI thread. Below is the complete implementation guide — every code snippet is TypeScript, every package is Expo SDK 55-compatible, and every benchmark comes from published measurements.

---

## 1. New Architecture is no longer optional — and that changes your list strategy

Expo SDK 55 removed the `newArchEnabled` flag entirely. Fabric and TurboModules are always on. The practical impact: **20–40% faster startup**, **20–30% lower memory** from lazy TurboModule loading, and Hermes V1 (opt-in) delivers **9% faster bundle loading** on iOS. No configuration is needed — just make sure your dependencies support New Architecture by running `npx expo-doctor@latest`.

```jsonc
// app.json — SDK 55 (New Architecture is automatic, no flag needed)
{
  "expo": {
    "jsEngine": "hermes",
    "plugins": [
      ["expo-build-properties", {
        "ios": { "useHermesV1": true },
        "android": { "useHermesV1": true }
      }]
    ]
  }
}
```

### FlashList v2 replaces your ScrollView for the Drafts list

Your drafts list using ScrollView renders everything at once — the primary cause of slowness at 20+ items. FlashList v2 (New Architecture only, production-ready since July 2025) uses JS-only view recycling and **no longer requires `estimatedItemSize`**. The benchmarks speak for themselves:

| Metric | ScrollView | FlatList | FlashList v2 |
|--------|-----------|----------|-------------|
| JS Thread FPS (Moto G10) | N/A (all rendered) | ~9 FPS | **60 FPS** |
| Blank area while scrolling | None (all in memory) | High | **50% less than v1** |
| Memory at 100 items | All views in memory | Creates/destroys | **Fixed recycling pool** |

```bash
npx expo install @shopify/flash-list
```

```typescript
// DraftsList.tsx — replaces ScrollView with FlashList v2
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Draft {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  type: 'text' | 'image' | 'link';
}

const DraftItem = React.memo(({ item, onPress }: { item: Draft; onPress: (id: string) => void }) => (
  <Pressable style={styles.draftItem} onPress={() => onPress(item.id)}>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.preview} numberOfLines={2}>{item.preview}</Text>
    <Text style={styles.date}>{item.updatedAt}</Text>
  </Pressable>
));

export function DraftsList({ drafts, onDraftPress }: { drafts: Draft[]; onDraftPress: (id: string) => void }) {
  const handlePress = useCallback((id: string) => onDraftPress(id), [onDraftPress]);
  
  return (
    <FlashList
      data={drafts}
      renderItem={({ item }) => <DraftItem item={item} onPress={handlePress} />}
      keyExtractor={(item) => item.id}
      getItemType={(item) => item.type}  // Optimizes recycling pools
      drawDistance={250}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.5}
    />
  );
}
```

**When to use which list:** FlatList is fine for <50 static items. FlashList v2 is the default choice for anything with 20+ items or any scrolling performance concerns. RecyclerListView is effectively superseded — FlashList was built by the same engineer (Naman Goel) at Shopify as its successor.

### React Compiler eliminates memoization bikeshedding

React Compiler v1.0 (October 2025) auto-memoizes components, values, and functions at build time. Enable it in Expo SDK 55 and stop manually wrapping everything in `useMemo`/`useCallback`:

```bash
npx expo install babel-plugin-react-compiler
```

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['babel-plugin-react-compiler']],
  };
};
```

**The rule of thumb for 2025-2026**: With React Compiler enabled, remove most manual `useMemo`/`useCallback` calls. The only exceptions where manual memoization still matters: `React.memo` on FlashList `renderItem` components (the compiler doesn't always optimize list item re-renders correctly), and `useCallback` for refs passed to native modules.

### Bundle size target: 2–4 MB JS for your 5-screen app

Enable tree shaking and `inlineRequires` in Metro, use `expo-image` instead of RN's Image, and cherry-pick imports from utility libraries:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});
module.exports = config;
```

```bash
# Enable tree shaking for production builds
EXPO_UNSTABLE_TREE_SHAKING=1 npx expo export --platform ios

# Analyze your bundle
EXPO_UNSTABLE_ATLAS=true npx expo start  # Then Shift+M → "Open expo-atlas"
```

Replace `moment` with `date-fns` (saves ~1 MB), use `lodash-es` with tree shaking instead of `lodash`, and import icons individually (`import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'`). Shopify cut their bundle from **12 MB to 3.1 MB** with these techniques — a 74% reduction.

---

## 2. Skeleton loaders that match your layout and load progressively

Your spinner "Loading..." should be replaced with content-aware skeletons that mirror each screen's layout. Three packages work with Expo SDK 55 + Reanimated 4, each optimized for different needs:

| Package | Bundle | Best For | FPS |
|---------|--------|----------|-----|
| `moti/skeleton` | ~20 KB | Best DX, `Skeleton.Group` API | 60 |
| `react-native-fast-shimmer` (Callstack) | ~5 KB | Many simultaneous shimmers | 60 |
| `react-native-css-animations` (Software Mansion) | ~2 KB | Minimal, Reanimated 4 native | 60 |

**Recommended**: `moti/skeleton` for your app — best developer experience, automatic dark mode, and the `Skeleton.Group` API controls all bones with a single `show` prop.

```bash
npx expo install moti react-native-reanimated expo-linear-gradient
```

### Content-aware skeletons for each screen

The key principle: share layout constants between your real component and its skeleton, so dimensions always match and there's zero layout shift.

```typescript
// components/DraftItemSkeleton.tsx
import { Skeleton } from 'moti/skeleton';
import { View, useColorScheme, StyleSheet } from 'react-native';

const LAYOUT = {
  iconSize: 40, iconRadius: 8,
  titleWidth: '70%', titleHeight: 16,
  subtitleWidth: '40%', subtitleHeight: 12,
};

export function DraftItemSkeleton() {
  const colorMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <Skeleton.Group show={true}>
      <View style={styles.container}>
        <Skeleton colorMode={colorMode} width={LAYOUT.iconSize} height={LAYOUT.iconSize} radius={LAYOUT.iconRadius} />
        <View style={styles.content}>
          <Skeleton colorMode={colorMode} width={LAYOUT.titleWidth} height={LAYOUT.titleHeight} />
          <Skeleton colorMode={colorMode} width={LAYOUT.subtitleWidth} height={LAYOUT.subtitleHeight} />
        </View>
      </View>
    </Skeleton.Group>
  );
}

export function DraftsListSkeleton({ count = 5 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <DraftItemSkeleton key={i} />)}</>;
}

// Dashboard skeleton
export function DashboardSkeleton() {
  const colorMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <Skeleton.Group show={true}>
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton colorMode={colorMode} width={80} height={32} />
            <Skeleton colorMode={colorMode} width={60} height={14} />
          </View>
        ))}
      </View>
      <Skeleton colorMode={colorMode} width="100%" height={200} radius={12} />
      {[1, 2, 3].map((i) => <DraftItemSkeleton key={i} />)}
    </Skeleton.Group>
  );
}
```

### Progressive loading with TanStack Query

The pattern `skeleton → stale data → fresh data` is built into TanStack Query v5 via `placeholderData` and `keepPreviousData`:

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';

function useDrafts(folderId: string) {
  return useQuery({
    queryKey: ['drafts', folderId],
    queryFn: () => fetchDrafts(folderId),
    placeholderData: keepPreviousData,  // Show previous folder's data while new loads
  });
}

function DraftsScreen({ folderId }: { folderId: string }) {
  const { data, isPending, isPlaceholderData, isFetching } = useDrafts(folderId);

  // First load ever → skeleton
  if (isPending) return <DraftsListSkeleton count={5} />;

  return (
    <View style={[isPlaceholderData && { opacity: 0.6 }]}>
      <FlashList
        data={data}
        renderItem={({ item }) => <DraftItem draft={item} />}
        getItemType={(item) => item.type}
      />
      {isFetching && <ActivityIndicator style={styles.inlineLoader} />}
    </View>
  );
}
```

The three loading states are: `isPending` (no data yet — show skeleton), `isPlaceholderData` (stale data shown dimmed while fetching), and `isFetching` with data present (show data with subtle inline spinner). This eliminates the jarring "Loading..." spinner entirely.

For a custom zero-dependency shimmer using Reanimated 4's CSS Animations:

```typescript
import Animated from 'react-native-reanimated';
import { pulse } from 'react-native-css-animations';

function SkeletonBone({ width, height, radius = 8 }) {
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E1E9EE' },
        pulse,  // Runs entirely on UI thread — 60 FPS guaranteed
      ]}
    />
  );
}
```

---

## 3. Shared element transitions: two viable paths, one dead end

**`react-native-shared-element` was archived on March 17, 2025** — do not use it. It doesn't support Fabric, Expo Router, or New Architecture. Two alternatives exist for Expo SDK 55:

- **Reanimated `sharedTransitionTag`** — experimental in Reanimated 4.2.0+, works cross-platform, requires feature flag
- **Expo Router Zoom Transitions** — alpha API in SDK 55, iOS 18+ only, fully native UIKit transitions

### Reanimated shared transitions with Expo Router

Enable the feature flag in `package.json`:

```json
{
  "react-native-reanimated": {
    "ENABLE_SHARED_ELEMENT_TRANSITIONS": true
  }
}
```

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Drafts' }} />
      <Stack.Screen name="draft/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
```

```typescript
// app/index.tsx — List screen with shared transition tags
import Animated from 'react-native-reanimated';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

export default function DraftsList() {
  return (
    <FlashList
      data={drafts}
      renderItem={({ item }) => (
        <Link href={`/draft/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <Animated.Image
              source={{ uri: item.thumbnail }}
              style={styles.cardImage}
              sharedTransitionTag={`image-${item.id}`}
            />
            <Animated.Text
              style={styles.cardTitle}
              sharedTransitionTag={`title-${item.id}`}
            >
              {item.title}
            </Animated.Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
```

```typescript
// app/draft/[id].tsx — Detail screen with matching tags
import Animated, { FadeIn, SharedTransition } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';

const transition = SharedTransition.duration(500).springify();

export default function DraftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const draft = useDraft(id);

  return (
    <ScrollView>
      <Animated.Image
        source={{ uri: draft.thumbnail }}
        style={styles.hero}
        sharedTransitionTag={`image-${id}`}
        sharedTransitionStyle={transition}
      />
      <Animated.Text style={styles.title} sharedTransitionTag={`title-${id}`}>
        {draft.title}
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(300)} style={styles.body}>
        {draft.content}
      </Animated.Text>
    </ScrollView>
  );
}
```

**iOS interactive swipe-back is automatic** — Reanimated runs a progress-based transition that follows the user's finger during the native back swipe gesture. No additional code needed. Known limitation: `backgroundColor` cannot animate during progress-based transitions.

### Expo Router Zoom Transitions for iOS 18+

This is the more native-feeling option for iOS, using UIKit's built-in zoom transition:

```typescript
// app/index.tsx
import { Link } from 'expo-router';
import { Image } from 'expo-image';

<Link href={`/draft/${item.id}`} asChild>
  <Pressable>
    <Link.AppleZoom>
      <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
    </Link.AppleZoom>
  </Pressable>
</Link>

// app/draft/[id].tsx
<Link.AppleZoomTarget>
  <Image source={{ uri: draft.thumbnail }} style={styles.hero} />
</Link.AppleZoomTarget>
```

**Recommendation**: Use Zoom Transitions for the iOS-native feel on iOS 18+. Use Reanimated `sharedTransitionTag` as the cross-platform fallback. If both are too experimental for production, use entering/exiting animations (`ZoomIn.springify()`, `SlideInUp`, `FadeIn.delay(300)`) as a visually similar effect that's fully stable.

---

## 4. Offline-first architecture with MMKV and TanStack Query

Your app fires an API call on every render because there's no cache layer. The fix is TanStack Query v5 with `persistQueryClient` backed by MMKV — **20× faster** reads/writes than AsyncStorage.

| Operation | AsyncStorage | MMKV | Winner |
|-----------|-------------|------|--------|
| Single read | ~2.5 ms | ~0.5 ms | MMKV (5×) |
| Single write | ~2.9 ms | ~0.6 ms | MMKV (5×) |
| 1000 reads (iPhone 11 Pro) | Benchmark baseline | **20× faster** | MMKV |

```bash
npx expo install react-native-mmkv react-native-nitro-modules @tanstack/react-query \
  @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister \
  @react-native-community/netinfo
npx expo prebuild  # MMKV requires native modules
```

### Complete offline setup

```typescript
// lib/mmkv.ts — MMKV sync storage adapter
import { createMMKV } from 'react-native-mmkv';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const storage = createMMKV({ id: 'query-cache' });

export const persister = createSyncStoragePersister({
  storage: {
    setItem: (key: string, value: string) => storage.set(key, value),
    getItem: (key: string) => storage.getString(key) ?? null,
    removeItem: (key: string) => storage.delete(key),
  },
  throttleTime: 1000,
});
```

```typescript
// providers/QueryProvider.tsx
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import NetInfo from '@react-native-community/netinfo';
import { persister } from '@/lib/mmkv';
import { useEffect, type PropsWithChildren } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,     // 24h — MUST be >= persister maxAge
      staleTime: 1000 * 60 * 5,         // 5 min default
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      onlineManager.setOnline(!!state.isConnected);
    });
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
      onSuccess={() =>
        queryClient.resumePausedMutations()
          .then(() => queryClient.invalidateQueries())
      }
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

### Tiered staleTime per data type

Different endpoints need different caching strategies. Dashboard stats should refresh every 30 seconds; user profile data can stay cached for 24 hours:

```typescript
// Frequently changing — dashboard stats, draft count
export const useDashboardStats = () => useQuery({
  queryKey: ['dashboard', 'stats'],
  queryFn: fetchDashboardStats,
  staleTime: 1000 * 30,           // 30 seconds
  refetchInterval: 1000 * 60,     // poll every 60s when app active
});

// Semi-static — draft list, pipeline items
export const useDrafts = () => useQuery({
  queryKey: ['drafts'],
  queryFn: fetchDrafts,
  staleTime: 1000 * 60 * 5,       // 5 minutes
  gcTime: 1000 * 60 * 60,         // 1 hour
});

// Static — user profile, app config
export const useUserProfile = (id: string) => useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchProfile(id),
  staleTime: 1000 * 60 * 60 * 24, // 24 hours
});
```

### Offline mutation queue for approvals

When users approve items offline, mutations queue automatically and replay when connectivity returns:

```typescript
// mutations/approvals.ts
import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';

// Register at app startup — required for persistence across app restarts
export function registerMutationDefaults(queryClient: QueryClient) {
  queryClient.setMutationDefaults(['approveItem'], {
    mutationFn: async ({ itemId, approved }: { itemId: string; approved: boolean }) =>
      api.post(`/items/${itemId}/approve`, { approved }),
    retry: 3,
    scope: { id: 'approval-queue' },  // Serial execution — no race conditions
  });
}

// Hook for components
export function useApproveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['approveItem'],
    onMutate: async ({ itemId, approved }) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const previous = queryClient.getQueryData(['items']);

      queryClient.setQueryData(['items'], (old: any[]) =>
        old?.map((item) =>
          item.id === itemId ? { ...item, approved, _optimistic: true } : item
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['items'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
```

The `scope: { id: 'approval-queue' }` ensures offline approvals execute sequentially when connectivity returns — critical for operations where order matters. The `PersistQueryClientProvider`'s `onSuccess` callback calls `resumePausedMutations()` which replays the entire queue, then `invalidateQueries()` refreshes everything with server truth.

---

## 5. Tab badges without polling and an infinite activity feed

### Drafts tab badge in Expo Router

The badge uses `tabBarBadge` in Expo Router's `<Tabs>` layout, driven by a Zustand store for instant updates:

```typescript
// stores/draftStore.ts
import { create } from 'zustand';

interface DraftState {
  draftCount: number;
  setDraftCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  draftCount: 0,
  setDraftCount: (count) => set({ draftCount: count }),
  increment: () => set((s) => ({ draftCount: s.draftCount + 1 })),
  decrement: () => set((s) => ({ draftCount: Math.max(0, s.draftCount - 1) })),
}));
```

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDraftStore } from '@/stores/draftStore';

export default function TabLayout() {
  const draftCount = useDraftStore((s) => s.draftCount);

  return (
    <Tabs screenOptions={{
      tabBarBadgeStyle: { backgroundColor: '#FF3B30', color: '#fff', fontSize: 11 },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
      }} />
      <Tabs.Screen name="drafts" options={{
        title: 'Drafts',
        tabBarIcon: ({ color, size }) => <Ionicons name="document-text" color={color} size={size} />,
        tabBarBadge: draftCount > 0 ? draftCount : undefined,
      }} />
      <Tabs.Screen name="pipeline" options={{
        title: 'Pipeline',
        tabBarIcon: ({ color, size }) => <Ionicons name="funnel" color={color} size={size} />,
      }} />
    </Tabs>
  );
}
```

### Push-triggered refresh beats polling

For ~100 users, **push-triggered query invalidation** is the best approach — minimal battery impact, near-real-time, and zero server cost with Expo Push Service. WebSocket has higher battery drain from persistent connections; short-interval polling hammers both battery and server.

```bash
npx expo install expo-notifications expo-task-manager expo-device
```

```jsonc
// app.json — enable background notifications
{
  "expo": {
    "plugins": [
      ["expo-notifications", { "enableBackgroundRemoteNotifications": true }]
    ]
  }
}
```

```typescript
// hooks/usePushInvalidation.ts
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useDraftStore } from '@/stores/draftStore';
import { useEffect } from 'react';

export function usePushInvalidation() {
  const queryClient = useQueryClient();
  const setDraftCount = useDraftStore((s) => s.setDraftCount);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;

      if (data?.type === 'draft_created' || data?.type === 'draft_updated') {
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
        if (data?.badgeCount !== undefined) setDraftCount(data.badgeCount);
      }
      if (data?.type === 'activity_update') {
        queryClient.invalidateQueries({ queryKey: ['activity'] });
      }
    });
    return () => sub.remove();
  }, [queryClient, setDraftCount]);
}
```

Server-side silent push payload (updates badge without showing a notification):

```json
{
  "to": "ExponentPushToken[xxxxx]",
  "data": { "type": "draft_created", "badgeCount": 3 },
  "_contentAvailable": true,
  "priority": "normal",
  "badge": 3
}
```

The `badge: 3` field in the payload updates the iOS app icon badge natively without even running JavaScript. The `_contentAvailable: true` wakes the app to fire the notification listener, which then invalidates TanStack Query caches and updates the Zustand store — the tab badge reflects the new count instantly.

### Activity feed infinite scroll with useInfiniteQuery

Replace the hardcoded 5-item limit with cursor-based pagination:

```typescript
// screens/ActivityFeed.tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useCallback } from 'react';
import { RefreshControl, View, Text, ActivityIndicator } from 'react-native';

export default function ActivityFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['activity'],
      queryFn: ({ pageParam }) =>
        fetch(pageParam ? `/api/activity?cursor=${pageParam}&limit=20` : `/api/activity?limit=5`)
          .then((r) => r.json()),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
      staleTime: 30_000,
    });

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <ActivityFeedSkeleton count={5} />;

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      estimatedItemSize={80}
      renderItem={({ item }) => <ActivityItem item={item} />}
      onEndReachedThreshold={0.3}
      onEndReached={handleEndReached}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null}
    />
  );
}
```

---

## 6. Client-side fuzzy search with filter chips for Pipeline

For <1,000 pipeline items, **client-side search with Fuse.js is instant** — under 1ms per query with no network dependency. No debounce needed for local data. The bundle cost is only **6.2 KB gzipped**.

| Library | Bundle | Search time (1000 items) | Fuzzy matching |
|---------|--------|--------------------------|----------------|
| Fuse.js | 6.2 KB | <1 ms | Weighted keys, typo tolerance |
| MiniSearch | 7.5 KB | <0.5 ms | Prefix, inverted index |
| FlexSearch | 6–25 KB | <0.3 ms | Contextual, complex API |

```bash
npx expo install fuse.js
```

### Combined search + filter chips with AND logic

```typescript
// hooks/usePipelineSearch.ts
import Fuse, { IFuseOptions } from 'fuse.js';
import { useMemo, useState, useCallback } from 'react';

interface PipelineItem {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'closed' | 'won';
  assignee: string;
  value: number;
}

const fuseOptions: IFuseOptions<PipelineItem> = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'assignee', weight: 0.2 },
    { name: 'status', weight: 0.1 },
  ],
  threshold: 0.3,
  minMatchCharLength: 2,
  includeScore: true,
};

export function usePipelineSearch(items: PipelineItem[]) {
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('all');

  // Step 1: filter by status chip
  const statusFiltered = useMemo(
    () => activeStatus === 'all' ? items : items.filter((i) => i.status === activeStatus),
    [items, activeStatus]
  );

  // Step 2: fuzzy search within filtered set
  const fuse = useMemo(() => new Fuse(statusFiltered, fuseOptions), [statusFiltered]);

  const results = useMemo(() => {
    if (!query.trim()) return statusFiltered;
    return fuse.search(query).map((r) => r.item);
  }, [fuse, query, statusFiltered]);

  return { query, setQuery, activeStatus, setActiveStatus, results, total: items.length };
}
```

### iOS-style animated search bar

```typescript
// components/AnimatedSearchBar.tsx
import { useRef, useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, Keyboard, Platform, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export function AnimatedSearchBar({ value, onChangeText, placeholder = 'Search pipeline...' }) {
  const inputRef = useRef<TextInput>(null);
  const expansion = useSharedValue(0);

  const handleFocus = useCallback(() => {
    expansion.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, []);

  const handleCancel = useCallback(() => {
    onChangeText('');
    Keyboard.dismiss();
    expansion.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
  }, [onChangeText]);

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: expansion.value,
    width: interpolate(expansion.value, [0, 1], [0, 60]),
    marginLeft: interpolate(expansion.value, [0, 1], [0, 8]),
  }));

  return (
    <View style={styles.row}>
      <View style={styles.inputWrapper}>
        <Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 6 }} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => { onChangeText(''); inputRef.current?.focus(); }}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      <Animated.View style={cancelStyle}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={{ fontSize: 17, color: '#007AFF' }}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8 },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? '#E5E5EA' : '#F0F0F0',
    borderRadius: 10, paddingHorizontal: 8, height: 36,
  },
  input: { flex: 1, fontSize: 17, color: '#000', paddingVertical: 0 },
});
```

**Debounce guidelines**: For local Fuse.js search, don't debounce at all — the computation costs under 1 ms and `useDeferredValue` handles render prioritization. For API search, use a **300 ms debounce** (Algolia's research confirms anything above 300 ms degrades perceived responsiveness):

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

---

## Fixing the haptic feedback bug

Your code audit found a recursive call instead of using the Haptics API. The fix:

```bash
npx expo install expo-haptics
```

```typescript
// Before (bug — recursive call)
// function triggerHaptic() { triggerHaptic(); }  // ← infinite recursion

// After (correct)
import * as Haptics from 'expo-haptics';

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// For selection feedback (lighter)
Haptics.selectionAsync();

// For success/error notifications
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

## Complete package manifest

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~55.0.0 | Core SDK |
| `@shopify/flash-list` | ^2.0.0 | High-performance lists |
| `react-native-reanimated` | ~4.2.0 | Animations, shared transitions, skeletons |
| `moti` | ^0.30.0 | Skeleton loaders |
| `@tanstack/react-query` | ^5.x | Data fetching, caching, offline |
| `@tanstack/react-query-persist-client` | ^5.x | Cache persistence |
| `@tanstack/query-sync-storage-persister` | ^5.x | MMKV sync adapter |
| `react-native-mmkv` | ^4.3.0 | Fast key-value storage |
| `@react-native-community/netinfo` | ^11.x | Network state detection |
| `expo-notifications` | ~0.31.x | Push notifications, badge |
| `expo-haptics` | ~14.x | Haptic feedback |
| `fuse.js` | ^7.1.0 | Client-side fuzzy search |
| `zustand` | ^5.x | Lightweight state (~1 KB) |
| `babel-plugin-react-compiler` | latest | Auto-memoization |
| `expo-image` | ~2.1.0 | Optimized image component |

## Conclusion

The highest-impact change is replacing ScrollView with FlashList v2 for the drafts list — a single-component swap that takes JS thread performance from unusable to **60 FPS**. The second-highest is adding `PersistQueryClientProvider` with MMKV, which eliminates redundant API calls on every render and enables offline browsing for free. Skeleton loaders using `moti/skeleton` or Reanimated 4's CSS Animations are a visual-polish win that takes under an hour to implement per screen. For shared element transitions, Expo Router Zoom Transitions give the most native iOS feel, but Reanimated's `sharedTransitionTag` is the cross-platform option — both remain experimental, so entering/exiting animations are the production-safe fallback. Push-triggered query invalidation solves the tab badge problem without battery-draining polling. And Fuse.js delivers instant, fuzzy, offline-capable search for under 7 KB of bundle weight — paired with your existing filter chips using AND logic, it completes the Pipeline screen without any server-side search infrastructure.