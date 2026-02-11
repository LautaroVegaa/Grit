import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../phrases';
import {
  ACTIVE_CATEGORIES,
  PHRASE_HISTORY,
  PHRASE_PACK_VERSION,
} from './keys';

const safeParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse storage value', error);
    return null;
  }
};

export const loadActiveCategories = async (): Promise<Category[] | null> => {
  const stored = await AsyncStorage.getItem(ACTIVE_CATEGORIES);
  return safeParse<Category[]>(stored);
};

export const saveActiveCategories = async (
  categories: Category[],
): Promise<void> => {
  await AsyncStorage.setItem(ACTIVE_CATEGORIES, JSON.stringify(categories));
};

export const loadPhraseHistory = async (): Promise<string[]> => {
  const stored = await AsyncStorage.getItem(PHRASE_HISTORY);
  return safeParse<string[]>(stored) ?? [];
};

export const savePhraseHistory = async (ids: string[]): Promise<void> => {
  await AsyncStorage.setItem(PHRASE_HISTORY, JSON.stringify(ids));
};

export const appendToPhraseHistory = async (
  id: string,
  max: number,
): Promise<void> => {
  if (max <= 0) {
    return;
  }

  const history = await loadPhraseHistory();
  history.push(id);

  const trimmed = history.slice(-max);
  await savePhraseHistory(trimmed);
};

export const loadPhrasePackVersion = async (): Promise<number | null> => {
  const stored = await AsyncStorage.getItem(PHRASE_PACK_VERSION);
  const parsed = safeParse<number>(stored);
  return typeof parsed === 'number' ? parsed : null;
};

export const savePhrasePackVersion = async (version: number): Promise<void> => {
  await AsyncStorage.setItem(
    PHRASE_PACK_VERSION,
    JSON.stringify(version),
  );
};
