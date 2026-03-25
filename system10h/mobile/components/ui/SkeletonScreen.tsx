// components/ui/SkeletonScreen.tsx — Skeleton loaders for all screens
import { Skeleton } from 'moti/skeleton';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/tokens';

const colorMode = 'dark' as const;

function Bone({ width, height, radius = 8 }: { width: number | `${number}%`; height: number; radius?: number }) {
  return <Skeleton colorMode={colorMode} colors={[colors.bg.surface, colors.bg.surfaceHover, colors.bg.surface]} width={width} height={height} radius={radius} />;
}

export function DashboardSkeleton() {
  return (
    <Skeleton.Group show>
      <View style={styles.container}>
        <Bone width="60%" height={20} />
        <View style={{ height: spacing.sm }} />
        <Bone width="40%" height={16} />
        <View style={[styles.row, { marginTop: spacing.lg }]}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.chip}><Bone width={60} height={28} radius={14} /></View>
          ))}
        </View>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.card, { marginTop: spacing.md }]}>
            <Bone width="70%" height={18} />
            <View style={{ height: spacing.sm }} />
            <Bone width="50%" height={14} />
            <View style={{ height: spacing.md }} />
            <View style={styles.row}>
              <Bone width={80} height={32} radius={8} />
              <View style={{ width: spacing.sm }} />
              <Bone width={80} height={32} radius={8} />
            </View>
          </View>
        ))}
      </View>
    </Skeleton.Group>
  );
}

export function PipelineSkeleton() {
  return (
    <Skeleton.Group show>
      <View style={styles.container}>
        <View style={styles.row}>
          {[1, 2, 3].map(i => <View key={i} style={{ marginRight: spacing.sm }}><Bone width={80} height={32} radius={16} /></View>)}
        </View>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.card, { marginTop: spacing.md }]}>
            <View style={styles.row}>
              <Bone width={12} height={12} radius={6} />
              <View style={{ width: spacing.sm }} />
              <Bone width="60%" height={18} />
            </View>
            <View style={{ height: spacing.sm }} />
            <Bone width="40%" height={14} />
          </View>
        ))}
      </View>
    </Skeleton.Group>
  );
}

export function DraftsSkeleton() {
  return (
    <Skeleton.Group show>
      <View style={styles.container}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.card, { marginTop: spacing.md }]}>
            <View style={styles.row}>
              <Bone width={70} height={20} radius={10} />
              <View style={{ flex: 1 }} />
              <Bone width={40} height={14} />
            </View>
            <View style={{ height: spacing.md }} />
            <Bone width="80%" height={16} />
            <View style={{ height: spacing.sm }} />
            <Bone width="100%" height={14} />
            <View style={{ height: spacing.xs }} />
            <Bone width="60%" height={14} />
          </View>
        ))}
      </View>
    </Skeleton.Group>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.base },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: colors.bg.surface, borderRadius: 12, padding: spacing.base, borderWidth: 1, borderColor: colors.border.subtle },
  chip: { marginRight: spacing.sm },
});
