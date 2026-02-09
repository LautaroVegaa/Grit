import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserPreferences = {
  liked: Record<string, boolean>;
  bookmarked: Record<string, boolean>;
  selectedCategories: string[];
};

const STORAGE_KEYS = {
  liked: 'grit_liked_quotes',
  bookmarked: 'grit_bookmarked_quotes',
  selectedCategories: 'grit_selected_categories',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  liked: {},
  bookmarked: {},
  selectedCategories: [],
};

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse stored preferences', error);
    }
    return fallback;
  }
}

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const entries = await AsyncStorage.multiGet([
      STORAGE_KEYS.liked,
      STORAGE_KEYS.bookmarked,
      STORAGE_KEYS.selectedCategories,
    ]);

    const liked = parseJSON<Record<string, boolean>>(entries[0]?.[1] ?? null, {});
    const bookmarked = parseJSON<Record<string, boolean>>(entries[1]?.[1] ?? null, {});
    const selectedCategories = parseJSON<string[]>(entries[2]?.[1] ?? null, []);

    return {
      liked,
      bookmarked,
      selectedCategories,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to load preferences', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }
}

async function saveJSON<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (__DEV__) {
      console.warn(`Failed to persist ${key}`, error);
    }
  }
}

export function saveLiked(liked: Record<string, boolean>) {
  return saveJSON(STORAGE_KEYS.liked, liked);
}

export function saveBookmarked(bookmarked: Record<string, boolean>) {
  return saveJSON(STORAGE_KEYS.bookmarked, bookmarked);
}

export function saveSelectedCategories(selectedCategories: string[]) {
  return saveJSON(STORAGE_KEYS.selectedCategories, selectedCategories);
}
