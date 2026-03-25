import { useCallback, useRef, useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
  Alert,
  Platform,
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import {
  PaperPlaneTilt,
  Phone,
  CalendarPlus,
  Warning,
  CaretRight,
} from 'phosphor-react-native';

import { colors, typography, spacing, radius, iconSize } from '@/constants/tokens';
import { PressableScale } from '@/components/ui/PressableScale';
import { PipelineSkeleton } from '@/components/ui/SkeletonScreen';
import { useLeads } from '@/lib/hooks';
import { useUIStore } from '@/lib/stores';
import * as api from '@/lib/api';

// Bottom sheet — native only (not supported on web)
let BottomSheet: any = null;
let BottomSheetView: any = null;
if (Platform.OS !== 'web') {
  try {
    const bs = require('@gorhom/bottom-sheet');
    BottomSheet = bs.default;
    BottomSheetView = bs.BottomSheetView;
  } catch {
    // Bottom sheet not available — will fall back to navigation
  }
}

const STATUS_FILTERS = [
  { key: undefined, label: 'Wszystkie' },
  { key: 'active', label: 'Aktywni' },
  { key: 'nurture', label: 'Nurture' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  active: colors.status.active,
  nurture: colors.status.nurture,
  frozen: colors.status.frozen,
  closed_won: colors.status.closedWon,
  closed_lost: colors.status.closedLost,
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktywny',
  nurture: 'Nurture',
  frozen: 'Zamrozony',
  closed_won: 'Wygrana',
  closed_lost: 'Przegrana',
};

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function LeadCard({
  lead,
  onFollowUp,
  onCall,
  onPostpone,
  onPress,
}: {
  lead: any;
  onFollowUp: (lead: any) => void;
  onCall: (lead: any) => void;
  onPostpone: (lead: any, days: number) => void;
  onPress: (lead: any) => void;
}) {
  const effectiveStatus = lead.daysOverdue > 0 ? 'overdue' : lead.status;
  const statusColor = effectiveStatus === 'overdue' ? colors.danger : (STATUS_COLORS[lead.status] || colors.status.frozen);
  const isStale = lead.lastContact && (Date.now() - new Date(lead.lastContact).getTime()) > 7 * 86400000;

  return (
    <PressableScale onPress={() => onPress(lead)} scaleValue={0.98}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.cardName}>{lead.name}</Text>
            {isStale && (
              <Warning size={iconSize.inline} color={colors.warning} weight="fill" />
            )}
          </View>
          <View style={styles.cardHeaderRight}>
            {lead.value > 0 && (
              <Text style={styles.cardValue}>{lead.value.toLocaleString('pl-PL')} PLN</Text>
            )}
            <CaretRight size={iconSize.listItem} color={colors.text.tertiary} weight="bold" />
          </View>
        </View>
        {lead.company ? <Text style={styles.cardCompany}>{lead.company}</Text> : null}

        <View style={styles.cardMeta}>
          {lead.lastContact && (
            <Text style={[styles.metaText, isStale && styles.metaTextStale]}>
              Kontakt: {new Date(lead.lastContact).toLocaleDateString('pl-PL')}
            </Text>
          )}
          {lead.daysOverdue > 0 && (
            <Text style={styles.textOverdue}>
              {lead.daysOverdue}d overdue
            </Text>
          )}
        </View>

        {lead.nextStep ? (
          <Text style={styles.nextStep} numberOfLines={2}>{lead.nextStep}</Text>
        ) : null}

        <View style={styles.cardActions}>
          <PressableScale style={styles.actionBtn} onPress={(e) => { onFollowUp(lead); }} scaleValue={0.95}>
            <View style={styles.btnRow}>
              <PaperPlaneTilt size={iconSize.inline} color={colors.accent.default} weight="bold" />
              <Text style={styles.actionText}>Follow-up</Text>
            </View>
          </PressableScale>
          <PressableScale style={styles.actionBtn} onPress={(e) => { onCall(lead); }} scaleValue={0.95}>
            <View style={styles.btnRow}>
              <Phone size={iconSize.inline} color={colors.accent.default} weight="bold" />
              <Text style={styles.actionText}>Zadzwon</Text>
            </View>
          </PressableScale>
          <PressableScale
            style={styles.actionBtnSecondary}
            onPress={(e) => { onPostpone(lead, 3); }}
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <CalendarPlus size={iconSize.inline} color={colors.text.tertiary} weight="bold" />
              <Text style={styles.actionTextSecondary}>+3 dni</Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </PressableScale>
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

function LeadPreviewSheet({
  lead,
  onFollowUp,
  onCall,
  onPostpone,
  onViewDetail,
}: {
  lead: any;
  onFollowUp: (lead: any) => void;
  onCall: (lead: any) => void;
  onPostpone: (lead: any, days: number) => void;
  onViewDetail: (lead: any) => void;
}) {
  if (!lead) return null;

  const statusColor = STATUS_COLORS[lead.status] || colors.status.frozen;
  const statusLabel = STATUS_LABELS[lead.status] || lead.status;

  return (
    <View style={styles.sheetContent}>
      {/* Lead name + company */}
      <Text style={styles.sheetName}>{lead.name}</Text>
      {lead.company ? <Text style={styles.sheetCompany}>{lead.company}</Text> : null}

      {/* Status badge */}
      <View style={styles.sheetStatusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.sheetStatusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {/* Value */}
      {lead.value > 0 && (
        <Text style={styles.sheetValue}>{lead.value.toLocaleString('pl-PL')} PLN</Text>
      )}

      {/* Meta details */}
      <View style={styles.sheetMetaSection}>
        {lead.lastContact && (
          <View style={styles.sheetMetaRow}>
            <Text style={styles.sheetMetaLabel}>Ostatni kontakt</Text>
            <Text style={styles.sheetMetaValue}>
              {new Date(lead.lastContact).toLocaleDateString('pl-PL')}
            </Text>
          </View>
        )}
        {lead.nextStep && (
          <View style={styles.sheetMetaRow}>
            <Text style={styles.sheetMetaLabel}>Nastepny krok</Text>
            <Text style={styles.sheetNextStep}>{lead.nextStep}</Text>
          </View>
        )}
        {lead.daysOverdue > 0 && (
          <View style={styles.sheetMetaRow}>
            <Text style={styles.sheetMetaLabel}>Opoznienie</Text>
            <Text style={styles.sheetOverdue}>{lead.daysOverdue} dni overdue</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.sheetActions}>
        <PressableScale style={styles.sheetActionBtn} onPress={() => onFollowUp(lead)} scaleValue={0.95}>
          <View style={styles.btnRow}>
            <PaperPlaneTilt size={iconSize.listItem} color={colors.accent.default} weight="bold" />
            <Text style={styles.sheetActionText}>Follow-up</Text>
          </View>
        </PressableScale>
        <PressableScale style={styles.sheetActionBtn} onPress={() => onCall(lead)} scaleValue={0.95}>
          <View style={styles.btnRow}>
            <Phone size={iconSize.listItem} color={colors.accent.default} weight="bold" />
            <Text style={styles.sheetActionText}>Zadzwon</Text>
          </View>
        </PressableScale>
        <PressableScale style={styles.sheetActionBtnSecondary} onPress={() => onPostpone(lead, 3)} scaleValue={0.95}>
          <View style={styles.btnRow}>
            <CalendarPlus size={iconSize.listItem} color={colors.text.tertiary} weight="bold" />
            <Text style={styles.sheetActionTextSecondary}>+3 dni</Text>
          </View>
        </PressableScale>
      </View>

      {/* View full detail */}
      <PressableScale style={styles.sheetDetailBtn} onPress={() => onViewDetail(lead)} scaleValue={0.97}>
        <Text style={styles.sheetDetailText}>Szczegoly</Text>
      </PressableScale>
    </View>
  );
}

export default function PipelineScreen() {
  const router = useRouter();
  const activeFilter = useUIStore((s) => s.activeTab);
  const setActiveFilter = useUIStore((s) => s.setActiveTab);
  const { data: leads = [], isLoading, isRefetching, isError, error, refetch } = useLeads(activeFilter);

  // Bottom sheet state (native only)
  const bottomSheetRef = useRef<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const snapPoints = useMemo(() => ['45%', '70%'], []);

  const handleCardPress = useCallback((lead: any) => {
    if (Platform.OS === 'web' || !BottomSheet) {
      router.push(`/lead/${lead.id}` as any);
    } else {
      setSelectedLead(lead);
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [router]);

  const handleViewDetail = useCallback((lead: any) => {
    bottomSheetRef.current?.close();
    router.push(`/lead/${lead.id}` as any);
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

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      setSelectedLead(null);
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <LeadCard
      lead={item}
      onFollowUp={handleFollowUp}
      onCall={handleCall}
      onPostpone={handlePostpone}
      onPress={handleCardPress}
    />
  ), [handleFollowUp, handleCall, handlePostpone, handleCardPress]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const ListHeaderComponent = useMemo(() => (
    <View>
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <PressableScale
            key={f.label}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
            scaleValue={0.95}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Error */}
      {isError && (
        <ErrorBanner
          message={error?.message || 'Nie udalo sie zaladowac pipeline'}
          onRetry={refetch}
        />
      )}

      {/* Summary */}
      <Text style={styles.summary}>
        {leads.length} leadow {'\u00B7'} {leads.reduce((s: number, l: any) => s + l.value, 0).toLocaleString('pl-PL')} PLN
      </Text>
    </View>
  ), [activeFilter, setActiveFilter, isError, error, refetch, leads]);

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Brak leadow w tym filtrze</Text>
      </View>
    );
  }, [isLoading]);

  if (isLoading && leads.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <PipelineSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <FlashList
        data={leads}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.flashListContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent.default}
          />
        }
      />

      {/* Bottom Sheet — native only */}
      {Platform.OS !== 'web' && BottomSheet && BottomSheetView && (
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          onChange={handleSheetChange}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetView style={styles.sheetInner}>
            <LeadPreviewSheet
              lead={selectedLead}
              onFollowUp={handleFollowUp}
              onCall={handleCall}
              onPostpone={handlePostpone}
              onViewDetail={handleViewDetail}
            />
          </BottomSheetView>
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: colors.bg.base },
  flashListContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 100 },
  filterRow: { flexDirection: 'row', marginBottom: spacing.base, flexGrow: 0 },
  filterChip: {
    paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.full,
    backgroundColor: colors.bg.elevated, marginRight: spacing.sm,
    minHeight: 44, justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: colors.accent.decorative },
  filterText: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary },
  filterTextActive: { color: '#fff', fontWeight: typography.weight.semibold },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.base },
  loadingText: { marginTop: spacing.base, fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary },
  empty: { alignItems: 'center', paddingTop: spacing['5xl'] },
  emptyText: { fontSize: typography.size.callout, fontWeight: typography.weight.semibold, color: colors.text.tertiary },
  summary: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginBottom: spacing.base, fontVariant: ['tabular-nums'] },
  card: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.base, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  cardName: { fontSize: typography.size.body, fontWeight: typography.weight.bold, color: colors.text.primary, flexShrink: 1 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardValue: { fontSize: typography.size.subheadline, fontWeight: typography.weight.semibold, color: colors.accent.default, fontVariant: ['tabular-nums'] },
  cardCompany: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginTop: 2, marginLeft: 18 },
  cardMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 10 },
  metaText: { fontSize: typography.size.caption1, fontWeight: typography.weight.medium, color: colors.text.tertiary, fontVariant: ['tabular-nums'] },
  metaTextStale: { color: colors.warning },
  textOverdue: { color: colors.danger, fontSize: typography.size.caption1, fontWeight: typography.weight.semibold, fontVariant: ['tabular-nums'] },
  nextStep: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginTop: spacing.sm, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionBtn: {
    paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.accent.muted,
    minHeight: 44, justifyContent: 'center',
  },
  actionBtnSecondary: {
    paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    minHeight: 44, justifyContent: 'center',
  },
  actionText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.accent.default },
  actionTextSecondary: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.text.tertiary },
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
  // Bottom Sheet
  sheetBackground: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
  },
  sheetHandle: { backgroundColor: colors.bg.elevated, width: 40 },
  sheetInner: { flex: 1 },
  sheetContent: { padding: spacing.xl },
  sheetName: { fontSize: typography.size.title2, fontWeight: typography.weight.bold, color: colors.text.primary },
  sheetCompany: { fontSize: typography.size.subheadline, fontWeight: typography.weight.medium, color: colors.text.tertiary, marginTop: spacing.xs },
  sheetStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.base },
  sheetStatusText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold },
  sheetValue: {
    fontSize: typography.size.title3, fontWeight: typography.weight.bold, color: colors.accent.default,
    marginTop: spacing.md, fontVariant: ['tabular-nums'],
  },
  sheetMetaSection: { marginTop: spacing.lg, gap: spacing.base },
  sheetMetaRow: { gap: spacing.xs },
  sheetMetaLabel: { fontSize: typography.size.caption1, fontWeight: typography.weight.medium, color: colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sheetMetaValue: { fontSize: typography.size.subheadline, fontWeight: typography.weight.medium, color: colors.text.primary, fontVariant: ['tabular-nums'] },
  sheetNextStep: { fontSize: typography.size.subheadline, fontWeight: typography.weight.medium, color: colors.text.primary, fontStyle: 'italic' },
  sheetOverdue: { fontSize: typography.size.subheadline, fontWeight: typography.weight.semibold, color: colors.danger, fontVariant: ['tabular-nums'] },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  sheetActionBtn: {
    flex: 1, paddingVertical: spacing.base, borderRadius: 10,
    backgroundColor: colors.accent.muted,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 48,
  },
  sheetActionBtnSecondary: {
    flex: 1, paddingVertical: spacing.base, borderRadius: 10,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 48,
  },
  sheetActionText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.accent.default },
  sheetActionTextSecondary: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.text.tertiary },
  sheetDetailBtn: {
    marginTop: spacing.base, paddingVertical: spacing.base, borderRadius: radius.lg,
    backgroundColor: colors.accent.decorative,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 52,
  },
  sheetDetailText: { fontSize: typography.size.callout, fontWeight: typography.weight.bold, color: '#fff' },
});
