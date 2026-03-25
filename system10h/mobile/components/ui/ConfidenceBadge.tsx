import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, Warning, WarningCircle } from 'phosphor-react-native';
import { colors, typography, spacing } from '@/constants/tokens';

type Tier = 'high' | 'medium' | 'low';

interface Props {
  source?: string;
  confidence?: number;
}

function getTier(source?: string, confidence?: number): Tier {
  if (source === 'manual') return 'high';
  if (confidence !== undefined) {
    if (confidence >= 85) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
  }
  return source === 'autopilot' ? 'medium' : 'high';
}

const tierConfig = {
  high:   { label: 'Twoj styl',  color: colors.success,  bg: colors.successMuted, Icon: CheckCircle },
  medium: { label: 'Blisko',     color: colors.warning,  bg: colors.warningMuted, Icon: Warning },
  low:    { label: 'Do edycji',  color: colors.danger,   bg: colors.dangerMuted,  Icon: WarningCircle },
};

export function ConfidenceBadge({ source, confidence }: Props) {
  const tier = getTier(source, confidence);
  const { label, color, bg, Icon } = tierConfig[tier];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Icon size={14} color={color} weight="fill" />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 10, gap: 4 },
  label: { fontSize: typography.size.caption2, fontWeight: typography.weight.semibold },
});
