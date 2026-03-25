import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import Colors from '@/constants/Colors';
import * as api from '@/lib/api';

const { colors } = Colors;

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmed = secretKey.trim();
    setError(null);

    if (!/^[0-9a-f]{64}$/i.test(trimmed)) {
      setError('Secret key musi miec 64 znaki hex (a-f, 0-9).');
      return;
    }

    setLoading(true);
    try {
      await api.authenticate(trimmed);
      onLogin();
    } catch (err: any) {
      setError(err?.message || 'Nieprawidlowy klucz lub blad sieci.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>System 10H</Text>
        <Text style={styles.subtitle}>Mobile Dashboard</Text>

        <Text style={styles.label}>Secret Key</Text>
        <TextInput
          style={styles.input}
          value={secretKey}
          onChangeText={(t) => { setSecretKey(t); setError(null); }}
          placeholder="64-char hex key..."
          placeholderTextColor={colors.text.secondary}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Polacz</Text>
          )}
        </Pressable>

        <Text style={styles.hint}>
          Klucz: MOBILE_SECRET_KEY z konfiguracji Workera
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg.base },
  inner: { padding: 30, alignItems: 'center', maxWidth: 400, alignSelf: 'center', width: '100%' },
  title: { fontSize: 32, fontWeight: '800', color: colors.text.primary, marginBottom: 4 },
  subtitle: { fontSize: 16, fontWeight: '500', color: colors.text.secondary, marginBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text.secondary, alignSelf: 'flex-start', marginBottom: 6 },
  input: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '500' },
  button: {
    width: '100%',
    backgroundColor: colors.purple.default,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { fontSize: 12, fontWeight: '500', color: colors.text.secondary, marginTop: 20, textAlign: 'center', opacity: 0.6 },
});
