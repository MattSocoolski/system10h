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
    width: interpolate(expansion.value, [0, 1], [0, 65]),
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
          <Text style={{ fontSize: typography.size.subheadline, color: colors.accent.default }}>Anuluj</Text>
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
  input: { flex: 1, fontSize: typography.size.subheadline, color: colors.text.primary, paddingVertical: 0 },
});
