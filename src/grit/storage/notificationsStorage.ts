import AsyncStorage from '@react-native-async-storage/async-storage';
import { clampRemindersPerDay } from '../onboarding/mapping';
import { REMINDERS_PER_DAY, TRAINING_TIME_PREFERENCE } from './keys';

const safeParseNumber = (value: string | null): number | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'number' ? parsed : null;
  } catch (error) {
    console.warn('Failed to parse remindersPerDay from storage', error);
    return null;
  }
};

export const loadRemindersPerDay = async (): Promise<number | null> => {
  const stored = await AsyncStorage.getItem(REMINDERS_PER_DAY);
  const parsed = safeParseNumber(stored);
  return clampRemindersPerDay(parsed ?? undefined);
};

export const saveRemindersPerDay = async (value: number): Promise<void> => {
  const clamped = clampRemindersPerDay(value);
  if (clamped == null) {
    throw new Error('Invalid remindersPerDay value');
  }
  await AsyncStorage.setItem(REMINDERS_PER_DAY, JSON.stringify(clamped));
};

export type TrainingTimePreference = 'morning' | 'afternoon' | 'night';

const isTrainingTimeValue = (value: unknown): value is TrainingTimePreference =>
  value === 'morning' || value === 'afternoon' || value === 'night';

export const loadTrainingTimePreference = async (): Promise<TrainingTimePreference | null> => {
  const stored = await AsyncStorage.getItem(TRAINING_TIME_PREFERENCE);
  if (!stored) {
    return null;
  }
  return isTrainingTimeValue(stored) ? stored : null;
};

export const saveTrainingTimePreference = async (
  value: TrainingTimePreference,
): Promise<void> => {
  if (!isTrainingTimeValue(value)) {
    throw new Error('Invalid training time value');
  }
  await AsyncStorage.setItem(TRAINING_TIME_PREFERENCE, value);
};
