import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_KEYS } from './onboarding';

const LEGACY_PROFILE_NAME_KEY = 'grit.profile.name.v1';
const LEGACY_PROFILE_GENDER_KEY = 'grit.profile.gender.v1';
const PROFILE_NAME_KEY = ONBOARDING_KEYS.user_name;
const PROFILE_GENDER_KEY = ONBOARDING_KEYS.user_identity;
const NOTIFICATIONS_ENABLED_KEY = 'grit.profile.notificationsEnabled.v1';
const FEEDBACK_ENTRIES_KEY = 'grit.profile.feedbackEntries.v1';

const createId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse profile storage value', error);
    }
    return fallback;
  }
};

const normalizeName = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const getProfileName = async (): Promise<string | null> => {
  const [stored, legacy] = await Promise.all([
    AsyncStorage.getItem(PROFILE_NAME_KEY),
    AsyncStorage.getItem(LEGACY_PROFILE_NAME_KEY),
  ]);
  const normalizedStored = normalizeName(stored);
  if (normalizedStored) {
    if (legacy) {
      await AsyncStorage.removeItem(LEGACY_PROFILE_NAME_KEY);
    }
    return normalizedStored;
  }
  const normalizedLegacy = normalizeName(legacy);
  if (normalizedLegacy) {
    await AsyncStorage.setItem(PROFILE_NAME_KEY, normalizedLegacy);
    await AsyncStorage.removeItem(LEGACY_PROFILE_NAME_KEY);
    return normalizedLegacy;
  }
  return null;
};

export const getDisplayName = async (): Promise<string> => {
  const name = await getProfileName();
  return name ?? '';
};

export const setProfileName = async (value: string): Promise<void> => {
  const trimmed = value.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(PROFILE_NAME_KEY);
    await AsyncStorage.removeItem(LEGACY_PROFILE_NAME_KEY);
    return;
  }
  await AsyncStorage.setItem(PROFILE_NAME_KEY, trimmed);
  await AsyncStorage.removeItem(LEGACY_PROFILE_NAME_KEY);
};

export type ProfileGenderValue = 'male' | 'female' | 'others' | 'prefer_not_say';

const legacyGenderMap: Record<string, ProfileGenderValue> = {
  male: 'male',
  female: 'female',
  other: 'others',
  others: 'others',
  prefer_not_to_say: 'prefer_not_say',
  prefer_not_say: 'prefer_not_say',
};

const isProfileGenderValue = (value: unknown): value is ProfileGenderValue =>
  value === 'male' || value === 'female' || value === 'others' || value === 'prefer_not_say';

export const getProfileGender = async (): Promise<ProfileGenderValue | null> => {
  const [stored, legacy] = await Promise.all([
    AsyncStorage.getItem(PROFILE_GENDER_KEY),
    AsyncStorage.getItem(LEGACY_PROFILE_GENDER_KEY),
  ]);

  if (stored && isProfileGenderValue(stored)) {
    if (legacy) {
      await AsyncStorage.removeItem(LEGACY_PROFILE_GENDER_KEY);
    }
    return stored;
  }

  if (legacy) {
    const mapped = legacyGenderMap[legacy];
    if (mapped) {
      await AsyncStorage.setItem(PROFILE_GENDER_KEY, mapped);
      await AsyncStorage.removeItem(LEGACY_PROFILE_GENDER_KEY);
      return mapped;
    }
  }

  return null;
};

export const setProfileGender = async (value: ProfileGenderValue): Promise<void> => {
  if (!isProfileGenderValue(value)) {
    throw new Error('Invalid gender value');
  }
  await AsyncStorage.setItem(PROFILE_GENDER_KEY, value);
  await AsyncStorage.removeItem(LEGACY_PROFILE_GENDER_KEY);
};

export const getNotificationsEnabled = async (): Promise<boolean> => {
  const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (stored == null) {
    return true;
  }
  try {
    return JSON.parse(stored) === true;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse notifications enabled flag', error);
    }
    return true;
  }
};

export const setNotificationsEnabled = async (value: boolean): Promise<void> => {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(Boolean(value)));
};

export type FeedbackEntry = {
  id: string;
  message: string;
  createdAtISO: string;
};

const MAX_FEEDBACK_ENTRIES = 50;

export const loadFeedbackEntries = async (): Promise<FeedbackEntry[]> => {
  const stored = await AsyncStorage.getItem(FEEDBACK_ENTRIES_KEY);
  return safeParse<FeedbackEntry[]>(stored, []);
};

export const appendFeedbackEntry = async (message: string): Promise<void> => {
  const entries = await loadFeedbackEntries();
  const entry: FeedbackEntry = {
    id: createId(),
    message,
    createdAtISO: new Date().toISOString(),
  };
  entries.push(entry);
  const trimmed = entries.slice(-MAX_FEEDBACK_ENTRIES);
  await AsyncStorage.setItem(FEEDBACK_ENTRIES_KEY, JSON.stringify(trimmed));
};
