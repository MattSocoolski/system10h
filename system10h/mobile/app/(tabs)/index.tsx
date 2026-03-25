import { useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  View,
  Text as RNText,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock,
  EnvelopeSimple,
  Trophy,
  PaperPlaneTilt,
  Phone,
  CalendarPlus,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  CaretRight,
  Dot,
} from 'phosphor-react-native';

import { colors, typography, spacing, radius, iconSize } from '@/constants/tokens';
import { PressableScale } from '@/components/ui/PressableScale';
import { useDashboard, useActivity } from '@/lib/hooks';
import * as api from '@/lib/api';

// ─── Helpers ────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatValue(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

// ─── Sub-components ─────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <RNText style={styles.errorText}>{message}</RNText>
      <PressableScale style={styles.retryBtn} onPress={onRetry} scaleValue={0.95}>
        <RNText style={styles.retryText}>Ponow</RNText>
      </PressableScale>
    </View>
  );
}

function MetricChip({
  label,
  count,
  bgColor,
  textColor,
  icon,
  onPress,
}: {
  label: string;
  count: number;
  bgColor: string;
  textColor: string;
  icon?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      style={[styles.chip, { backgroundColor: bgColor }]}
      onPress={onPress}
      disabled={!onPress}
      scaleValue={0.95}
      hapticType={onPress ? 'light' : 'none'}
    >
      <View style={styles.chipInner}>
        {icon}
        <RNText style={[styles.chipText, { color: textColor }]}>
          <RNText style={[styles.chipCount, { color: textColor }]}>{count}</RNText>
          {' '}{label}
        </RNText>
      </View>
    </PressableScale>
  );
}

type ActionCardLead = {
  id: string;
  name: string;
  company: string;
  value?: number;
  email?: string | null;
  phone?: string | null;
  nextStep?: string | null;
  daysOverdue?: number;
  type: 'overdue' | 'dueToday';
};

function ActionCard({
  lead,
  onFollowUp,
  onCall,
  onPostpone,
  onOpenDetail,
}: {
  lead: ActionCardLead;
  onFollowUp: () => void;
  onCall: () => void;
  onPostpone: (days: number) => void;
  onOpenDetail: () => void;
}) {
  const isOverdue = lead.type === 'overdue';
  const borderColor = isOverdue ? colors.danger : colors.warning;

  const contextLine = isOverdue
    ? `${lead.daysOverdue} dni overdue`
    : 'Ostatni kontakt dzis';

  return (
    <PressableScale style={[styles.actionCard, { borderLeftColor: borderColor }]} onPress={onOpenDetail} scaleValue={0.98}>
      {/* Top row: name + company + value */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardNameRow}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isOverdue ? colors.danger : colors.warning }} />
          <RNText style={styles.cardName} numberOfLines={1}>
            {lead.name}
          </RNText>
          {lead.company ? (
            <RNText style={styles.cardCompany} numberOfLines={1}>
              {' \u00B7 '}{lead.company}
            </RNText>
          ) : null}
        </View>
        {(lead.value != null && lead.value > 0) ? (
          <RNText style={styles.cardValue}>
            {formatValue(lead.value)}
          </RNText>
        ) : null}
      </View>

      {/* Context line */}
      <RNText style={styles.cardContext}>{contextLine}</RNText>

      {/* Next step */}
      {lead.nextStep ? (
        <RNText style={styles.cardNextStep} numberOfLines={2}>
          Nastepny krok: {lead.nextStep}
        </RNText>
      ) : null}

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <PressableScale style={styles.actionBtnPrimary} onPress={onFollowUp} scaleValue={0.95}>
          <View style={styles.btnRow}>
            <PaperPlaneTilt size={iconSize.inline} color={colors.accent.default} weight="bold" />
            <RNText style={styles.actionTextPrimary}>Follow-up</RNText>
          </View>
        </PressableScale>
        <PressableScale style={styles.actionBtnPrimary} onPress={onCall} scaleValue={0.95}>
          <View style={styles.btnRow}>
            <Phone size={iconSize.inline} color={colors.accent.default} weight="bold" />
            <RNText style={styles.actionTextPrimary}>Zadzwon</RNText>
          </View>
        </PressableScale>
        <PressableScale style={styles.actionBtnSecondary} onPress={() => onPostpone(3)} scaleValue={0.95}>
          <View style={styles.btnRow}>
            <CalendarPlus size={iconSize.inline} color={colors.text.tertiary} weight="bold" />
            <RNText style={styles.actionTextSecondary}>+3d</RNText>
          </View>
        </PressableScale>
        <View style={{ flex: 1 }} />
        <PressableScale style={styles.actionBtnSecondary} onPress={onOpenDetail} scaleValue={0.95}>
          <CaretRight size={iconSize.inline} color={colors.text.tertiary} weight="bold" />
        </PressableScale>
      </View>
    </PressableScale>
  );
}

// ─── Main Screen ────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { data: dashboard, isLoading, isRefetching, isError, error, refetch } = useDashboard();
  const { data: activity } = useActivity();

  const handleOpenDetail = useCallback((id: string) => {
    router.push(`/lead/${id}` as any);
  }, [router]);

  const handleFollowUp = useCallback((lead: any) => {
    if (lead.email) {
      Linking.openURL(`mailto:${lead.email}?subject=Re: ${lead.company || lead.name}`);
    } else {
      const q = encodeURIComponent(lead.company || lead.name);
      Linking.openURL(`https://mail.google.com/mail/?view=cm&to=&su=Re: ${q}`);
    }
  }, []);

  const handleCall = useCallback((lead: any) => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    } else {
      if (Platform.OS === 'web') {
        window.alert(`Brak numeru telefonu dla ${lead.name}`);
      } else {
        Alert.alert('Brak numeru', `${lead.name} nie ma numeru w CRM.`);
      }
    }
  }, []);

  const handlePostpone = useCallback(async (lead: any, days: number) => {
    const newDue = addDays(days);
    try {
      await api.updateLead(lead.id, { due: newDue });
      refetch();
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Blad: ${err?.message}`);
      } else {
        Alert.alert('Blad', err?.message || 'Nie udalo sie odlozyc leada.');
      }
    }
  }, [refetch]);

  // ── Loading state ──

  if (isLoading && !dashboard) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.default} />
        <RNText style={styles.loadingText}>Ladowanie...</RNText>
      </View>
    );
  }

  // ── Build merged action queue ──

  const actionLeads: ActionCardLead[] = [];
  if (dashboard) {
    // Overdue leads first, sorted by daysOverdue desc
    const sortedOverdue = [...dashboard.overdueLeads]
      .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));
    for (const lead of sortedOverdue) {
      actionLeads.push({ ...lead, type: 'overdue' as const });
    }
    // Then due today
    for (const lead of dashboard.dueTodayLeads) {
      actionLeads.push({ ...lead, type: 'dueToday' as const });
    }
  }

  const hasActions = actionLeads.length > 0;

  // ── Metric chips data ──

  const chips: { label: string; count: number; bgColor: string; textColor: string; icon?: React.ReactNode; onPress?: () => void }[] = [];
  if (dashboard) {
    if (dashboard.pipeline.overdue > 0) {
      chips.push({
        label: 'overdue',
        count: dashboard.pipeline.overdue,
        bgColor: colors.chip.overdue,
        textColor: colors.danger,
        icon: <Clock size={iconSize.inline} color={colors.danger} weight="bold" />,
        onPress: () => router.push('/(tabs)/pipeline' as any),
      });
    }
    if (dashboard.recentDrafts > 0) {
      chips.push({
        label: 'drafty',
        count: dashboard.recentDrafts,
        bgColor: colors.chip.drafts,
        textColor: colors.accent.default,
        icon: <EnvelopeSimple size={iconSize.inline} color={colors.accent.default} weight="bold" />,
        onPress: () => router.push('/(tabs)/drafts' as any),
      });
    }
    if (dashboard.closedThisMonth.count > 0) {
      chips.push({
        label: 'zamkniete',
        count: dashboard.closedThisMonth.count,
        bgColor: colors.chip.closed,
        textColor: colors.success,
        icon: <Trophy size={iconSize.inline} color={colors.success} weight="bold" />,
      });
    }
  }

  // ── Render ──

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent.default} />}
    >
      <View style={styles.container}>
        {/* 1. Header */}
        <View style={styles.header}>
          <RNText style={styles.greeting}>Dzien dobry</RNText>
          <RNText style={styles.date}>
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </RNText>
        </View>

        {dashboard && (
          <RNText style={styles.pipelineSnapshot}>
            <RNText style={styles.pipelineNumber}>{dashboard.pipeline.active}</RNText>
            <RNText style={styles.pipelineLabel}> aktywnych</RNText>
            <RNText style={styles.pipelineLabel}> {'\u00B7'} </RNText>
            <RNText style={styles.pipelineValue}>
              {formatValue(dashboard.pipeline.value)} PLN
            </RNText>
          </RNText>
        )}

        {/* Error banner */}
        {isError && (
          <ErrorBanner
            message={error?.message || 'Nie udalo sie zaladowac danych'}
            onRetry={refetch}
          />
        )}

        {dashboard && (
          <>
            {/* 2. Metric chips */}
            {chips.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContent}
              >
                {chips.map((chip) => (
                  <MetricChip
                    key={chip.label}
                    label={chip.label}
                    count={chip.count}
                    bgColor={chip.bgColor}
                    textColor={chip.textColor}
                    icon={chip.icon}
                    onPress={chip.onPress}
                  />
                ))}
              </ScrollView>
            )}

            {/* 3. Action cards */}
            {hasActions ? (
              <View style={styles.actionQueue}>
                {actionLeads.map((lead) => (
                  <ActionCard
                    key={lead.id}
                    lead={lead}
                    onFollowUp={() => handleFollowUp(lead)}
                    onCall={() => handleCall(lead)}
                    onPostpone={(days) => handlePostpone(lead, days)}
                    onOpenDetail={() => handleOpenDetail(lead.id)}
                  />
                ))}
              </View>
            ) : (
              /* 4. Empty state */
              <View style={styles.emptyState}>
                <CheckCircle weight="duotone" size={iconSize.emptyState} color={colors.success} />
                <RNText style={styles.emptyTitle}>Wszystko ogarnięte</RNText>
                <RNText style={styles.emptySubtitle}>Brak pilnych akcji na dzis</RNText>
              </View>
            )}

            {/* 5. Closed this month (compact) */}
            {dashboard.closedThisMonth.count > 0 && (
              <RNText style={styles.closedLine}>
                Zamkniete: {dashboard.closedThisMonth.count} deale {'\u00B7'}{' '}
                {formatValue(dashboard.closedThisMonth.value)} PLN
              </RNText>
            )}

            {/* 6. Activity Feed */}
            {activity && activity.length > 0 && (
              <View style={styles.activitySection}>
                <RNText style={styles.activityTitle}>OSTATNIA AKTYWNOSC</RNText>
                {activity.slice(0, 5).map((event, i) => (
                  <View key={`${event.timestamp}-${i}`} style={styles.activityRow}>
                    <View style={styles.activityIconContainer}>
                      {event.type === 'draft_approved' ? (
                        <CheckCircle size={iconSize.listItem} color={colors.success} weight="fill" />
                      ) : event.type === 'draft_rejected' ? (
                        <XCircle size={iconSize.listItem} color={colors.danger} weight="fill" />
                      ) : event.type === 'lead_updated' ? (
                        <ArrowsClockwise size={iconSize.listItem} color={colors.info} weight="bold" />
                      ) : (
                        <Dot size={iconSize.listItem} color={colors.text.tertiary} weight="fill" />
                      )}
                    </View>
                    <View style={styles.activityContent}>
                      <RNText style={styles.activityText} numberOfLines={1}>{event.summary}</RNText>
                      <RNText style={styles.activityTime}>
                        {new Date(event.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                      </RNText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* 7. Sync time */}
        {dashboard?.updatedAt && (
          <RNText style={styles.syncTime}>
            Odswiezone: {new Date(dashboard.updatedAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </RNText>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.base,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: typography.size.callout,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  date: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },

  // ── Pipeline snapshot ──
  pipelineSnapshot: {
    fontSize: typography.size.title2,
    marginBottom: spacing.lg,
    color: colors.text.secondary,
  },
  pipelineNumber: {
    fontSize: typography.size.title2,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  pipelineLabel: {
    fontSize: typography.size.title2,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  pipelineValue: {
    fontSize: typography.size.title2,
    fontWeight: typography.weight.bold,
    color: colors.accent.default,
    fontVariant: ['tabular-nums'],
  },

  // ── Error ──
  errorBanner: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.danger,
    flex: 1,
    marginRight: spacing.md,
  },
  retryBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248,113,113,0.2)',
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.semibold,
    color: colors.danger,
  },

  // ── Metric chips ──
  chipsScroll: {
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  chipsContent: {
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: radius.full,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chipText: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.semibold,
  },
  chipCount: {
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },

  // ── Action cards ──
  actionQueue: {
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.sm,
  },
  cardName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  cardCompany: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    flexShrink: 2,
  },
  cardValue: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.accent.default,
    fontVariant: ['tabular-nums'],
  },
  cardContext: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  cardNextStep: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    fontStyle: 'italic',
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtnPrimary: {
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.accent.muted,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionTextPrimary: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.semibold,
    color: colors.accent.default,
  },
  actionBtnSecondary: {
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionTextSecondary: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
  },

  // ── Closed line ──
  closedLine: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontVariant: ['tabular-nums'],
  },

  // ── Activity feed ──
  activitySection: {
    marginTop: spacing.xl,
  },
  activityTitle: {
    fontSize: typography.size.caption1,
    fontWeight: typography.weight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  activityIconContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  activityTime: {
    fontSize: typography.size.caption2,
    fontWeight: typography.weight.medium,
    color: colors.text.muted,
    fontVariant: ['tabular-nums'],
    marginLeft: spacing.sm,
  },

  // ── Sync time ──
  syncTime: {
    fontSize: typography.size.caption1,
    fontWeight: typography.weight.medium,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.base,
  },
});
