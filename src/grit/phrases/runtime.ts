import { CATEGORIES, Category } from './types';
import {
  DayPart,
  SelectionContext,
  SelectionResult,
  selectPhrases,
} from './engine';
import {
  loadActiveCategories,
  loadPhraseHistory,
  savePhraseHistory,
} from '../storage/phrasesStorage';

const HISTORY_TRACK_LIMIT = 200;

const sanitizeActiveCategories = (
  categories: Category[] | null,
): Category[] => {
  if (!categories || !categories.length) {
    return [...CATEGORIES];
  }

  const validSet = new Set<Category>(CATEGORIES);
  const deduped: Category[] = [];
  const seen = new Set<Category>();

  categories.forEach((category) => {
    if (validSet.has(category) && !seen.has(category)) {
      seen.add(category);
      deduped.push(category);
    }
  });

  return deduped.length ? deduped : [...CATEGORIES];
};

const toDateKey = (value?: string): string => {
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return formatDateKey(date);
    }
  }
  return formatDateKey(new Date());
};

const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

export const getDailyPhrases = async (
  dayPart: DayPart,
  itemsPerDay: number,
  dateISO?: string,
): Promise<SelectionResult> => {
  const normalizedDate = toDateKey(dateISO);
  const [storedCategories, historyIds] = await Promise.all([
    loadActiveCategories(),
    loadPhraseHistory(),
  ]);

  const activeCategories = sanitizeActiveCategories(storedCategories);

  const context: SelectionContext = {
    dateISO: normalizedDate,
    dayPart,
    activeCategories,
    itemsPerDay,
    historyIds,
  };

  const result = selectPhrases(context);

  return result;
};

export const commitDailyPhrases = async (
  result: SelectionResult,
  options?: { historyLimit?: number },
): Promise<void> => {
  const historyLimit = options?.historyLimit ?? HISTORY_TRACK_LIMIT;
  if (historyLimit <= 0) {
    return;
  }

  const existingHistory = await loadPhraseHistory();
  const appended = [...existingHistory, ...result.items.map((item) => item.phrase.id)];
  const trimmed = appended.slice(-historyLimit);
  await savePhraseHistory(trimmed);
};
