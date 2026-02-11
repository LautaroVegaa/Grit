import AsyncStorage from '@react-native-async-storage/async-storage';

import { LIKED_PHRASES, SAVED_PHRASES } from './keys';

const safeParseIds = async (key: string): Promise<Set<string>> => {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) {
      return new Set();
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((value): value is string => typeof value === 'string'));
    }
  } catch (error) {
    console.warn('Failed to parse phrase action storage', key, error);
  }
  return new Set();
};

const persistIds = async (key: string, ids: Set<string>): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(Array.from(ids)));
};

const toggleIdFactory = (key: string) =>
  async (phraseId: string): Promise<boolean> => {
    const ids = await safeParseIds(key);
    if (ids.has(phraseId)) {
      ids.delete(phraseId);
      await persistIds(key, ids);
      return false;
    }
    ids.add(phraseId);
    await persistIds(key, ids);
    return true;
  };

const loadIdsFactory = (key: string) => async (): Promise<string[]> => {
  const ids = await safeParseIds(key);
  return Array.from(ids);
};

export const loadLikedPhraseIds = loadIdsFactory(LIKED_PHRASES);
export const toggleLikedPhraseId = toggleIdFactory(LIKED_PHRASES);

export const loadSavedPhraseIds = loadIdsFactory(SAVED_PHRASES);
export const toggleSavedPhraseId = toggleIdFactory(SAVED_PHRASES);
