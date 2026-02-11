import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    STREAK_MODAL_LAST_SHOWN_DATE,
    STREAK_STATE,
} from '@/grit/storage/keys';
import { getDateFromLocalISO, getLocalDateISO } from '@/utils/localTime';

const LEGACY_STREAK_STATE_KEY = 'grit.profile.streakState.v1';

export type StreakState = {
  currentStreak: number;
  lastCompletedDateISO: string | null;
};

const DEFAULT_STATE: StreakState = {
  currentStreak: 0,
  lastCompletedDateISO: null,
};

const parseState = (value: string | null): StreakState => {
  if (!value) {
    return DEFAULT_STATE;
  }
  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      typeof parsed.currentStreak === 'number' &&
      (typeof parsed.lastCompletedDateISO === 'string' || parsed.lastCompletedDateISO === null)
    ) {
      return {
        currentStreak: Math.max(0, Math.floor(parsed.currentStreak)),
        lastCompletedDateISO: parsed.lastCompletedDateISO,
      };
    }
    return DEFAULT_STATE;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse streak state', error);
    }
    return DEFAULT_STATE;
  }
};
const parseLegacyState = (value: string | null): StreakState | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      typeof parsed.streakCount === 'number' &&
      (typeof parsed.lastOpenedDateISO === 'string' || parsed.lastOpenedDateISO === null)
    ) {
      return {
        currentStreak: Math.max(0, Math.floor(parsed.streakCount)),
        lastCompletedDateISO: parsed.lastOpenedDateISO,
      };
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse legacy streak state', error);
    }
  }
  return null;
};

export const getStreakState = async (): Promise<StreakState> => {
  const [stored, legacy] = await Promise.all([
    AsyncStorage.getItem(STREAK_STATE),
    AsyncStorage.getItem(LEGACY_STREAK_STATE_KEY),
  ]);

  if (stored) {
    return parseState(stored);
  }

  const legacyState = parseLegacyState(legacy);
  if (legacyState) {
    await saveStreakState(legacyState);
    await AsyncStorage.removeItem(LEGACY_STREAK_STATE_KEY);
    return legacyState;
  }

  return DEFAULT_STATE;
};

export const saveStreakState = async (state: StreakState): Promise<void> => {
  await AsyncStorage.setItem(STREAK_STATE, JSON.stringify(state));
};

const getYesterdayISOFrom = (todayISO: string): string => {
  const todayDate = getDateFromLocalISO(todayISO);
  todayDate.setDate(todayDate.getDate() - 1);
  return getLocalDateISO(todayDate);
};

export const markTodayCompleted = async (todayISO: string): Promise<StreakState> => {
  const currentState = await getStreakState();
  if (currentState.lastCompletedDateISO === todayISO) {
    return currentState;
  }

  const yesterdayISO = getYesterdayISOFrom(todayISO);
  const isConsecutive = currentState.lastCompletedDateISO === yesterdayISO;
  const nextState: StreakState = {
    currentStreak: isConsecutive ? currentState.currentStreak + 1 : 1,
    lastCompletedDateISO: todayISO,
  };
  await saveStreakState(nextState);
  return nextState;
};

export const getLastStreakModalShownDate = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STREAK_MODAL_LAST_SHOWN_DATE);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to load streak modal date', error);
    }
    return null;
  }
};

export const setLastStreakModalShownDate = async (dateISO: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STREAK_MODAL_LAST_SHOWN_DATE, dateISO);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to persist streak modal date', error);
    }
  }
};
