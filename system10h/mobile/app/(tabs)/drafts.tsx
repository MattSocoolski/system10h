import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Dimensions,
  View,
  Text,
} from 'react-native';
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
import { Check, X, Sparkle, Eye } from 'phosphor-react-native';

import { colors, typography, spacing, radius, iconSize } from '@/constants/tokens';
import { PressableScale } from '@/components/ui/PressableScale';
import { haptic } from '@/lib/haptics';
import { useDrafts, useApproveDraft, useRejectDraft } from '@/lib/hooks';
import type { Draft } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
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
  type: 'approve' | 'reject';
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

  const label = action.type === 'approve' ? 'Zatwierdzono' : 'Odrzucono';
  const bgColor = action.type === 'approve' ? colors.swipe.approve : colors.swipe.reject;

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

// --- Swipe left action panel (Approve - green) ---
function LeftActions(
  progress: SharedValue<number>,
  _translation: SharedValue<number>,
) {
  const animStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 0.9, 1]);
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.swipeAction, styles.approveAction, animStyle]}>
      <Check size={iconSize.tabBar} color="#fff" weight="bold" />
      <Text style={styles.swipeActionText}>Zatwierdz</Text>
    </Animated.View>
  );
}

// --- Swipe right action panel (Reject - red) ---
function RightActions(
  progress: SharedValue<number>,
  _translation: SharedValue<number>,
) {
  const animStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 0.9, 1]);
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.swipeAction, styles.rejectAction, animStyle]}>
      <X size={iconSize.tabBar} color="#fff" weight="bold" />
      <Text style={styles.swipeActionText}>Odrzuc</Text>
    </Animated.View>
  );
}

// --- Swipeable Draft Card ---
function SwipeableDraftCard({
  draft,
  onApprove,
  onReject,
  onOpen,
  isApproving,
  isRejecting,
}: {
  draft: Draft;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpen: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const source = SOURCE_CONFIG[draft.source] || SOURCE_CONFIG.manual;

  const handleSwipeOpen = useCallback(
    (direction: 'left' | 'right') => {
      // Swipe right = opens left panel = Approve
      if (direction === 'right') {
        haptic.success();
        onApprove(draft.id);
      }
      // Swipe left = opens right panel = Reject
      if (direction === 'left') {
        haptic.warning();
        onReject(draft.id);
      }
    },
    [draft.id, onApprove, onReject],
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
          <View style={[styles.sourceBadge, { backgroundColor: source.bg }]}>
            {source.hasIcon && <Sparkle size={12} color={source.color} weight="fill" style={{ marginRight: 4 }} />}
            <Text style={[styles.sourceText, { color: source.color }]}>
              {source.label}
            </Text>
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
      <View style={{ marginBottom: spacing.md }}>
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
        renderLeftActions={LeftActions}
        renderRightActions={RightActions}
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
  const pendingMutationRef = useRef<{ type: 'approve' | 'reject'; draftId: string } | null>(null);

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

    if (pending.type === 'approve') {
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

  // Filter out drafts with pending undo action (visually removed but not yet mutated)
  const visibleDrafts = drafts.filter(
    (d) => !(undoAction && undoAction.draftId === d.id),
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent.default}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.header}>
            {visibleDrafts.length}{' '}
            {visibleDrafts.length === 1 ? 'draft' : 'draftow'} do zatwierdzenia
          </Text>

          <Text style={styles.hint}>
            Swipe w prawo = zatwierdz | Swipe w lewo = odrzuc
          </Text>

          {isError && (
            <ErrorBanner
              message={error?.message || 'Nie udalo sie zaladowac draftow'}
              onRetry={refetch}
            />
          )}

          {visibleDrafts.map((draft) => (
            <SwipeableDraftCard
              key={draft.id}
              draft={draft}
              onApprove={handleApprove}
              onReject={handleReject}
              onOpen={handleOpenDraft}
              isApproving={
                approveMutation.isPending &&
                approveMutation.variables === draft.id
              }
              isRejecting={
                rejectMutation.isPending &&
                rejectMutation.variables === draft.id
              }
            />
          ))}

          {visibleDrafts.length === 0 && !isLoading && (
            <View style={styles.empty}>
              <EnvelopeSimpleEmpty />
              <Text style={styles.emptyText}>Brak draftow do zatwierdzenia</Text>
              <Text style={styles.emptySubtext}>
                Email Autopilot + @ghost tworza drafty automatycznie
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
  scroll: { flex: 1, backgroundColor: colors.bg.base },
  scrollContent: { paddingBottom: 100 },
  container: { flex: 1, padding: spacing.lg },
  header: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginBottom: spacing.xs, fontVariant: ['tabular-nums'] },
  hint: { fontSize: typography.size.caption1, color: colors.text.muted, marginBottom: spacing.base, fontWeight: typography.weight.medium },

  // Card
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
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
