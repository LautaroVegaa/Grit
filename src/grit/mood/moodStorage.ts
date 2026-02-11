import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLocalDateISO } from '@/utils/localTime';

import { DAILY_MOOD_DATE, DAILY_MOOD_DAY_PREFIX, DAILY_MOOD_VALUE } from './keys';
import { MOOD_VALUES, Mood } from './types';

const isMood = (value: unknown): value is Mood => {
  if (typeof value !== 'string') {
    return false;
  }
  return MOOD_VALUES.includes(value as Mood);
};

const getDayEntryKey = (dateISO: string): string => `${DAILY_MOOD_DAY_PREFIX}:${dateISO}`;

export const getMoodKeyForDate = (dateISO: string): string => getDayEntryKey(dateISO);

export const getTodayLocalDateKey = (reference: Date = new Date()): string => getLocalDateISO(reference);

export type DailyMoodState = {
  mood: Mood | null;
  date: string | null;
};

export const loadDailyMood = async (): Promise<DailyMoodState> => {
  const [value, date] = await Promise.all([
    AsyncStorage.getItem(DAILY_MOOD_VALUE),
    AsyncStorage.getItem(DAILY_MOOD_DATE),
  ]);

  return {
    mood: isMood(value) ? value : null,
    date: date ?? null,
  };
};

export const loadMoodForDate = async (dateKey: string): Promise<Mood | null> => {
  const stored = await AsyncStorage.getItem(getMoodKeyForDate(dateKey));
  if (isMood(stored)) {
    return stored;
  }
  const state = await loadDailyMood();
  if (state.date === dateKey) {
    return state.mood;
  }
  return null;
};

export const loadTodayMood = async (): Promise<Mood | null> => {
  const todayKey = getTodayLocalDateKey();
  return loadMoodForDate(todayKey);
};

export const saveDailyMood = async (mood: Mood, dateKey: string): Promise<void> => {
  await Promise.all([
    AsyncStorage.setItem(getMoodKeyForDate(dateKey), mood),
    AsyncStorage.multiSet([
      [DAILY_MOOD_VALUE, mood],
      [DAILY_MOOD_DATE, dateKey],
    ]),
  ]);
};

export const hasCompletedMoodToday = async (): Promise<boolean> => {
  const todayKey = getTodayLocalDateKey();
  const mood = await loadMoodForDate(todayKey);
  return Boolean(mood);
};

export const getTodaysMood = async (): Promise<Mood | null> => {
  const todayKey = getTodayLocalDateKey();
  return loadMoodForDate(todayKey);
};

export const setTodaysMood = async (mood: Mood): Promise<void> => {
  const todayKey = getTodayLocalDateKey();
  await saveDailyMood(mood, todayKey);
};

export const clearMoodForDev = async (): Promise<void> => {
  if (!__DEV__) {
    return;
  }
  const todayKey = getTodayLocalDateKey();
  await Promise.all([
    AsyncStorage.removeItem(DAILY_MOOD_VALUE),
    AsyncStorage.removeItem(DAILY_MOOD_DATE),
    AsyncStorage.removeItem(getMoodKeyForDate(todayKey)),
  ]);
};
