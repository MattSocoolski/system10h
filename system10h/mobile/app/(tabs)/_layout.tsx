import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ChartBar, Funnel, EnvelopeSimple } from 'phosphor-react-native';

import { colors, typography, spacing, iconSize } from '@/constants/tokens';
import { useDashboard } from '@/lib/hooks';

export default function TabLayout() {
  const { data: dashboard } = useDashboard();
  const draftsCount = dashboard?.recentDrafts || 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent.decorative,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
          backgroundColor: colors.bg.surface,
          paddingBottom: spacing.lg,
          height: 70,
        },
        tabBarLabelStyle: { fontSize: typography.size.caption1, fontWeight: typography.weight.semibold },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.bg.base,
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: typography.weight.bold, fontSize: 18, color: colors.text.primary },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <ChartBar weight={focused ? 'fill' : 'regular'} size={iconSize.tabBar} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: 'Pipeline',
          tabBarIcon: ({ color, focused }) => (
            <Funnel weight={focused ? 'fill' : 'regular'} size={iconSize.tabBar} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="drafts"
        options={{
          title: 'Drafty',
          tabBarIcon: ({ color, focused }) => (
            <EnvelopeSimple weight={focused ? 'fill' : 'regular'} size={iconSize.tabBar} color={color} />
          ),
          tabBarBadge: draftsCount > 0 ? draftsCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent.decorative, fontSize: typography.size.caption2 },
        }}
      />
    </Tabs>
  );
}
