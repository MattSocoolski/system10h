import { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilSimple, PaperPlaneTilt, TrashSimple, FloppyDisk, XCircle } from 'phosphor-react-native';

import { colors, typography, spacing, radius, iconSize } from '@/constants/tokens';
import { PressableScale } from '@/components/ui/PressableScale';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { useDraft, useApproveDraft, useRejectDraft, queryKeys } from '@/lib/hooks';
import { updateDraftContent } from '@/lib/api';

export default function DraftPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: draft, isLoading, isError, error } = useDraft(id || '');
  const approveMutation = useApproveDraft();
  const rejectMutation = useRejectDraft();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  // Initialize edit fields when draft loads
  useEffect(() => {
    if (draft) {
      setEditSubject(draft.subject || '');
      setEditBody(draft.bodyPlain || draft.preview || '');
    }
  }, [draft]);

  // Update draft mutation
  const updateMutation = useMutation({
    mutationFn: (data: { subject?: string; body?: string }) =>
      updateDraftContent(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.draft(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts });
      setIsEditing(false);
    },
    onError: (err: any) => {
      const msg = err?.message || 'Nie udalo sie zapisac zmian.';
      if (Platform.OS === 'web') {
        window.alert(`Blad: ${msg}`);
      } else {
        Alert.alert('Blad', msg);
      }
    },
  });

  const handleApprove = useCallback(() => {
    if (!id) return;
    const doApprove = () => {
      approveMutation.mutate(id, {
        onSuccess: () => router.back(),
        onError: (err: any) => {
          if (Platform.OS === 'web') {
            window.alert(`Blad: ${err?.message}`);
          } else {
            Alert.alert('Blad', err?.message || 'Nie udalo sie wyslac.');
          }
        },
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Wyslac tego maila?')) doApprove();
    } else {
      Alert.alert('Wyslac maila?', `Do: ${draft?.to}`, [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Wyslij', style: 'default', onPress: doApprove },
      ]);
    }
  }, [id, draft, approveMutation, router]);

  const handleReject = useCallback(() => {
    if (!id) return;
    rejectMutation.mutate(id, {
      onSuccess: () => router.back(),
      onError: (err: any) => {
        if (Platform.OS === 'web') {
          window.alert(`Blad: ${err?.message}`);
        } else {
          Alert.alert('Blad', err?.message || 'Nie udalo sie odrzucic.');
        }
      },
    });
  }, [id, rejectMutation, router]);

  const handleStartEdit = useCallback(() => {
    if (draft) {
      setEditSubject(draft.subject || '');
      setEditBody(draft.bodyPlain || draft.preview || '');
    }
    setIsEditing(true);
  }, [draft]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    // Reset to original values
    if (draft) {
      setEditSubject(draft.subject || '');
      setEditBody(draft.bodyPlain || draft.preview || '');
    }
  }, [draft]);

  const handleSave = useCallback(() => {
    if (!id) return;
    const updates: { subject?: string; body?: string } = {};
    if (editSubject !== (draft?.subject || '')) updates.subject = editSubject;
    if (editBody !== (draft?.bodyPlain || draft?.preview || '')) updates.body = editBody;

    if (!updates.subject && !updates.body) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(updates);
  }, [id, editSubject, editBody, draft, updateMutation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Draft' }} />
        <ActivityIndicator size="large" color={colors.accent.decorative} />
        <Text style={styles.loadingText}>Ladowanie...</Text>
      </View>
    );
  }

  if (isError || !draft) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Blad' }} />
        <Text style={styles.errorText}>{error?.message || 'Nie udalo sie zaladowac draftu'}</Text>
        <PressableScale style={styles.retryBtn} onPress={() => router.back()} scaleValue={0.95}>
          <Text style={styles.retryText}>Wstecz</Text>
        </PressableScale>
      </View>
    );
  }

  const body = draft.bodyPlain || draft.preview || '';

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: isEditing ? 'Edycja draftu' : 'Podglad draftu' }} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Email header */}
        <View style={styles.emailHeader}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Do:</Text>
            <Text style={styles.headerValue}>{draft.to}</Text>
          </View>
          {draft.from && (
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Od:</Text>
              <Text style={styles.headerValue}>{draft.from}</Text>
            </View>
          )}
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Temat:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.headerValue, styles.subjectText, styles.editInput, styles.editSubjectInput]}
                value={editSubject}
                onChangeText={setEditSubject}
                placeholder="Temat wiadomosci"
                placeholderTextColor={colors.text.tertiary}
                maxLength={500}
              />
            ) : (
              <Text style={[styles.headerValue, styles.subjectText]}>{draft.subject}</Text>
            )}
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Data:</Text>
            <Text style={styles.headerValue}>
              {new Date(draft.createdAt).toLocaleString('pl-PL', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>AI:</Text>
            <ConfidenceBadge source={draft.source || 'autopilot'} />
          </View>
        </View>

        {/* Email body */}
        <View style={styles.bodyContainer}>
          <View style={styles.aiIndicator}>
            <Text style={styles.aiLabel}>AI Draft</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={[styles.bodyText, styles.editInput, styles.editBodyInput]}
              value={editBody}
              onChangeText={setEditBody}
              placeholder="Tresc wiadomosci"
              placeholderTextColor={colors.text.tertiary}
              multiline
              textAlignVertical="top"
              maxLength={50000}
            />
          ) : (
            <Text style={styles.bodyText} selectable>{body}</Text>
          )}
        </View>

        {draft.leadName && (
          <Text style={styles.leadTag}>Lead: {draft.leadName}</Text>
        )}
      </ScrollView>

      {/* Fixed bottom action bar */}
      {isEditing ? (
        <View style={styles.actionBar}>
          <PressableScale
            style={[styles.cancelEditBtn, updateMutation.isPending && styles.btnDisabled]}
            onPress={handleCancelEdit}
            disabled={updateMutation.isPending}
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <XCircle size={iconSize.inline} color={colors.text.primary} weight="bold" />
              <Text style={styles.cancelEditBtnText}>Anuluj</Text>
            </View>
          </PressableScale>

          <PressableScale
            style={[styles.saveBtn, updateMutation.isPending && styles.btnDisabled]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <FloppyDisk size={iconSize.inline} color={colors.bg.base} weight="bold" />
              <Text style={styles.saveBtnText}>
                {updateMutation.isPending ? 'Zapisuje...' : 'Zapisz'}
              </Text>
            </View>
          </PressableScale>
        </View>
      ) : (
        <View style={styles.actionBar}>
          <PressableScale
            style={[styles.rejectBtn, rejectMutation.isPending && styles.btnDisabled]}
            onPress={handleReject}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <TrashSimple size={iconSize.inline} color={colors.danger} weight="bold" />
              <Text style={styles.rejectBtnText}>
                {rejectMutation.isPending ? '...' : 'Odrzuc'}
              </Text>
            </View>
          </PressableScale>

          <PressableScale style={styles.editBtn} onPress={handleStartEdit} scaleValue={0.95}>
            <View style={styles.btnRow}>
              <PencilSimple size={iconSize.inline} color={colors.bg.base} weight="bold" />
              <Text style={styles.editBtnText}>Edytuj</Text>
            </View>
          </PressableScale>

          <PressableScale
            style={[styles.approveBtn, approveMutation.isPending && styles.btnDisabled]}
            onPress={handleApprove}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            scaleValue={0.95}
          >
            <View style={styles.btnRow}>
              <PaperPlaneTilt size={iconSize.inline} color={colors.bg.base} weight="bold" />
              <Text style={styles.approveBtnText}>
                {approveMutation.isPending ? 'Wysylam...' : 'Zatwierdz i wyslij'}
              </Text>
            </View>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 120 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.bg.base,
  },
  loadingText: { marginTop: spacing.base, fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.tertiary },
  errorText: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.danger, marginBottom: spacing.base },
  retryBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.xl,
    backgroundColor: colors.bg.surface, minHeight: 44, justifyContent: 'center',
  },
  retryText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.text.primary },

  // Email header
  emailHeader: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl, padding: spacing.base, marginBottom: spacing.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  headerRow: {
    flexDirection: 'row', marginBottom: spacing.sm,
  },
  headerLabel: {
    fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.text.tertiary, width: 60,
  },
  headerValue: {
    fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.text.primary, flex: 1,
  },
  subjectText: { fontWeight: typography.weight.bold, fontSize: typography.size.subheadline },

  // Email body
  bodyContainer: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl, padding: spacing.base,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderLeftWidth: 3, borderLeftColor: colors.accent.decorative,
  },
  aiIndicator: {
    backgroundColor: colors.accent.muted, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.sm + 2, marginBottom: spacing.md,
  },
  aiLabel: { fontSize: typography.size.caption2, fontWeight: typography.weight.semibold, color: colors.accent.default },
  bodyText: {
    fontSize: typography.size.subheadline, fontWeight: typography.weight.medium, color: colors.text.primary, lineHeight: typography.lineHeight.normal,
  },

  leadTag: {
    fontSize: typography.size.caption1, fontWeight: typography.weight.medium, color: colors.text.tertiary,
    marginTop: spacing.md, textAlign: 'center',
  },

  // Edit mode inputs
  editInput: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
  },
  editSubjectInput: {
    fontSize: typography.size.subheadline,
    fontWeight: typography.weight.bold,
  },
  editBodyInput: {
    fontSize: typography.size.subheadline,
    fontWeight: typography.weight.medium,
    lineHeight: typography.lineHeight.normal,
    minHeight: 200,
  },

  // Fixed bottom action bar
  actionBar: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.base, paddingBottom: spacing['2xl'],
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1, borderTopColor: colors.border.default,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rejectBtn: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: radius.xl,
    backgroundColor: colors.dangerMuted, minHeight: 48, justifyContent: 'center',
  },
  rejectBtnText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.danger },
  editBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.xl,
    backgroundColor: colors.info, alignItems: 'center',
    minHeight: 48, justifyContent: 'center',
  },
  editBtnText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.bg.base },
  approveBtn: {
    flex: 2, paddingVertical: spacing.md, borderRadius: radius.xl,
    backgroundColor: colors.success, alignItems: 'center',
    minHeight: 48, justifyContent: 'center',
  },
  approveBtnText: { fontSize: typography.size.footnote, fontWeight: typography.weight.bold, color: colors.bg.base },
  btnDisabled: { opacity: 0.5 },

  // Edit mode action bar buttons
  cancelEditBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.xl,
    backgroundColor: colors.bg.elevated, alignItems: 'center',
    minHeight: 48, justifyContent: 'center',
  },
  cancelEditBtnText: { fontSize: typography.size.footnote, fontWeight: typography.weight.semibold, color: colors.text.primary },
  saveBtn: {
    flex: 2, paddingVertical: spacing.md, borderRadius: radius.xl,
    backgroundColor: colors.info, alignItems: 'center',
    minHeight: 48, justifyContent: 'center',
  },
  saveBtnText: { fontSize: typography.size.footnote, fontWeight: typography.weight.bold, color: colors.bg.base },
});
