import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { colors } from '@/constants/tokens';
import {
  configureNotificationHandler,
  setupNotificationCategories,
  registerForPushNotifications,
  addNotificationResponseListener,
  scheduleSnoozedDraftReminder,
} from '@/lib/notifications';
import * as api from '@/lib/api';
import LoginScreen from '@/components/LoginScreen';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Configure notification foreground behavior (must be called outside component)
if (Platform.OS !== 'web') {
  configureNotificationHandler();
}

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: 2,
      refetchIntervalInBackground: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Custom dark theme with design system colors
const System10HDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg.base,
    card: colors.bg.base,
    text: colors.text.primary,
    border: colors.border.default,
    primary: colors.accent.decorative,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check existing token on startup
  useEffect(() => {
    (async () => {
      try {
        // Use same storage as api.ts (localStorage on web, SecureStore on native)
        if (Platform.OS === 'web') {
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
          setIsAuthenticated(!!token);
        } else {
          const SecureStore = await import('expo-secure-store');
          const token = await SecureStore.getItemAsync('auth_token');
          setIsAuthenticated(!!token);
        }
      } catch {
        setIsAuthenticated(false);
      }
      setAuthChecked(true);
    })();
  }, []);

  // Wire AppState changes to TanStack Query focusManager
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  // Push notifications
  useEffect(() => {
    if (Platform.OS === 'web') return;
    setupNotificationCategories();
    registerForPushNotifications();

    const sub = addNotificationResponseListener((action, draftId) => {
      if (action === 'APPROVE') {
        api.approveDraft(draftId).catch(console.error);
      } else if (action === 'REJECT') {
        api.rejectDraft(draftId).catch(console.error);
      } else if (action === 'SNOOZE') {
        scheduleSnoozedDraftReminder(draftId, 'Draft', 30).catch(console.error);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && authChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authChecked]);

  if (!loaded || !authChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={System10HDarkTheme}>
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? System10HDarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="lead/[id]"
              options={{
                headerShown: true,
                title: 'Lead',
                presentation: 'card',
                headerStyle: { backgroundColor: colors.bg.base },
                headerTintColor: colors.text.primary,
              }}
            />
            <Stack.Screen
              name="draft/[id]"
              options={{
                headerShown: true,
                title: 'Draft',
                presentation: 'card',
                headerStyle: { backgroundColor: colors.bg.base },
                headerTintColor: colors.text.primary,
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
