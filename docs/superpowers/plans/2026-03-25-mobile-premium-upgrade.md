# System 10H Mobile — Premium iPhone Upgrade

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the System 10H mobile app from functional MVP to premium iPhone experience — visual polish, performance, and UX upgrades.

**Architecture:** Expo SDK 55 + React Native 0.83 + TypeScript. Design token system (Colors.ts), Phosphor Icons, spring animations (Reanimated 4), FlashList v2, MMKV offline cache, Fuse.js search. No new screens — upgrade existing 5 screens.

**Tech Stack:** Expo Router, TanStack React Query v5, Zustand, React Native Reanimated 4, @shopify/flash-list v2, phosphor-react-native, moti/skeleton, react-native-mmkv, fuse.js, expo-haptics

**Source references:**
- Audit: Full codebase scan 25.03.2026 (Opus 4.6)
- DR1: materialy/2026-03-25_DR1_premium_dark_ui.md
- DR2: materialy/2026-03-25_DR2_ux_patterns_crm_email.md
- DR4: materialy/2026-03-25_DR4_rn_performance_polish.md

**Codebase location:** `system10h/mobile/`

---

## File Map

### New files
- `constants/tokens.ts` — design token system (colors, spacing, typography, springs)
- `components/ui/PressableScale.tsx` — universal spring-press wrapper
- `components/ui/SkeletonScreen.tsx` — skeleton loaders per screen
- `components/ui/AnimatedSearchBar.tsx` — iOS-style search for Pipeline
- `components/ui/ConfidenceBadge.tsx` — AI confidence tier indicator
- `lib/mmkv.ts` — MMKV storage adapter for TanStack Query persistence
- `lib/haptics.ts` — centralized haptic feedback helper
- `hooks/usePipelineSearch.ts` — Fuse.js search + filter chips
- `stores/draftStore.ts` — Zustand store for draft count (tab badge)

### Modified files
- `constants/Colors.ts` — replace with import from tokens.ts (backward compat)
- `app/_layout.tsx` — add QueryProvider with persistence, push invalidation
- `app/(tabs)/_layout.tsx` — Phosphor icons, tab badge, updated colors
- `app/(tabs)/index.tsx` — Dashboard: tokens, skeletons, PressableScale, icons
- `app/(tabs)/pipeline.tsx` — Pipeline: search bar, tokens, icons, FlashList tuning
- `app/(tabs)/drafts.tsx` — Drafts: FlashList v2 (replace ScrollView), 4-zone swipe, confidence badge, haptics fix
- `app/draft/[id].tsx` — Draft detail: tokens, icons, confidence
- `app/lead/[id].tsx` — Lead detail: tokens, icons, PressableScale
- `app.json` — enable background notifications
- `babel.config.js` — React Compiler plugin
- `metro.config.js` — tree shaking, inline requires
- `package.json` — new dependencies

---

## Phase 1: Design Foundation (Day 1-3)

### Task 1: Install dependencies

**Files:**
- Modify: `system10h/mobile/package.json`

- [ ] **Step 1: Install all new packages**

```bash
cd system10h/mobile
npx expo install phosphor-react-native react-native-svg moti expo-linear-gradient \
  react-native-mmkv @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister \
  @react-native-community/netinfo fuse.js expo-haptics babel-plugin-react-compiler
```

- [ ] **Step 2: Update metro.config.js for tree shaking**

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

- [ ] **Step 3: Add React Compiler to babel.config.js**

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

- [ ] **Step 4: Verify app starts**

Run: `cd system10h/mobile && npx expo start --clear`
Expected: App launches without errors in Expo Go

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json metro.config.js babel.config.js
git commit -m "chore: install design system + performance dependencies"
```

---

### Task 2: Design token system

**Files:**
- Create: `system10h/mobile/constants/tokens.ts`
- Modify: `system10h/mobile/constants/Colors.ts`

- [ ] **Step 1: Create tokens.ts with full design system**

```typescript
// constants/tokens.ts — Single source of truth for all design values
// Source: DR1 (premium dark UI audit, 25.03.2026)

// === COLORS ===

export const colors = {
  // Backgrounds (7 levels — from deepest to highest)
  bg: {
    sunken:       '#080E1C',  // Input wells, inset areas
    base:         '#0F172A',  // Page background
    surface:      '#1E293B',  // Cards, sections
    surfaceHover: '#263244',  // Card hover/press states
    elevated:     '#334155',  // Active elements, inputs
    overlay:      '#3B4D66',  // Dropdowns, popovers, sheets
    highest:      '#475569',  // Tooltips, toasts
  },

  // Text (4 levels)
  text: {
    primary:   '#F1F5F9',  // 16.3:1 on base — main content
    secondary: '#CBD5E1',  // 12.0:1 on base — descriptions
    tertiary:  '#94A3B8',  // 6.96:1 on base — metadata
    muted:     '#64748B',  // 4.6:1 on base — hints, disabled
  },

  // Brand purple (FIXED: #A855F7 fails WCAG AA on cards)
  accent: {
    default:    '#C084FC',  // AA on all surfaces — text, UI elements
    decorative: '#A855F7',  // Large fills, glows, gradients only
    hover:      '#D8B4FE',  // Hover/active states
    muted:      'rgba(168,85,247,0.15)',  // Badge backgrounds
  },

  // Semantic
  success:   '#4ADE80',  // AAA on base
  danger:    '#FCA5A5',  // AA on elevated (was #F87171)
  warning:   '#FCD34D',  // Consistent across surfaces (was #FBBF24)
  info:      '#93C5FD',  // AA on elevated (was #60A5FA)

  // Semantic muted backgrounds (12% opacity tints)
  successMuted: 'rgba(74,222,128,0.12)',
  dangerMuted:  'rgba(248,113,113,0.12)',
  warningMuted: 'rgba(251,191,36,0.12)',
  infoMuted:    'rgba(96,165,250,0.12)',

  // Metric chip backgrounds
  chip: {
    overdue: '#7F1D1D',
    drafts:  '#2E1065',
    closed:  '#14532D',
  },

  // Borders (opacity-based, works on any surface)
  border: {
    subtle:  'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
    strong:  'rgba(255,255,255,0.16)',
  },

  // Status dots
  status: {
    active:     '#4ADE80',
    nurture:    '#FBBF24',
    frozen:     '#6b7280',
    closedWon:  '#C084FC',
    closedLost: '#FCA5A5',
  },

  // Swipe actions
  swipe: {
    approve: '#16a34a',
    reject:  '#dc2626',
  },

  // Source badges
  source: {
    autopilot:     '#C084FC',
    autopilotBg:   'rgba(168,85,247,0.2)',
    ghost:         '#93C5FD',
    ghostBg:       'rgba(96,165,250,0.2)',
    manual:        '#94A3B8',
    manualBg:      'rgba(148,163,184,0.2)',
  },
} as const;

// === TYPOGRAPHY (Apple HIG aligned) ===

export const typography = {
  size: {
    caption2:    11,  // Timestamps, tiny badges
    caption1:    12,  // Metadata, tertiary info
    footnote:    13,  // Explanatory text
    subheadline: 15,  // Descriptions, secondary
    callout:     16,  // Emphasized secondary
    body:        17,  // Primary body (DEFAULT)
    title3:      20,  // Section headers
    title2:      22,  // Medium titles
    title1:      28,  // Large titles
    largeTitle:  34,  // Screen hero titles
  },
  weight: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,  // Display sizes 28pt+ only
  },
  lineHeight: {
    tight:  20,
    normal: 24,
    loose:  28,
  },
} as const;

// === SPACING (4pt grid, no 10px) ===

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// === RADIUS ===

export const radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
} as const;

// === SPRING CONFIGS (Reanimated 4) ===

export const springs = {
  buttonPress: { mass: 0.2, damping: 15, stiffness: 150, overshootClamping: true },
  cardSwipe:   { mass: 1, damping: 15, stiffness: 100, overshootClamping: false },
  sheetPresent:{ mass: 1, damping: 20, stiffness: 150, overshootClamping: false },
  tabIndicator:{ mass: 0.5, damping: 20, stiffness: 200, overshootClamping: true },
  bouncyPop:   { mass: 1, damping: 5, stiffness: 170, overshootClamping: false },
  snappy:      { mass: 0.3, damping: 20, stiffness: 250, overshootClamping: true },
} as const;

export const scale = {
  primaryButton:   0.95,
  secondaryButton: 0.97,
  cardPress:       0.98,
  iconButton:      0.90,
} as const;

// === TIMING ===

export const timing = {
  fade:      200,
  quickFade: 150,
  standard:  300,
  shimmer:   1500,
} as const;

// === ICON SIZES ===

export const iconSize = {
  tabBar:     24,
  listItem:   20,
  navHeader:  22,
  inline:     16,
  feature:    32,
  emptyState: 48,
} as const;
```

- [ ] **Step 2: Update Colors.ts as backward-compat wrapper**

Read `system10h/mobile/constants/Colors.ts` first, then replace with:

```typescript
// constants/Colors.ts — backward compatibility wrapper
// All values now come from tokens.ts
import { colors } from './tokens';

const tintColorLight = colors.accent.default;
const tintColorDark = colors.accent.default;

export default {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: colors.text.primary,
    background: colors.bg.base,
    tint: tintColorDark,
    tabIconDefault: colors.text.muted,
    tabIconSelected: tintColorDark,
  },
};
```

- [ ] **Step 3: Verify app compiles with new tokens**

Run: `cd system10h/mobile && npx expo start --clear`

- [ ] **Step 4: Commit**

```bash
git add constants/tokens.ts constants/Colors.ts
git commit -m "feat: design token system — 7 bg levels, fixed purple a11y, Apple HIG typography"
```

---

### Task 3: Haptics helper + PressableScale component

**Files:**
- Create: `system10h/mobile/lib/haptics.ts`
- Create: `system10h/mobile/components/ui/PressableScale.tsx`

- [ ] **Step 1: Create centralized haptics helper**

```typescript
// lib/haptics.ts — Centralized haptic feedback (fixes recursive bug from audit)
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  light: () => isNative && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => isNative && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => isNative && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  selection: () => isNative && Haptics.selectionAsync(),
  success: () => isNative && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => isNative && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => isNative && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
```

- [ ] **Step 2: Create PressableScale component**

```typescript
// components/ui/PressableScale.tsx — Universal spring-press with haptic
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springs, scale as scaleValues } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends PressableProps {
  scaleValue?: number;
  hapticType?: 'light' | 'selection' | 'none';
}

export function PressableScale({
  children,
  scaleValue = scaleValues.cardPress,
  hapticType = 'light',
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        pressed.value = withSpring(scaleValue, springs.buttonPress);
        if (hapticType !== 'none') haptic[hapticType]();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(1, springs.buttonPress);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/haptics.ts components/ui/PressableScale.tsx
git commit -m "feat: PressableScale + haptics helper — spring press + haptic on every tap"
```

---

### Task 4: Phosphor Icons — replace emoji throughout

**Files:**
- Modify: `system10h/mobile/app/(tabs)/_layout.tsx` — tab bar icons
- Modify: `system10h/mobile/app/(tabs)/index.tsx` — dashboard icons
- Modify: `system10h/mobile/app/(tabs)/pipeline.tsx` — pipeline icons
- Modify: `system10h/mobile/app/(tabs)/drafts.tsx` — draft icons
- Modify: `system10h/mobile/app/lead/[id].tsx` — lead detail icons
- Modify: `system10h/mobile/app/draft/[id].tsx` — draft detail icons

- [ ] **Step 1: Replace tab bar emoji with Phosphor**

Read `app/(tabs)/_layout.tsx`. Replace emoji tab icons with Phosphor:
- Dashboard: `<ChartBar weight={focused ? 'fill' : 'regular'} />`
- Pipeline: `<Funnel weight={focused ? 'fill' : 'regular'} />`
- Drafts: `<EnvelopeSimple weight={focused ? 'fill' : 'regular'} />`

Import: `import { ChartBar, Funnel, EnvelopeSimple } from 'phosphor-react-native';`

Tab bar colors: active = `colors.accent.default` (#C084FC), inactive = `colors.text.muted` (#64748B). Size = 24.

- [ ] **Step 2: Replace emoji in Dashboard screen**

Read `app/(tabs)/index.tsx`. Replace all emoji with Phosphor icons:
- Overdue section: `<Warning weight="fill" color={colors.danger} size={20} />`
- Activity icons: `<CheckCircle />` (approved), `<XCircle />` (rejected), `<ArrowsClockwise />` (updated)
- Metric chips: `<Clock />` (overdue), `<EnvelopeSimple />` (drafts), `<Trophy />` (closed)
- Action buttons: `<PaperPlaneTilt />` (follow-up), `<Phone />` (call), `<CalendarPlus />` (+3d)
- Empty state: `<CheckCircle weight="duotone" size={48} color={colors.success} />`

- [ ] **Step 3: Replace emoji in Pipeline and Drafts screens**

Read `app/(tabs)/pipeline.tsx` and `app/(tabs)/drafts.tsx`. Replace all emoji:
- Pipeline: filter chip icons, lead card actions, bottom sheet
- Drafts: swipe action icons (`<Check />` approve, `<X />` reject), source badges

- [ ] **Step 4: Replace emoji in detail screens**

Read `app/lead/[id].tsx` and `app/draft/[id].tsx`. Replace:
- Lead: action buttons, contact section icons, note icon
- Draft: AI badge sparkle (`<Sparkle weight="fill" />`), action bar icons

- [ ] **Step 5: Verify all screens render correctly**

Run: `npx expo start` — check each tab, open lead detail, open draft detail.

- [ ] **Step 6: Commit**

```bash
git add app/
git commit -m "feat: Phosphor Icons — replace all emoji with weight-variant icon system"
```

---

### Task 5: Apply design tokens to all screens

**Files:**
- Modify: all 5 screen files + _layout files

- [ ] **Step 1: Dashboard — apply tokens**

Read `app/(tabs)/index.tsx`. Replace all inline hex colors with token imports:
- `import { colors, typography, spacing, radius } from '@/constants/tokens';`
- Replace `'#0F172A'` → `colors.bg.base`
- Replace `'#1E293B'` → `colors.bg.surface`
- Replace `'#F1F5F9'` → `colors.text.primary`
- Replace `'#94A3B8'` → `colors.text.tertiary`
- Replace `'#A855F7'` → `colors.accent.default`
- Replace fontSize numbers with `typography.size.body`, etc.
- Replace padding/margin with `spacing.base`, etc.
- Add border: `borderWidth: 1, borderColor: colors.border.subtle` on cards
- Replace `Pressable` with `PressableScale` for action cards and metric chips

- [ ] **Step 2: Pipeline — apply tokens**

Same pattern for `app/(tabs)/pipeline.tsx`. Additionally:
- Filter chips active: `backgroundColor: colors.accent.decorative` → `colors.accent.default`
- Lead cards: add `borderColor: colors.border.subtle`
- Status dots: use `colors.status.*`

- [ ] **Step 3: Drafts — apply tokens**

Same for `app/(tabs)/drafts.tsx`:
- Swipe panels: `colors.swipe.approve`, `colors.swipe.reject`
- Source badges: `colors.source.*`
- Card borders: `colors.border.subtle`

- [ ] **Step 4: Detail screens — apply tokens**

Same for `app/draft/[id].tsx` and `app/lead/[id].tsx`.

- [ ] **Step 5: Tab layout — apply tokens**

Update `app/(tabs)/_layout.tsx`: tab bar background, active/inactive colors from tokens.

- [ ] **Step 6: Visual QA — check all screens**

Run app, navigate every screen. Check: colors consistent, text readable, borders visible, no hardcoded hex remaining.

Run: `grep -rn "'#" app/ --include="*.tsx" | grep -v "tokens" | grep -v "node_modules"`
Expected: Zero results (all colors from tokens)

- [ ] **Step 7: Commit**

```bash
git add app/ components/
git commit -m "feat: apply design tokens — 7 bg levels, borders, consistent spacing across all screens"
```

---

## Phase 2: Performance (Day 3-5)

### Task 6: FlashList v2 for Drafts list

**Files:**
- Modify: `system10h/mobile/app/(tabs)/drafts.tsx`

- [ ] **Step 1: Replace ScrollView with FlashList**

Read `app/(tabs)/drafts.tsx`. Find the ScrollView that renders draft cards. Replace with:

```typescript
import { FlashList } from '@shopify/flash-list';

// In render — replace <ScrollView> wrapping draft cards with:
<FlashList
  data={drafts}
  renderItem={({ item }) => <SwipeableDraftCard draft={item} ... />}
  keyExtractor={(item) => item.id}
  drawDistance={250}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['2xl'] }}
  ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
  ListEmptyComponent={<EmptyDrafts />}
  refreshControl={<RefreshControl ... />}
/>
```

- [ ] **Step 2: Verify scrolling performance**

Run on device (not simulator). Scroll through 10+ drafts. Should be 60 FPS.

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/drafts.tsx
git commit -m "perf: FlashList v2 for drafts — 60 FPS scrolling"
```

---

### Task 7: Skeleton loaders for all screens

**Files:**
- Create: `system10h/mobile/components/ui/SkeletonScreen.tsx`
- Modify: `system10h/mobile/app/(tabs)/index.tsx`
- Modify: `system10h/mobile/app/(tabs)/pipeline.tsx`
- Modify: `system10h/mobile/app/(tabs)/drafts.tsx`

- [ ] **Step 1: Create skeleton components**

```typescript
// components/ui/SkeletonScreen.tsx
import { Skeleton } from 'moti/skeleton';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/tokens';

const colorMode = 'dark' as const;
const baseColor = colors.bg.surface;

function Bone({ width, height, radius = 8 }: { width: number | string; height: number; radius?: number }) {
  return <Skeleton colorMode={colorMode} colors={[baseColor, colors.bg.surfaceHover, baseColor]} width={width} height={height} radius={radius} />;
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <Skeleton.Group show>
      <View style={styles.container}>
        {/* Greeting */}
        <Bone width="60%" height={20} />
        <View style={{ height: spacing.sm }} />
        <Bone width="40%" height={16} />

        {/* Metric chips */}
        <View style={[styles.row, { marginTop: spacing.lg }]}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.chip}>
              <Bone width={60} height={28} radius={14} />
            </View>
          ))}
        </View>

        {/* Action cards */}
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.card, { marginTop: spacing.md }]}>
            <Bone width="70%" height={18} />
            <View style={{ height: spacing.sm }} />
            <Bone width="50%" height={14} />
            <View style={{ height: spacing.md }} />
            <View style={styles.row}>
              <Bone width={80} height={32} radius={8} />
              <View style={{ width: spacing.sm }} />
              <Bone width={80} height={32} radius={8} />
            </View>
          </View>
        ))}
      </View>
    </Skeleton.Group>
  );
}

// Pipeline skeleton
export function PipelineSkeleton() {
  return (
    <Skeleton.Group show>
      <View style={styles.container}>
        <View style={styles.row}>
          {[1, 2, 3].map(i => <Bone key={i} width={80} height={32} radius={16} />)}
        </View>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.card, { marginTop: spacing.md }]}>
            <View style={styles.row}>
              <Bone width={12} height={12} radius={6} />
              <View style={{ width: spacing.sm }} />
              <Bone width="60%" height={18} />
            </View>
            <View style={{ height: spacing.sm }} />
            <Bone width="40%" height={14} />
          </View>
        ))}
      </View>
    </Skeleton.Group>
  );
}

// Drafts skeleton
export function DraftsSkeleton() {
  return (
    <Skeleton.Group show>
      <View style={styles.container}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.card, { marginTop: spacing.md }]}>
            <View style={styles.row}>
              <Bone width={70} height={20} radius={10} />
              <View style={{ flex: 1 }} />
              <Bone width={40} height={14} />
            </View>
            <View style={{ height: spacing.md }} />
            <Bone width="80%" height={16} />
            <View style={{ height: spacing.sm }} />
            <Bone width="100%" height={14} />
            <Bone width="60%" height={14} />
          </View>
        ))}
      </View>
    </Skeleton.Group>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  card: { backgroundColor: colors.bg.surface, borderRadius: 12, padding: spacing.base, borderWidth: 1, borderColor: colors.border.subtle },
  chip: { marginRight: spacing.sm },
});
```

- [ ] **Step 2: Replace "Ładowanie..." spinners in Dashboard**

Read `app/(tabs)/index.tsx`. Find loading state (spinner/ActivityIndicator). Replace with:
```typescript
import { DashboardSkeleton } from '@/components/ui/SkeletonScreen';
// ...
if (isPending) return <DashboardSkeleton />;
```

- [ ] **Step 3: Replace loading in Pipeline and Drafts**

Same pattern — `PipelineSkeleton` and `DraftsSkeleton`.

- [ ] **Step 4: Verify skeletons match layout**

Run app. Each screen should show skeleton that matches the real layout shape. No layout shift on data load.

- [ ] **Step 5: Commit**

```bash
git add components/ui/SkeletonScreen.tsx app/
git commit -m "feat: skeleton loaders for all screens — replace spinner with content-aware shimmer"
```

---

### Task 8: MMKV offline cache + TanStack Query persistence

**Files:**
- Create: `system10h/mobile/lib/mmkv.ts`
- Modify: `system10h/mobile/app/_layout.tsx`
- Modify: `system10h/mobile/lib/hooks.ts`

- [ ] **Step 1: Create MMKV storage adapter**

```typescript
// lib/mmkv.ts
import { MMKV } from 'react-native-mmkv';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const storage = new MMKV({ id: 'query-cache' });

export const persister = createSyncStoragePersister({
  storage: {
    setItem: (key: string, value: string) => storage.set(key, value),
    getItem: (key: string) => storage.getString(key) ?? null,
    removeItem: (key: string) => storage.delete(key),
  },
  throttleTime: 1000,
});
```

- [ ] **Step 2: Wrap app with PersistQueryClientProvider**

Read `app/_layout.tsx`. Find the QueryClient setup. Replace `QueryClientProvider` with:

```typescript
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { persister } from '@/lib/mmkv';

// In component:
useEffect(() => {
  return NetInfo.addEventListener((state) => {
    onlineManager.setOnline(!!state.isConnected);
  });
}, []);

// Replace <QueryClientProvider> with:
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
```

- [ ] **Step 3: Add tiered staleTime to hooks**

Read `lib/hooks.ts`. Update query configs:
- Dashboard: `staleTime: 30_000` (30s), `refetchInterval: 60_000`
- Leads/Pipeline: `staleTime: 5 * 60_000` (5min)
- Drafts: `staleTime: 60_000` (1min)
- Single lead/draft: `staleTime: 2 * 60_000` (2min)

Add `gcTime: 1000 * 60 * 60 * 24` (24h) to QueryClient defaults.

- [ ] **Step 4: Verify offline behavior**

1. Open app, load dashboard
2. Enable airplane mode
3. Navigate between tabs — data should show from cache
4. Disable airplane mode — data should refresh

- [ ] **Step 5: Commit**

```bash
git add lib/mmkv.ts app/_layout.tsx lib/hooks.ts
git commit -m "feat: MMKV offline cache — data persists between sessions, offline browsing works"
```

---

## Phase 3: UX Upgrades (Day 5-8)

### Task 9: Tab badge for Drafts

**Files:**
- Create: `system10h/mobile/stores/draftStore.ts`
- Modify: `system10h/mobile/app/(tabs)/_layout.tsx`
- Modify: `system10h/mobile/app/_layout.tsx` (push invalidation)

- [ ] **Step 1: Create Zustand draft count store**

```typescript
// stores/draftStore.ts
import { create } from 'zustand';

interface DraftState {
  draftCount: number;
  setDraftCount: (count: number) => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  draftCount: 0,
  setDraftCount: (count) => set({ draftCount: count }),
}));
```

- [ ] **Step 2: Add badge to Drafts tab**

Read `app/(tabs)/_layout.tsx`. Add to Drafts tab screen:

```typescript
import { useDraftStore } from '@/stores/draftStore';

// In component:
const draftCount = useDraftStore((s) => s.draftCount);

// In Tabs.Screen for drafts:
<Tabs.Screen name="drafts" options={{
  tabBarBadge: draftCount > 0 ? draftCount : undefined,
  tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#fff', fontSize: 11 },
  // ...existing options
}} />
```

- [ ] **Step 3: Update draft count from API response**

Read `lib/hooks.ts`. In the useDrafts hook, update store on data change:

```typescript
import { useDraftStore } from '@/stores/draftStore';

// Inside useDrafts or where drafts data is fetched:
const setDraftCount = useDraftStore((s) => s.setDraftCount);
// After data fetch:
useEffect(() => {
  if (data?.length !== undefined) setDraftCount(data.length);
}, [data?.length]);
```

- [ ] **Step 4: Add push-triggered refresh**

In `app/_layout.tsx`, add notification listener that invalidates queries:

```typescript
import * as Notifications from 'expo-notifications';
import { useDraftStore } from '@/stores/draftStore';

// In root layout:
useEffect(() => {
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    if (data?.type === 'draft_created' || data?.type === 'draft_updated') {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      if (data?.badgeCount !== undefined) useDraftStore.getState().setDraftCount(data.badgeCount);
    }
  });
  return () => sub.remove();
}, []);
```

- [ ] **Step 5: Commit**

```bash
git add stores/draftStore.ts app/
git commit -m "feat: drafts tab badge — count from API, updated via push notifications"
```

---

### Task 10: Search in Pipeline (Fuse.js)

**Files:**
- Create: `system10h/mobile/hooks/usePipelineSearch.ts`
- Create: `system10h/mobile/components/ui/AnimatedSearchBar.tsx`
- Modify: `system10h/mobile/app/(tabs)/pipeline.tsx`

- [ ] **Step 1: Create search hook**

```typescript
// hooks/usePipelineSearch.ts
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useMemo, useState } from 'react';

const fuseOptions: IFuseOptions<any> = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'company', weight: 0.3 },
    { name: 'next_step', weight: 0.1 },
    { name: 'email', weight: 0.1 },
  ],
  threshold: 0.3,
  minMatchCharLength: 2,
};

export function usePipelineSearch(items: any[]) {
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  const statusFiltered = useMemo(
    () => activeStatus === 'all' ? items : items.filter((i) => i.status === activeStatus),
    [items, activeStatus]
  );

  const fuse = useMemo(() => new Fuse(statusFiltered, fuseOptions), [statusFiltered]);

  const results = useMemo(() => {
    if (!query.trim()) return statusFiltered;
    return fuse.search(query).map((r) => r.item);
  }, [fuse, query, statusFiltered]);

  return { query, setQuery, activeStatus, setActiveStatus, results, total: items.length };
}
```

- [ ] **Step 2: Create AnimatedSearchBar**

```typescript
// components/ui/AnimatedSearchBar.tsx
import { useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, Keyboard, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { MagnifyingGlass, XCircle } from 'phosphor-react-native';
import { colors, spacing, typography } from '@/constants/tokens';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function AnimatedSearchBar({ value, onChangeText, placeholder = 'Szukaj...' }: Props) {
  const inputRef = useRef<TextInput>(null);
  const expansion = useSharedValue(0);

  const handleFocus = useCallback(() => {
    expansion.value = withTiming(1, { duration: 250 });
  }, []);

  const handleCancel = useCallback(() => {
    onChangeText('');
    Keyboard.dismiss();
    expansion.value = withTiming(0, { duration: 250 });
  }, [onChangeText]);

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: expansion.value,
    width: interpolate(expansion.value, [0, 1], [0, 60]),
    marginLeft: interpolate(expansion.value, [0, 1], [0, spacing.sm]),
  }));

  return (
    <View style={styles.row}>
      <View style={styles.inputWrapper}>
        <MagnifyingGlass size={18} color={colors.text.muted} style={{ marginRight: 6 }} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => { onChangeText(''); inputRef.current?.focus(); }}>
            <XCircle size={18} color={colors.text.muted} weight="fill" />
          </TouchableOpacity>
        )}
      </View>
      <Animated.View style={cancelStyle}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={{ fontSize: typography.size.body, color: colors.accent.default }}>Anuluj</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg.elevated, borderRadius: 10,
    paddingHorizontal: spacing.sm, height: 36,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  input: { flex: 1, fontSize: typography.size.body, color: colors.text.primary, paddingVertical: 0 },
});
```

- [ ] **Step 3: Wire search into Pipeline screen**

Read `app/(tabs)/pipeline.tsx`. Add search bar above filter chips:

```typescript
import { usePipelineSearch } from '@/hooks/usePipelineSearch';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';

// In component:
const { query, setQuery, activeStatus, setActiveStatus, results } = usePipelineSearch(leads ?? []);

// In render — above filter chips:
<AnimatedSearchBar value={query} onChangeText={setQuery} placeholder="Szukaj leadow..." />

// Replace leads data source with `results`
```

- [ ] **Step 4: Verify search works**

Type lead name — results filter instantly. Clear — all leads show. Filter chip + search = AND logic.

- [ ] **Step 5: Commit**

```bash
git add hooks/usePipelineSearch.ts components/ui/AnimatedSearchBar.tsx app/\(tabs\)/pipeline.tsx
git commit -m "feat: fuzzy search in Pipeline — Fuse.js + animated iOS-style search bar"
```

---

### Task 11: AI confidence badge

**Files:**
- Create: `system10h/mobile/components/ui/ConfidenceBadge.tsx`
- Modify: `system10h/mobile/app/(tabs)/drafts.tsx`
- Modify: `system10h/mobile/app/draft/[id].tsx`

- [ ] **Step 1: Create ConfidenceBadge component**

```typescript
// components/ui/ConfidenceBadge.tsx
// 3-tier qualitative system (never raw percentages — DR2 finding)
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, Warning, WarningCircle } from 'phosphor-react-native';
import { colors, typography, spacing } from '@/constants/tokens';

type Tier = 'high' | 'medium' | 'low';

interface Props {
  source?: string;  // 'autopilot' | 'ghost' | 'manual'
  confidence?: number;  // 0-100 (optional, from API)
}

function getTier(source?: string, confidence?: number): Tier {
  if (source === 'manual') return 'high';
  if (confidence !== undefined) {
    if (confidence >= 85) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
  }
  return source === 'autopilot' ? 'medium' : 'high';
}

const tierConfig = {
  high:   { label: 'Twoj styl',   color: colors.success,        bg: colors.successMuted, Icon: CheckCircle },
  medium: { label: 'Blisko',      color: colors.warning,        bg: colors.warningMuted, Icon: Warning },
  low:    { label: 'Do edycji',   color: colors.danger,         bg: colors.dangerMuted,  Icon: WarningCircle },
};

export function ConfidenceBadge({ source, confidence }: Props) {
  const tier = getTier(source, confidence);
  const { label, color, bg, Icon } = tierConfig[tier];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Icon size={14} color={color} weight="fill" />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 10, gap: 4 },
  label: { fontSize: typography.size.caption2, fontWeight: typography.weight.semibold },
});
```

- [ ] **Step 2: Add badge to draft cards and detail**

Read `app/(tabs)/drafts.tsx`. Add `<ConfidenceBadge source={draft.source} />` next to existing source badge.
Read `app/draft/[id].tsx`. Add badge in email header area.

- [ ] **Step 3: Commit**

```bash
git add components/ui/ConfidenceBadge.tsx app/
git commit -m "feat: AI confidence badge — 3-tier qualitative (high/medium/low)"
```

---

### Task 12: 4-zone swipe for drafts (Spark model)

**Files:**
- Modify: `system10h/mobile/app/(tabs)/drafts.tsx`

- [ ] **Step 1: Implement 4-zone swipe**

Read `app/(tabs)/drafts.tsx`. Currently has 2-zone swipe (left=reject, right=approve). Extend to 4 zones:
- Short right (< 40% width): **Approve** (green, checkmark)
- Long right (> 40% width): **Approve & Send** (bright green, paper plane)
- Short left (< 40%): **Reject** (red, X)
- Long left (> 40%): **Edit** (blue, pencil)

Key change: In the swipe handler's `onEnd`, check translation distance vs threshold (40% of screen width). Map to different actions:

```typescript
const SCREEN_WIDTH = Dimensions.get('window').width;
const LONG_THRESHOLD = SCREEN_WIDTH * 0.4;

// In onEnd handler:
if (translateX.value > LONG_THRESHOLD) {
  // Long right: approve + send
  haptic.success();
  runOnJS(handleApproveAndSend)(draft.id);
} else if (translateX.value > 0) {
  // Short right: approve (create draft, don't send)
  haptic.light();
  runOnJS(handleApprove)(draft.id);
} else if (translateX.value < -LONG_THRESHOLD) {
  // Long left: edit
  haptic.selection();
  runOnJS(handleEdit)(draft.id);
} else {
  // Short left: reject
  haptic.warning();
  runOnJS(handleReject)(draft.id);
}
```

Update swipe action panels to show different icons/colors based on distance:
- Right panel: starts green (approve) → transitions to bright green + airplane icon at threshold
- Left panel: starts red (reject) → transitions to blue + pencil icon at threshold

- [ ] **Step 2: Add visual zone indicators**

In swipe action render, interpolate icon and color based on translateX:
```typescript
const rightColor = interpolateColor(
  translateX.value,
  [0, LONG_THRESHOLD * 0.8, LONG_THRESHOLD],
  [colors.swipe.approve, colors.swipe.approve, '#15803d']  // darker green for send
);
```

- [ ] **Step 3: Verify all 4 zones work**

Test: short swipe right → approve (undo toast). Long swipe right → approve+send (confirmation alert + undo). Short swipe left → reject. Long swipe left → navigate to edit screen.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/drafts.tsx
git commit -m "feat: 4-zone swipe — short approve/reject + long send/edit (Spark model)"
```

---

## Phase 4: Final Polish (Day 8-10)

### Task 13: Visual QA pass + cleanup

**Files:**
- All screen files

- [ ] **Step 1: Remove dead code**

Delete `app/modal.tsx` (placeholder, never used).
Remove any unused imports, styles, components across all files.

- [ ] **Step 2: Check WCAG contrast on all surfaces**

Verify: no text using `#A855F7` on surfaces (should be `#C084FC`). Check danger/info colors on elevated backgrounds. Use Dev Tools accessibility inspector.

- [ ] **Step 3: Verify spacing grid**

Run: `grep -rn "10," app/ --include="*.tsx" | grep -v "node_modules" | grep -v "opacity"`
Look for any non-4pt-grid spacing values. Replace with tokens.

- [ ] **Step 4: Test on iPhone device**

Run `npx expo start` → scan QR with Expo Go on iPhone.
Check: haptics work, spring animations feel native, skeletons match layout, search is instant, swipe zones are correct, tab badge shows count.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: visual QA — cleanup dead code, verify a11y, fix spacing grid"
```

---

## Summary

| Phase | Days | Tasks | Key Outcome |
|-------|------|-------|-------------|
| 1: Design Foundation | 1-3 | Tasks 1-5 | Tokens, icons, spring press, depth, borders |
| 2: Performance | 3-5 | Tasks 6-8 | FlashList, skeletons, offline cache |
| 3: UX Upgrades | 5-8 | Tasks 9-12 | Tab badge, search, confidence, 4-zone swipe |
| 4: Polish | 8-10 | Task 13 | QA, cleanup, device testing |

**Total: ~10 working days, 13 tasks, ~50 commits**

After completion, the app should feel like Linear/Superhuman on iPhone — spring physics on every tap, consistent depth, no loading spinners, instant search, and swipe gestures that match muscle memory.
