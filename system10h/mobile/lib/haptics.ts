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
