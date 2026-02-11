import { PHRASE_PACK_V1 } from './phrasePack.v1';
import { CATEGORIES, Category, Phrase, Tone } from './types';
import { createRng, deterministicShuffle, hashString } from './utils/random';

export type DayPart = 'morning' | 'afternoon' | 'night';

export interface SelectionContext {
  dateISO: string;
  dayPart: DayPart;
  activeCategories: Category[];
  itemsPerDay: number;
  historyIds: string[];
}

export interface SelectedPhrase {
  phrase: Phrase;
  reason: string;
}

export interface SelectionResult {
  dateISO: string;
  dayPart: DayPart;
  items: SelectedPhrase[];
  usedCategoryCounts: Record<Category, number>;
  skippedDueToHistory: number;
  fallbackUsed: boolean;
}

const MIN_ITEMS_PER_DAY = 1;
const MAX_ITEMS_PER_DAY = 20;
export const HISTORY_EXCLUSION_WINDOW = 40;

const DAYPART_CATEGORY_WEIGHTS: Record<DayPart, Partial<Record<Category, number>>> = {
  morning: {
    Discipline: 1.3,
    Mindset: 1.2,
    Focus: 1.2,
    Consistency: 1.1,
    Confidence: 1.1,
  },
  afternoon: {
    Training: 1.3,
    Strength: 1.2,
    Consistency: 1.1,
    Nutrition: 1.1,
    Focus: 1.05,
  },
  night: {
    Recovery: 1.4,
    Mindset: 1.1,
    Confidence: 1.1,
    Nutrition: 1.05,
    Discipline: 1.05,
  },
};

const TONES: Tone[] = ['push', 'grounding', 'reality-check', 'recovery'];

const PHRASES_BY_CATEGORY: Record<Category, Phrase[]> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category] = PHRASE_PACK_V1.phrases.filter(
      (phrase) => phrase.category === category,
    );
    return acc;
  },
  {} as Record<Category, Phrase[]>,
);

export const selectPhrases = (input: SelectionContext): SelectionResult => {
  const clampedItems = clampItemsPerDay(input.itemsPerDay);
  const normalizedCategories = dedupeCategories(
    input.activeCategories.length ? input.activeCategories : [...CATEGORIES],
  );
  const fallbackCategories = CATEGORIES.filter(
    (category) => !normalizedCategories.includes(category),
  );

  const historyWindow = input.historyIds.slice(-HISTORY_EXCLUSION_WINDOW);
  const historySet = new Set(historyWindow);
  const rng = createRng(
    createSeed(input, normalizedCategories, historyWindow, clampedItems),
  );

  const usedIds = new Set<string>();
  const toneUsage = createToneUsageRecord();
  const usedCategoryCounts = createCategoryCountRecord();
  const items: SelectedPhrase[] = [];
  let fallbackUsed = false;
  let lastCategory: Category | null = null;

  const relevantCategories = new Set<Category>([
    ...normalizedCategories,
    ...fallbackCategories,
  ]);
  const skippedDueToHistory = computeSkippedDueToHistory(
    historySet,
    relevantCategories,
  );

  const maxIterations = clampedItems * 10;
  let iterations = 0;

  while (items.length < clampedItems && iterations < maxIterations) {
    iterations += 1;

    const hasPrimaryAvailability = hasAvailableCategory(
      normalizedCategories,
      usedIds,
    );
    const useFallbackPool =
      !hasPrimaryAvailability && fallbackCategories.length > 0;
    const candidateCategories = useFallbackPool
      ? fallbackCategories
      : normalizedCategories;

    const category = pickCategory(
      candidateCategories,
      input.dayPart,
      usedCategoryCounts,
      lastCategory,
      usedIds,
      historySet,
      rng,
    );

    if (!category) {
      if (!useFallbackPool && fallbackCategories.length > 0) {
        continue;
      }
      break;
    }

    const phraseResult = pickPhraseForCategory(
      category,
      useFallbackPool,
      usedIds,
      historySet,
      toneUsage,
      rng,
    );

    if (!phraseResult) {
      continue;
    }

    const { phrase, reason } = phraseResult;
    items.push({ phrase, reason });
    usedIds.add(phrase.id);
    usedCategoryCounts[phrase.category] += 1;
    toneUsage[phrase.tone] += 1;
    lastCategory = phrase.category;

    if (reason !== 'weighted_selection') {
      fallbackUsed = true;
    }
  }

  if (items.length < clampedItems) {
    const remaining = clampedItems - items.length;
    const fillerPool = deterministicShuffle(
      PHRASE_PACK_V1.phrases.filter((phrase) => !usedIds.has(phrase.id)),
      rng,
    );

    for (let i = 0; i < remaining && i < fillerPool.length; i += 1) {
      const phrase = fillerPool[i];
      items.push({ phrase, reason: 'pool_exhausted' });
      usedIds.add(phrase.id);
      usedCategoryCounts[phrase.category] += 1;
      toneUsage[phrase.tone] += 1;
      fallbackUsed = true;
    }
  }

  return {
    dateISO: input.dateISO,
    dayPart: input.dayPart,
    items,
    usedCategoryCounts,
    skippedDueToHistory,
    fallbackUsed,
  };
};

const clampItemsPerDay = (value: number): number => {
  if (!Number.isFinite(value)) {
    return MIN_ITEMS_PER_DAY;
  }
  const rounded = Math.round(value);
  if (rounded < MIN_ITEMS_PER_DAY) {
    return MIN_ITEMS_PER_DAY;
  }
  if (rounded > MAX_ITEMS_PER_DAY) {
    return MAX_ITEMS_PER_DAY;
  }
  return rounded;
};

const dedupeCategories = (categories: Category[]): Category[] => {
  const seen = new Set<Category>();
  const result: Category[] = [];
  categories.forEach((category) => {
    if (!seen.has(category)) {
      seen.add(category);
      result.push(category);
    }
  });
  return result;
};

const createToneUsageRecord = (): Record<Tone, number> => {
  return TONES.reduce<Record<Tone, number>>((acc, tone) => {
    acc[tone] = 0;
    return acc;
  }, {} as Record<Tone, number>);
};

const createCategoryCountRecord = (): Record<Category, number> => {
  return CATEGORIES.reduce<Record<Category, number>>((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {} as Record<Category, number>);
};

const createSeed = (
  context: SelectionContext,
  categories: Category[],
  historyWindow: string[],
  itemsPerDay: number,
): number => {
  const base = `${context.dateISO}|${context.dayPart}|${itemsPerDay}|${categories.join(',')}|${historyWindow.join(',')}`;
  return hashString(base);
};

const hasAvailableCategory = (
  categories: Category[],
  usedIds: Set<string>,
): boolean =>
  categories.some((category) =>
    PHRASES_BY_CATEGORY[category].some((phrase) => !usedIds.has(phrase.id)),
  );

const computeSkippedDueToHistory = (
  historySet: Set<string>,
  categories: Set<Category>,
): number => {
  let count = 0;
  PHRASE_PACK_V1.phrases.forEach((phrase) => {
    if (categories.has(phrase.category) && historySet.has(phrase.id)) {
      count += 1;
    }
  });
  return count;
};

const pickCategory = (
  categories: Category[],
  dayPart: DayPart,
  usedCategoryCounts: Record<Category, number>,
  lastCategory: Category | null,
  usedIds: Set<string>,
  historySet: Set<string>,
  rng: () => number,
): Category | null => {
  const weighted: { value: Category; weight: number }[] = [];

  categories.forEach((category) => {
    const available = PHRASES_BY_CATEGORY[category].filter(
      (phrase) => !usedIds.has(phrase.id),
    );
    if (!available.length) {
      return;
    }
    const freshCount = available.filter(
      (phrase) => !historySet.has(phrase.id),
    ).length;
    const dayPartWeight = DAYPART_CATEGORY_WEIGHTS[dayPart][category] ?? 1;
    const usagePenalty = 1 / (1 + usedCategoryCounts[category]);
    const consecutivePenalty = lastCategory === category ? 0.65 : 1;
    const freshnessBoost = freshCount > 0 ? 1.25 : 0.75;
    const weight =
      dayPartWeight * usagePenalty * consecutivePenalty * freshnessBoost;
    weighted.push({ value: category, weight });
  });

  if (!weighted.length) {
    return null;
  }

  return weightedPick(weighted, rng);
};

const pickPhraseForCategory = (
  category: Category,
  useFallbackPool: boolean,
  usedIds: Set<string>,
  historySet: Set<string>,
  toneUsage: Record<Tone, number>,
  rng: () => number,
): { phrase: Phrase; reason: string } | null => {
  const available = PHRASES_BY_CATEGORY[category].filter(
    (phrase) => !usedIds.has(phrase.id),
  );
  if (!available.length) {
    return null;
  }

  const fresh = available.filter((phrase) => !historySet.has(phrase.id));
  const pool = fresh.length ? fresh : available;
  const reason = fresh.length
    ? useFallbackPool
      ? 'pool_exhausted'
      : 'weighted_selection'
    : 'history_fallback';

  const phrase = pickPhraseByTonePreference(pool, toneUsage, rng);

  return { phrase, reason };
};

const pickPhraseByTonePreference = (
  phrases: Phrase[],
  toneUsage: Record<Tone, number>,
  rng: () => number,
): Phrase => {
  const weighted = phrases.map((phrase) => ({
    value: phrase,
    weight: 1 / (1 + toneUsage[phrase.tone]),
  }));
  return weightedPick(weighted, rng);
};

const weightedPick = <T>(
  items: { value: T; weight: number }[],
  rng: () => number,
): T => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) {
    return items[0]?.value;
  }
  const target = rng() * totalWeight;
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.weight;
    if (target <= cumulative) {
      return item.value;
    }
  }
  return items[items.length - 1].value;
};

