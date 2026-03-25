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
  children, scaleValue = scaleValues.cardPress, hapticType = 'light',
  onPressIn, onPressOut, style, ...props
}: Props) {
  const pressed = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressed.value }] }));
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
