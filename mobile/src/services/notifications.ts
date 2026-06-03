/**
 * Local notification service (expo-notifications, SDK 56). Wraps the platform
 * API for medication reminders: permission flow, an Android channel, and daily
 * scheduling. Notifications are local-only (no push) and unsupported on web.
 *
 * The native module is loaded lazily (via `getNotifications`) so it never
 * executes on web — every entry point early-returns there, and deferring the
 * require also avoids expo-notifications' web push-token warning at startup.
 * Side effects are isolated here; the schedule is built by the pure
 * {@link file://../domain/reminders.ts} helpers.
 */

import { Platform } from 'react-native';

import { logger } from '../utils/logger';

export type ReminderPermission = 'granted' | 'denied' | 'unsupported';

/** One daily reminder to schedule. */
export interface ReminderNotification {
  readonly hour: number;
  readonly minute: number;
  readonly title: string;
  readonly body: string;
}

type NotificationsModule = typeof import('expo-notifications');

const SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';
const ANDROID_CHANNEL_ID = 'medication-reminders';

let cachedModule: NotificationsModule | null = null;
let handlerConfigured = false;
let channelConfigured = false;

/** Lazily load expo-notifications. Only called on native (callers guard on web). */
function getNotifications(): NotificationsModule {
  cachedModule ??= require('expo-notifications') as NotificationsModule;
  return cachedModule;
}

/** Show reminders as a banner while the app is foregrounded. Idempotent. */
function configureHandler(notifications: NotificationsModule): void {
  if (handlerConfigured) return;
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerConfigured = true;
}

/** Android 13+ requires a channel before notifications appear. Idempotent. */
async function ensureAndroidChannel(notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android' || channelConfigured) return;
  await notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Medication reminders',
    importance: notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  channelConfigured = true;
}

/**
 * Request notification permission, returning a coarse result. Already-granted
 * permission short-circuits without re-prompting.
 */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!SUPPORTED) return 'unsupported';
  try {
    const notifications = getNotifications();
    const current = await notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    const requested = await notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return requested.granted ? 'granted' : 'denied';
  } catch (error) {
    logger.error('Failed to request notification permission', { error: String(error) });
    return 'denied';
  }
}

/**
 * Replace all scheduled reminders with the given set (cancel-then-reschedule so
 * removed medications/times drop out cleanly). Reminders are the only thing this
 * app schedules, so a blanket cancel is safe.
 */
export async function syncMedicationReminders(items: readonly ReminderNotification[]): Promise<void> {
  if (!SUPPORTED) return;
  try {
    const notifications = getNotifications();
    configureHandler(notifications);
    await ensureAndroidChannel(notifications);
    await notifications.cancelAllScheduledNotificationsAsync();
    for (const item of items) {
      await notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DAILY,
          hour: item.hour,
          minute: item.minute,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
    }
  } catch (error) {
    logger.error('Failed to sync medication reminders', { error: String(error) });
  }
}

/** Cancel every scheduled reminder. */
export async function cancelMedicationReminders(): Promise<void> {
  if (!SUPPORTED) return;
  try {
    await getNotifications().cancelAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error('Failed to cancel medication reminders', { error: String(error) });
  }
}
