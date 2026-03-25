import { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  PaperPlaneTilt,
  Phone,
  CalendarPlus,
  Plus,
  Envelope,
  PhoneCall,
  User,
} from 'phosphor-react-native';

import { colors, typography, spacing, radius, iconSize } from '@/constants/tokens';
import { PressableScale } from '@/components/ui/PressableScale';
import { useLead, useAddNote } from '@/lib/hooks';
import * as api from '@/lib/api';

// --- Constants ---

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
  closed_won: 'Wygrany',
  closed_lost: 'Przegrany',
};

const POSTPONE_OPTIONS = [
  { label: '+3 dni', days: 3 },
  { label: '+7 dni', days: 7 },
];

// --- Helpers ---

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function parseNotes(notes: string | null | undefined): { date: string; text: string }[] {
  if (!notes || !notes.trim()) return [];

  const entries: { date: string; text: string }[] = [];
  const regex = /\[(\d{4}-\d{2}-\d{2})\]\s*/g;
  let lastIndex = 0;
  let lastDate: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(notes)) !== null) {
    if (lastDate !== null) {
      const text = notes.slice(lastIndex, match.index).trim();
      if (text) entries.push({ date: lastDate, text });
    }
    lastDate = match[1];
    lastIndex = regex.lastIndex;
  }

  if (lastDate !== null) {
    const text = notes.slice(lastIndex).trim();
    if (text) entries.push({ date: lastDate, text });
  }

  if (entries.length === 0 && notes.trim()) {
    entries.push({ date: '', text: notes.trim() });
  }

  return entries;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  try {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// --- Section Components ---

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.textOverdue]}>{value}</Text>
    </View>
  );
}

function NoteEntry({ date, text }: { date: string; text: string }) {
  return (
    <View style={styles.noteEntry}>
      {date ? (
        <Text style={styles.noteDate}>{formatDate(date)}</Text>
      ) : null}
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

// --- Main Screen ---

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading, isRefetching, isError, error, refetch } = useLead(id || '');
  const addNote = useAddNote();

  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // --- Handlers ---

  const handleFollowUp = useCallback(() => {
    if (!lead) return;
    if (lead.email) {
      Linking.openURL(`mailto:${lead.email}?subject=Re: ${lead.company || lead.name}`);
    } else {
      const q = encodeURIComponent(lead.company || lead.name);
      Linking.openURL(`https://mail.google.com/mail/?view=cm&to=&su=Re: ${q}`);
    }
  }, [lead]);

  const handleCall = useCallback(() => {
    if (!lead) return;
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    } else {
      if (Platform.OS === 'web') {
        window.alert(`Brak numeru telefonu dla ${lead.name}`);
      } else {
        Alert.alert('Brak numeru', `${lead.name} nie ma numeru w CRM.`);
      }
    }
  }, [lead]);

  const handlePostpone = useCallback(async (days: number) => {
    if (!lead) return;
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
  }, [lead, refetch]);

  const handleAddNote = useCallback(async () => {
    if (!lead || !noteText.trim()) return;
    try {
      await addNote.mutateAsync({ leadId: lead.id, note: noteText.trim() });
      setNoteText('');
      setShowNoteInput(false);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Blad: ${err?.message}`);
      } else {
        Alert.alert('Blad', err?.message || 'Nie udalo sie dodac notatki.');
      }
    }
  }, [lead, noteText, addNote]);

  // --- Loading State ---

  if (isLoading && !lead) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.default} />
        <Text style={styles.loadingText}>Ladowanie leada...</Text>
      </View>
    );
  }

  if (isError && !lead) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error?.message || 'Nie udalo sie zaladowac leada'}</Text>
        <PressableScale style={styles.retryBtn} onPress={() => refetch()} scaleValue={0.95}>
          <Text style={styles.retryText}>Ponow</Text>
        </PressableScale>
      </View>
    );
  }

  if (!lead) return null;

  const statusColor = lead.daysOverdue > 0 ? colors.danger : (STATUS_COLORS[lead.status] || colors.status.frozen);
  const statusLabel = STATUS_LABELS[lead.status] || lead.status;
  const parsedNotes = parseNotes(lead.notes);

  return (
    <>
      <Stack.Screen
        options={{
          title: lead.name || 'Lead',
          headerStyle: { backgroundColor: colors.bg.base },
          headerTintColor: colors.text.primary,
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent.default} />}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.leadName}>{lead.name}</Text>
            {lead.company ? (
              <Text style={styles.leadCompany}>{lead.company}</Text>
            ) : null}
            <View style={styles.headerMeta}>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              {lead.value > 0 && (
                <Text style={styles.dealValue}>{lead.value.toLocaleString('pl-PL')} PLN</Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <PressableScale style={styles.actionBtn} onPress={handleFollowUp} scaleValue={0.95}>
              <View style={styles.btnRow}>
                <PaperPlaneTilt size={iconSize.inline} color={colors.accent.default} weight="bold" />
                <Text style={styles.actionText}>Follow-up</Text>
              </View>
            </PressableScale>
            <PressableScale style={styles.actionBtn} onPress={handleCall} scaleValue={0.95}>
              <View style={styles.btnRow}>
                <Phone size={iconSize.inline} color={colors.accent.default} weight="bold" />
                <Text style={styles.actionText}>Zadzwon</Text>
              </View>
            </PressableScale>
            {POSTPONE_OPTIONS.map((opt) => (
              <PressableScale
                key={opt.days}
                style={styles.actionBtnSecondary}
                onPress={() => handlePostpone(opt.days)}
                scaleValue={0.95}
              >
                <View style={styles.btnRow}>
                  <CalendarPlus size={iconSize.inline} color={colors.text.tertiary} weight="bold" />
                  <Text style={styles.actionTextSecondary}>{opt.label}</Text>
                </View>
              </PressableScale>
            ))}
          </View>

          {/* Info Cards */}
          <View style={styles.infoGrid}>
            <InfoCard
              label="Ostatni kontakt"
              value={formatDate(lead.lastContact)}
            />
            <InfoCard
              label="Due date"
              value={formatDate(lead.due)}
              highlight={lead.daysOverdue > 0}
            />
            {lead.daysOverdue > 0 && (
              <InfoCard
                label="Days overdue"
                value={`${lead.daysOverdue} dni`}
                highlight
              />
            )}
            {lead.nextStep ? (
              <View style={styles.infoCardFull}>
                <Text style={styles.infoLabel}>Nastepny krok</Text>
                <Text style={[styles.infoValue, { fontStyle: 'italic' }]}>{lead.nextStep}</Text>
              </View>
            ) : null}
          </View>

          {/* Notes / Historia */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HISTORIA</Text>
            {parsedNotes.length > 0 ? (
              parsedNotes.map((entry, i) => (
                <NoteEntry key={`${entry.date}-${i}`} date={entry.date} text={entry.text} />
              ))
            ) : (
              <Text style={styles.emptyText}>Brak notatek</Text>
            )}

            {showNoteInput ? (
              <View style={styles.noteInputContainer}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Wpisz notatke..."
                  placeholderTextColor={colors.text.tertiary}
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline
                  autoFocus
                />
                <View style={styles.noteInputActions}>
                  <PressableScale
                    style={[styles.actionBtn, addNote.isPending && styles.actionBtnDisabled]}
                    onPress={handleAddNote}
                    disabled={addNote.isPending || !noteText.trim()}
                    scaleValue={0.95}
                  >
                    <Text style={styles.actionText}>
                      {addNote.isPending ? 'Zapisywanie...' : 'Zapisz'}
                    </Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.actionBtnSecondary}
                    onPress={() => { setShowNoteInput(false); setNoteText(''); }}
                    scaleValue={0.95}
                  >
                    <Text style={styles.actionTextSecondary}>Anuluj</Text>
                  </PressableScale>
                </View>
              </View>
            ) : (
              <PressableScale style={styles.addNoteBtn} onPress={() => setShowNoteInput(true)} scaleValue={0.95}>
                <View style={styles.btnRow}>
                  <Plus size={iconSize.inline} color={colors.accent.default} weight="bold" />
                  <Text style={styles.addNoteBtnText}>Dodaj notatke</Text>
                </View>
              </PressableScale>
            )}
          </View>

          {/* Contact Info */}
          {(lead.email || lead.phone || lead.contactPerson) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>KONTAKT</Text>
              <View style={styles.contactCard}>
                {lead.contactPerson ? (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIconLabel}>
                      <User size={iconSize.inline} color={colors.text.tertiary} weight="bold" />
                      <Text style={styles.contactLabel}>Osoba</Text>
                    </View>
                    <Text style={styles.contactValue}>{lead.contactPerson}</Text>
                  </View>
                ) : null}
                {lead.email ? (
                  <PressableScale
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`mailto:${lead.email}`)}
                    scaleValue={0.98}
                    hapticType="selection"
                  >
                    <View style={styles.contactIconLabel}>
                      <Envelope size={iconSize.inline} color={colors.text.tertiary} weight="bold" />
                      <Text style={styles.contactLabel}>Email</Text>
                    </View>
                    <Text style={[styles.contactValue, styles.contactLink]}>{lead.email}</Text>
                  </PressableScale>
                ) : null}
                {lead.phone ? (
                  <PressableScale
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`tel:${lead.phone}`)}
                    scaleValue={0.98}
                    hapticType="selection"
                  >
                    <View style={styles.contactIconLabel}>
                      <PhoneCall size={iconSize.inline} color={colors.text.tertiary} weight="bold" />
                      <Text style={styles.contactLabel}>Telefon</Text>
                    </View>
                    <Text style={[styles.contactValue, styles.contactLink]}>{lead.phone}</Text>
                  </PressableScale>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg.base },
  scrollContent: { paddingBottom: 100 },
  container: { flex: 1, padding: spacing.lg },

  // Loading / Error
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.base },
  loadingText: { marginTop: spacing.base, fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary },
  errorText: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.danger, marginBottom: spacing.base, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: 'rgba(248,113,113,0.2)',
    minHeight: 44, justifyContent: 'center',
  },
  retryText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.danger },

  // Header
  headerSection: { marginBottom: spacing.lg },
  leadName: { fontSize: typography.size.title1 - 2, fontWeight: typography.weight.extrabold, color: colors.text.primary, marginBottom: 2 },
  leadCompany: { fontSize: typography.size.callout, fontWeight: typography.weight.medium, color: colors.text.secondary, marginBottom: spacing.sm },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, marginTop: spacing.xs },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold },
  dealValue: { fontSize: 18, fontWeight: typography.weight.bold, color: colors.accent.default, fontVariant: ['tabular-nums'] },

  // Quick Actions
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionBtn: {
    paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.accent.muted,
    minHeight: 44, justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnSecondary: {
    paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    minHeight: 44, justifyContent: 'center',
  },
  actionText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.accent.default },
  actionTextSecondary: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.text.tertiary },

  // Info Cards
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xl },
  infoCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  infoCardFull: {
    width: '100%',
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  infoLabel: { fontSize: typography.size.caption2, fontWeight: typography.weight.semibold, color: colors.text.tertiary, letterSpacing: 0.5, marginBottom: spacing.xs },
  infoValue: { fontSize: typography.size.subheadline, fontWeight: typography.weight.semibold, color: colors.text.primary, fontVariant: ['tabular-nums'] },
  textOverdue: { color: colors.danger },

  // Section
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: typography.size.caption1, fontWeight: typography.weight.bold, color: colors.text.tertiary, letterSpacing: 1, marginBottom: spacing.md },
  contactCard: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },

  // Notes
  noteEntry: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.base, marginBottom: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: 'rgba(168,85,247,0.3)',
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  noteDate: { fontSize: typography.size.caption2, fontWeight: typography.weight.semibold, color: colors.text.tertiary, marginBottom: spacing.xs, fontVariant: ['tabular-nums'] },
  noteText: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.tight, color: colors.text.primary },
  emptyText: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary, fontStyle: 'italic' },

  // Note Input
  noteInputContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  noteInput: {
    fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.primary, minHeight: 80,
    textAlignVertical: 'top',
  },
  noteInputActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 10 },
  addNoteBtn: {
    marginTop: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.base,
    borderRadius: radius.md, backgroundColor: 'rgba(168,85,247,0.1)',
    alignSelf: 'flex-start',
    minHeight: 44, justifyContent: 'center',
  },
  addNoteBtnText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.accent.default },

  // Contact
  contactRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
    minHeight: 44,
  },
  contactIconLabel: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  contactLabel: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.text.tertiary },
  contactValue: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.primary },
  contactLink: { color: colors.accent.default },
});
