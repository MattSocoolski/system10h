import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
  Dimensions,
  View,
  Text,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Layout,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Platform } from 'react-native';
import { Check, X, Sparkle, Eye, PaperPlaneTilt, PencilSimple } from 'phosphor-react-native';

import { colors, typography, spacing, radius, iconSize } from '@/constants/tokens';
import { PressableScale } from '@/components/ui/PressableScale';
import { DraftsSkeleton } from '@/components/ui/SkeletonScreen';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { haptic } from '@/lib/haptics';
import { useDrafts, useApproveDraft, useRejectDraft } from '@/lib/hooks';
import type { Draft } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const LONG_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.55;
const UNDO_TIMEOUT_MS = 5000;

// --- Source badge configuration (confidence colors per DR) ---
const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string; hasIcon: boolean }> = {
  autopilot: { label: 'Email Autopilot', color: colors.source.autopilot, bg: colors.source.autopilotBg, hasIcon: true },
  ghost: { label: '@ghost', color: colors.source.ghost, bg: colors.source.ghostBg, hasIcon: false },
  manual: { label: 'Reczny', color: colors.source.manual, bg: colors.source.manualBg, hasIcon: false },
};

// --- Undo action type ---
interface UndoAction {
  id: string;
  draftId: string;
  type: 'approve' | 'reject' | 'send';
  subject: string;
}

// --- Undo Snackbar (Gmail pattern: 5s with undo) ---
function UndoSnackbar({
  action,
  onUndo,
  onExpire,
}: {
  action: UndoAction;
  onUndo: () => void;
  onExpire: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onExpire, UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [action.id, onExpire]);

  const label = action.type === 'send' ? 'Wysylam' : action.type === 'approve' ? 'Zatwierdzono' : 'Odrzucono';
  const bgColor = action.type === 'reject' ? colors.swipe.reject : colors.swipe.approve;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(15).stiffness(150)}
      exiting={SlideOutDown.springify().damping(15).stiffness(150)}
      style={[styles.snackbar, { backgroundColor: bgColor }]}
    >
      <Text style={styles.snackbarText} numberOfLines={1}>
        {label}: {action.subject}
      </Text>
      <PressableScale onPress={onUndo} style={styles.undoBtn} accessibilityRole="button" scaleValue={0.95}>
        <Text style={styles.undoText}>Cofnij</Text>
      </PressableScale>
    </Animated.View>
  );
}

// --- Swipe left action panel (Approve / Send - green) ---
// Short swipe right = Approve, Long swipe right = Approve + Send
function LeftActions(
  progress: SharedValue<number>,
  translation: SharedValue<number>,
) {
  const animStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 0.9, 1]);
    return { opacity, transform: [{ scale }] };
  });

  // Show send icon when translation exceeds long threshold
  const sendIconStyle = useAnimatedStyle(() => ({
    opacity: translation.value > LONG_SWIPE_THRESHOLD ? 1 : 0,
  }));
  const checkIconStyle = useAnimatedStyle(() => ({
    opacity: translation.value > LONG_SWIPE_THRESHOLD ? 0 : 1,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  return (
    <Animated.View style={[styles.swipeAction, styles.approveAction, animStyle]}>
      <View style={styles.swipeIconStack}>
        <Animated.View style={[styles.swipeIconAbsolute, checkIconStyle]}>
          <Check size={iconSize.tabBar} color="#fff" weight="bold" />
        </Animated.View>
        <Animated.View style={[styles.swipeIconAbsolute, sendIconStyle]}>
          <PaperPlaneTilt size={iconSize.tabBar} color="#fff" weight="bold" />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.swipeActionText, labelStyle]}>
        Zatwierdz
      </Animated.Text>
    </Animated.View>
  );
}

// --- Swipe right action panel (Reject / Edit - red/blue) ---
// Short swipe left = Reject, Long swipe left = Edit
function RightActions(
  progress: SharedValue<number>,
  translation: SharedValue<number>,
) {
  const animStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 0.9, 1]);
    return { opacity, transform: [{ scale }] };
  });

  // translation is negative for left swipe
  const isLongSwipe = useAnimatedStyle(() => ({
    opacity: Math.abs(translation.value) > LONG_SWIPE_THRESHOLD ? 1 : 0,
  }));
  const isShortSwipe = useAnimatedStyle(() => ({
    opacity: Math.abs(translation.value) > LONG_SWIPE_THRESHOLD ? 0 : 1,
  }));

  // Change background color based on swipe distance
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: Math.abs(translation.value) > LONG_SWIPE_THRESHOLD
      ? colors.info
      : colors.swipe.reject,
  }));

  return (
    <Animated.View style={[styles.swipeAction, animStyle, bgStyle]}>
      <View style={styles.swipeIconStack}>
        <Animated.View style={[styles.swipeIconAbsolute, isShortSwipe]}>
          <X size={iconSize.tabBar} color="#fff" weight="bold" />
        </Animated.View>
        <Animated.View style={[styles.swipeIconAbsolute, isLongSwipe]}>
          <PencilSimple size={iconSize.tabBar} color="#fff" weight="bold" />
        </Animated.View>
      </View>
      <Animated.Text style={styles.swipeActionText}>
        Odrzuc
      </Animated.Text>
    </Animated.View>
  );
}

// --- Swipeable Draft Card ---
function SwipeableDraftCard({
  draft,
  onApprove,
  onReject,
  onOpen,
  onApproveAndSend,
  isApproving,
  isRejecting,
}: {
  draft: Draft;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpen: (id: string) => void;
  onApproveAndSend: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const translationRef = useRef<SharedValue<number> | null>(null);
  const source = SOURCE_CONFIG[draft.source] || SOURCE_CONFIG.manual;

  const handleSwipeOpen = useCallback(
    (direction: 'left' | 'right') => {
      // Read the current translation value from the SharedValue ref
      const absTranslation = translationRef.current ? Math.abs(translationRef.current.value) : 0;
      const isLongSwipe = absTranslation > LONG_SWIPE_THRESHOLD;

      if (direction === 'right') {
        // Swipe right = opens left panel
        if (isLongSwipe) {
          // Long right: Approve + Send immediately
          haptic.success();
          onApproveAndSend(draft.id);
        } else {
          // Short right: Approve (keep in drafts)
          haptic.success();
          onApprove(draft.id);
        }
      }
      if (direction === 'left') {
        // Swipe left = opens right panel
        if (isLongSwipe) {
          // Long left: Edit (navigate to draft detail)
          haptic.selection();
          onOpen(draft.id);
          swipeableRef.current?.close();
        } else {
          // Short left: Reject
          haptic.warning();
          onReject(draft.id);
        }
      }
    },
    [draft.id, onApprove, onReject, onOpen, onApproveAndSend],
  );

  const handleSwipeWillOpen = useCallback(() => {
    haptic.selection();
  }, []);

  const handleApprovePress = useCallback(() => {
    haptic.success();
    onApprove(draft.id);
  }, [draft.id, onApprove]);

  const handleRejectPress = useCallback(() => {
    haptic.warning();
    onReject(draft.id);
  }, [draft.id, onReject]);

  const cardContent = (
    <PressableScale onPress={() => onOpen(draft.id)} scaleValue={0.98}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardBadges}>
            <View style={[styles.sourceBadge, { backgroundColor: source.bg }]}>
              {source.hasIcon && <Sparkle size={12} color={source.color} weight="fill" style={{ marginRight: 4 }} />}
              <Text style={[styles.sourceText, { color: source.color }]}>
                {source.label}
              </Text>
            </View>
            <ConfidenceBadge source={draft.source || 'autopilot'} />
          </View>
          <Text style={styles.time}>
            {new Date(draft.createdAt).toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <Text style={styles.to}>Do: {draft.to}</Text>
        <Text style={styles.subject}>{draft.subject}</Text>
        <Text style={styles.preview} numberOfLines={2}>
          {draft.preview}
        </Text>
        <Text style={styles.tapHint}>Stuknij aby zobaczyc pelna tresc</Text>

        {draft.leadName && <Text style={styles.leadTag}>Lead: {draft.leadName}</Text>}

        <View style={styles.actions}>
          <PressableScale
            style={[styles.approveBtn, isApproving && styles.btnDisabled]}
            onPress={(e) => { handleApprovePress(); }}
            disabled={isApproving || isRejecting}
            accessibilityRole="button"
            accessibilityLabel="Zatwierdz draft"
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <Check size={iconSize.inline} color="#fff" weight="bold" />
              <Text style={styles.approveBtnText}>
                {isApproving ? 'Wysylam...' : 'Zatwierdz'}
              </Text>
            </View>
          </PressableScale>
          <PressableScale
            style={styles.editBtn}
            onPress={(e) => { onOpen(draft.id); }}
            accessibilityRole="button"
            accessibilityLabel="Podglad draftu"
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <Eye size={iconSize.inline} color={colors.info} weight="bold" />
              <Text style={styles.editBtnText}>Podglad</Text>
            </View>
          </PressableScale>
          <PressableScale
            style={[styles.rejectBtn, isRejecting && styles.btnDisabled]}
            onPress={(e) => { handleRejectPress(); }}
            disabled={isApproving || isRejecting}
            accessibilityRole="button"
            accessibilityLabel="Odrzuc draft"
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <X size={iconSize.inline} color={colors.danger} weight="bold" />
              <Text style={styles.rejectBtnText}>
                {isRejecting ? '...' : 'Odrzuc'}
              </Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </PressableScale>
  );

  // Web: skip Swipeable (doesn't work), use tap buttons only
  if (Platform.OS === 'web') {
    return (
      <View>
        {cardContent}
      </View>
    );
  }

  // Native: swipe + tap buttons
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify().damping(15).stiffness(150)}
    >
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderLeftActions={(progress, translation) => {
          translationRef.current = translation;
          return LeftActions(progress, translation);
        }}
        renderRightActions={(progress, translation) => {
          translationRef.current = translation;
          return RightActions(progress, translation);
        }}
        leftThreshold={SWIPE_THRESHOLD}
        rightThreshold={SWIPE_THRESHOLD}
        overshootLeft={false}
        overshootRight={false}
        overshootFriction={8}
        onSwipeableOpen={handleSwipeOpen}
        onSwipeableWillOpen={handleSwipeWillOpen}
        animationOptions={{ damping: 15, stiffness: 150 }}
      >
        {cardContent}
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
      <PressableScale style={styles.retryBtn} onPress={onRetry} scaleValue={0.95}>
        <Text style={styles.retryText}>Ponow</Text>
      </PressableScale>
    </View>
  );
}

// --- Main Screen ---
export default function DraftsScreen() {
  const router = useRouter();
  const { data: drafts = [], isLoading, isRefetching, isError, error, refetch } = useDrafts();
  const approveMutation = useApproveDraft();
  const rejectMutation = useRejectDraft();

  // Undo snackbar state
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const pendingMutationRef = useRef<{ type: 'approve' | 'reject' | 'send'; draftId: string } | null>(null);

  // Handle approve with 5s undo delay (Gmail pattern)
  const handleApprove = useCallback(
    (draftId: string) => {
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return;

      const actionId = `approve-${draftId}-${Date.now()}`;
      pendingMutationRef.current = { type: 'approve', draftId };
      setUndoAction({ id: actionId, draftId, type: 'approve', subject: draft.subject });
    },
    [drafts],
  );

  // Handle approve + send (long right swipe)
  const handleApproveAndSend = useCallback(
    (draftId: string) => {
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return;

      const actionId = `send-${draftId}-${Date.now()}`;
      pendingMutationRef.current = { type: 'send', draftId };
      setUndoAction({ id: actionId, draftId, type: 'send', subject: draft.subject });
    },
    [drafts],
  );

  // Handle reject with 5s undo delay
  const handleReject = useCallback(
    (draftId: string) => {
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return;

      const actionId = `reject-${draftId}-${Date.now()}`;
      pendingMutationRef.current = { type: 'reject', draftId };
      setUndoAction({ id: actionId, draftId, type: 'reject', subject: draft.subject });
    },
    [drafts],
  );

  const handleOpenDraft = useCallback((draftId: string) => {
    router.push(`/draft/${draftId}` as any);
  }, [router]);

  // Undo: cancel the pending mutation
  const handleUndo = useCallback(() => {
    pendingMutationRef.current = null;
    setUndoAction(null);
    haptic.light();
  }, []);

  // Undo timer expired: execute the actual mutation
  const handleUndoExpire = useCallback(() => {
    const pending = pendingMutationRef.current;
    if (!pending) {
      setUndoAction(null);
      return;
    }

    if (pending.type === 'approve' || pending.type === 'send') {
      approveMutation.mutate(pending.draftId, {
        onError: () => {
          Alert.alert('Blad', 'Nie udalo sie zatwierdzic draftu. Sprobuj ponownie.');
        },
      });
    } else {
      rejectMutation.mutate(pending.draftId, {
        onError: () => {
          Alert.alert('Blad', 'Nie udalo sie odrzucic draftu. Sprobuj ponownie.');
        },
      });
    }

    pendingMutationRef.current = null;
    setUndoAction(null);
  }, [approveMutation, rejectMutation]);

  // Skeleton loading state
  if (isLoading && drafts.length === 0) {
    return (
      <View style={styles.root}>
        <DraftsSkeleton />
      </View>
    );
  }

  // Filter out drafts with pending undo action (visually removed but not yet mutated)
  const visibleDrafts = drafts.filter(
    (d) => !(undoAction && undoAction.draftId === d.id),
  );

  const renderItem = useCallback(({ item }: { item: Draft }) => (
    <SwipeableDraftCard
      draft={item}
      onApprove={handleApprove}
      onReject={handleReject}
      onOpen={handleOpenDraft}
      onApproveAndSend={handleApproveAndSend}
      isApproving={
        approveMutation.isPending &&
        approveMutation.variables === item.id
      }
      isRejecting={
        rejectMutation.isPending &&
        rejectMutation.variables === item.id
      }
    />
  ), [handleApprove, handleReject, handleOpenDraft, handleApproveAndSend, approveMutation.isPending, approveMutation.variables, rejectMutation.isPending, rejectMutation.variables]);

  const keyExtractor = useCallback((item: Draft) => item.id, []);

  const ListHeaderComponent = useMemo(() => (
    <View>
      <Text style={styles.header}>
        {visibleDrafts.length}{' '}
        {visibleDrafts.length === 1 ? 'draft' : 'draftow'} do zatwierdzenia
      </Text>

      <Text style={styles.hint}>
        Swipe prawo = zatwierdz | Dalej = wyslij | Lewo = odrzuc | Dalej = edytuj
      </Text>

      {isError && (
        <ErrorBanner
          message={error?.message || 'Nie udalo sie zaladowac draftow'}
          onRetry={refetch}
        />
      )}
    </View>
  ), [visibleDrafts.length, isError, error, refetch]);

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <EnvelopeSimpleEmpty />
        <Text style={styles.emptyText}>Brak draftow do zatwierdzenia</Text>
        <Text style={styles.emptySubtext}>
          Email Autopilot + @ghost tworza drafty automatycznie
        </Text>
      </View>
    );
  }, [isLoading]);

  return (
    <View style={styles.root}>
      <FlashList
        data={visibleDrafts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={220}
        drawDistance={250}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flashListContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent.default}
          />
        }
      />

      {/* Undo Snackbar — fixed at bottom */}
      {undoAction && (
        <UndoSnackbar
          action={undoAction}
          onUndo={handleUndo}
          onExpire={handleUndoExpire}
        />
      )}
    </View>
  );
}

// Small helper component for empty state icon
function EnvelopeSimpleEmpty() {
  const { EnvelopeSimple: EnvIcon } = require('phosphor-react-native');
  return <EnvIcon size={iconSize.emptyState} color={colors.text.muted} weight="duotone" />;
}

// --- Styles ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  flashListContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 100 },
  header: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginBottom: spacing.xs, fontVariant: ['tabular-nums'] },
  hint: { fontSize: typography.size.caption1, color: colors.text.muted, marginBottom: spacing.base, fontWeight: typography.weight.medium },

  // Card
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm + 2,
  },
  sourceText: { fontSize: typography.size.caption2, fontWeight: typography.weight.semibold },
  time: { fontSize: typography.size.caption1, fontWeight: typography.weight.medium, color: colors.text.tertiary, fontVariant: ['tabular-nums'] },
  to: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginBottom: 2 },
  subject: { fontSize: typography.size.callout, fontWeight: typography.weight.semibold, color: colors.text.primary, marginBottom: spacing.sm - 2 },
  preview: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.secondary, lineHeight: typography.lineHeight.tight },
  leadTag: { fontSize: typography.size.caption1, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginTop: spacing.sm },
  tapHint: { fontSize: typography.size.caption2, fontWeight: typography.weight.medium, color: colors.text.muted, marginTop: spacing.sm - 2 },

  // Tap buttons (accessibility fallback)
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base - 2 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  approveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: typography.weight.bold, fontSize: typography.size.footnote },
  editBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  editBtnText: { fontWeight: typography.weight.semibold, fontSize: typography.size.footnote, color: colors.info },
  rejectBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: 10,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  rejectBtnText: { color: colors.danger, fontWeight: typography.weight.semibold, fontSize: typography.size.footnote },
  btnDisabled: { opacity: 0.5 },

  // Swipe action panels
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: radius.xl,
    gap: spacing.xs,
  },
  approveAction: {
    backgroundColor: colors.swipe.approve,
  },
  rejectAction: {
    backgroundColor: colors.swipe.reject,
  },
  swipeActionText: {
    color: '#fff',
    fontWeight: typography.weight.bold,
    fontSize: typography.size.footnote,
  },
  swipeIconStack: {
    width: iconSize.tabBar,
    height: iconSize.tabBar,
    position: 'relative',
  },
  swipeIconAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // Undo snackbar
  snackbar: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.xl,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  snackbarText: {
    color: '#fff',
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.semibold,
    flex: 1,
    marginRight: spacing.md,
  },
  undoBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.25)',
    minHeight: 44,
    justifyContent: 'center',
  },
  undoText: {
    color: '#fff',
    fontWeight: typography.weight.bold,
    fontSize: typography.size.footnote,
  },

  // Empty state
  empty: { alignItems: 'center', paddingTop: spacing['5xl'], gap: spacing.sm },
  emptyText: { fontSize: typography.size.callout, fontWeight: typography.weight.semibold, color: colors.text.tertiary },
  emptySubtext: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.text.muted,
    textAlign: 'center',
  },
  // Error
  errorBanner: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.xl, padding: spacing.base, marginBottom: spacing.base,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 3, borderLeftColor: colors.danger,
  },
  errorText: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.danger, flex: 1, marginRight: spacing.md },
  retryBtn: {
    paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: 'rgba(248,113,113,0.2)',
    minHeight: 44, justifyContent: 'center',
  },
  retryText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.danger },
});
