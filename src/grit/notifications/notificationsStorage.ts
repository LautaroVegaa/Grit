import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    LAST_SCHEDULED_DROPS_KEY,
    SCHEDULED_NOTIFICATION_IDS,
} from '../storage/keys';

const safeParseIds = (value: string | null): string[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch (error) {
    console.warn('Failed to parse scheduled notification ids', error);
    return [];
  }
};

export const loadScheduledNotificationIds = async (): Promise<string[]> => {
  const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATION_IDS);
  return safeParseIds(stored);
};

export const saveScheduledNotificationIds = async (
  ids: string[],
): Promise<void> => {
  await AsyncStorage.setItem(SCHEDULED_NOTIFICATION_IDS, JSON.stringify(ids));
};

export type TimezoneSignature = {
  timeZone?: string | null;
  offsetMinutes: number | null;
};

export type ScheduledDropsState = {
  key: string;
  timestamp: number;
  timeZone?: string | null;
  offsetMinutes?: number | null;
};

const resolveIntlTimeZone = (): string | null => {
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
    return null;
  }
  try {
    const options = Intl.DateTimeFormat().resolvedOptions();
    return options?.timeZone ?? null;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to resolve Intl timezone', error);
    }
    return null;
  }
};

export const getCurrentTimezoneSignature = (): TimezoneSignature => ({
  timeZone: resolveIntlTimeZone(),
  offsetMinutes: new Date().getTimezoneOffset(),
});

const parseScheduledState = (value: string | null): ScheduledDropsState | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.key === 'string') {
      return {
        key: parsed.key,
        timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
        timeZone: typeof parsed.timeZone === 'string' ? parsed.timeZone : undefined,
        offsetMinutes:
          typeof parsed.offsetMinutes === 'number' || parsed.offsetMinutes === null
            ? parsed.offsetMinutes
            : undefined,
      };
    }
  } catch (error) {
    // Legacy values were stored as plain strings. Fall through to legacy handler below.
    console.warn('Failed to parse scheduled state value, falling back to legacy format', error);
  }
  if (typeof value === 'string') {
    return { key: value, timestamp: 0 };
  }
  return null;
};

export const loadLastScheduledDropsState = async (): Promise<ScheduledDropsState | null> => {
  try {
    const stored = await AsyncStorage.getItem(LAST_SCHEDULED_DROPS_KEY);
    return parseScheduledState(stored);
  } catch (error) {
    console.warn('Failed to load last scheduled state', error);
    return null;
  }
};

export const saveLastScheduledDropsState = async (state: ScheduledDropsState): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_SCHEDULED_DROPS_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to set last scheduled state', error);
  }
};

// Backwards-compat helpers for legacy call sites. Remove once all imports migrate.
export const loadLastScheduledDropsKey = async (): Promise<string | null> => {
  const state = await loadLastScheduledDropsState();
  return state?.key ?? null;
};

export const saveLastScheduledDropsKey = async (key: string): Promise<void> => {
  const signature = getCurrentTimezoneSignature();
  await saveLastScheduledDropsState({
    key,
    timestamp: Date.now(),
    timeZone: signature.timeZone,
    offsetMinutes: signature.offsetMinutes,
  });
};

export const clearScheduledDropsState = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(SCHEDULED_NOTIFICATION_IDS),
    AsyncStorage.removeItem(LAST_SCHEDULED_DROPS_KEY),
  ]);
};
