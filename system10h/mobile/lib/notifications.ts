// System 10H Mobile — Push Notifications with actionable categories
//
// Categories:
//   DRAFT_REVIEW — approve / reject / snooze buttons on draft notifications
//
// Usage: call registerForPushNotifications() on app startup,
//        then setNotificationHandler() for foreground behavior.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ─── Notification categories with action buttons ─────────────────────────────

export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('DRAFT_REVIEW', [
    {
      identifier: 'APPROVE',
      buttonTitle: 'Zatwierdz',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'REJECT',
      buttonTitle: 'Odrzuc',
      options: { opensAppToForeground: false, isDestructive: true },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Za 30 min',
      options: { opensAppToForeground: false },
    },
  ]);
}

// ─── Foreground notification behavior ────────────────────────────────────────

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Push token registration ─────────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // Uses expo.extra.eas.projectId from app.json
  });
  const pushToken = tokenData.data;

  // Store locally for BFF registration
  await SecureStore.setItemAsync('push_token', pushToken);

  return pushToken;
}

// ─── Notification response handler (action button taps) ──────────────────────

export type NotificationActionHandler = (
  action: 'APPROVE' | 'REJECT' | 'SNOOZE',
  draftId: string
) => void;

export function addNotificationResponseListener(
  onAction: NotificationActionHandler
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data as {
      draftId?: string;
      type?: string;
    };

    // Default tap (no action button) — just opens the app
    if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }

    if (
      data?.draftId &&
      (actionId === 'APPROVE' || actionId === 'REJECT' || actionId === 'SNOOZE')
    ) {
      onAction(actionId, data.draftId);
    }
  });
}

// ─── Schedule a local snooze reminder ────────────────────────────────────────

export async function scheduleSnoozedDraftReminder(
  draftId: string,
  subject: string,
  delayMinutes: number = 30
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Draft czeka na zatwierdzenie',
      body: subject,
      data: { draftId, type: 'draft_review' },
      categoryIdentifier: 'DRAFT_REVIEW',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
    },
  });
}

// ─── Badge management ────────────────────────────────────────────────────────

export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
