import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadRemindersPerDay, saveRemindersPerDay } from '@/grit/storage/notificationsStorage';
import { clampReminderCount, DEFAULT_REMINDER_COUNT } from '@/utils/reminderWindow';

import { DEFAULT_ONBOARDING_DATA, ONBOARDING_KEYS } from './onboarding';

export type ReminderWindow = {
  start: string;
  end: string;
};

export type ReminderSettings = ReminderWindow & {
  count: number;
};

const readEntries = async () => {
  const entries = await AsyncStorage.multiGet([
    ONBOARDING_KEYS.affirmations_notif_count,
    ONBOARDING_KEYS.affirmations_notif_start,
    ONBOARDING_KEYS.affirmations_notif_end,
  ]);
  return new Map(entries);
};

export const loadReminderSettings = async (): Promise<ReminderSettings> => {
  const [map, storedReminders] = await Promise.all([readEntries(), loadRemindersPerDay()]);
  const countString = map.get(ONBOARDING_KEYS.affirmations_notif_count);
  const start = map.get(ONBOARDING_KEYS.affirmations_notif_start) ?? DEFAULT_ONBOARDING_DATA.affirmations_notif_start;
  const end = map.get(ONBOARDING_KEYS.affirmations_notif_end) ?? DEFAULT_ONBOARDING_DATA.affirmations_notif_end;
  const fallbackCount = storedReminders ?? (countString ? Number(countString) : null) ?? DEFAULT_REMINDER_COUNT;
  const count = clampReminderCount(fallbackCount);
  return { count, start, end };
};

export const saveReminderSettings = async ({ count, start, end }: ReminderSettings): Promise<void> => {
  const safeCount = clampReminderCount(count);
  await AsyncStorage.multiSet([
    [ONBOARDING_KEYS.affirmations_notif_count, String(safeCount)],
    [ONBOARDING_KEYS.affirmations_notif_start, start],
    [ONBOARDING_KEYS.affirmations_notif_end, end],
  ]);
  await saveRemindersPerDay(safeCount);
};

export const loadReminderWindow = async (): Promise<ReminderWindow> => {
  const { start, end } = await loadReminderSettings();
  return { start, end };
};

export const saveReminderWindow = async (window: ReminderWindow): Promise<void> => {
  const { count } = await loadReminderSettings();
  await saveReminderSettings({ count, ...window });
};
