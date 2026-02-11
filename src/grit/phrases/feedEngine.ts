import { PHRASE_PACK_V1 } from './phrasePack.v1';
import { CATEGORIES, Category, Phrase } from './types';
import { createRng, deterministicShuffle, hashString } from './utils/random';

const CURSOR_VERSION = 1;
const MIN_BATCH = 1;
const MAX_BATCH = 50;
const CURSOR_FALLBACK = 'all';

type CursorState = {
  v: number;
  key: string;
  generation: number;
  position: number;
};

export interface FeedRequest {
  batchSize: number;
  cursor?: string | null;
  allowedCategories?: Category[];
  excludeIds?: string[];
}

export interface FeedResponse {
  items: Phrase[];
  cursor: string | null;
  totalAvailable: number;
}

export const selectFeedBatch = (input: FeedRequest): FeedResponse => {
  const batchSize = clampBatchSize(input.batchSize);
  const allowedCategories = sanitizeCategories(input.allowedCategories);
  const categoriesKey = allowedCategories.length
    ? allowedCategories.join('|')
    : CURSOR_FALLBACK;
  const pool = buildPool(allowedCategories);

  if (!pool.length) {
    return {
      items: [],
      cursor: null,
      totalAvailable: 0,
    };
  }

  const cursorState = normalizeCursor(input.cursor, categoriesKey);
  const excludeSet = new Set(input.excludeIds ?? []);
  const seen = new Set<string>(excludeSet);

  let generation = cursorState?.generation ?? 0;
  let position = cursorState?.position ?? 0;
  let rng = createRng(createSeed(categoriesKey, generation));
  let order = deterministicShuffle(pool, rng);

  const items: Phrase[] = [];
  const maxIterations = pool.length * 6;
  let iterations = 0;

  while (items.length < batchSize && iterations < maxIterations) {
    iterations += 1;

    if (!order.length) {
      break;
    }

    if (position >= order.length) {
      generation += 1;
      position = 0;
      rng = createRng(createSeed(categoriesKey, generation));
      order = deterministicShuffle(pool, rng);
    }

    const candidate = order[position];
    position += 1;

    if (seen.has(candidate.id)) {
      if (seen.size >= pool.length) {
        resetSeen(seen, items);
      }
      continue;
    }

    items.push(candidate);
    seen.add(candidate.id);
  }

  const nextCursor: CursorState | null = order.length
    ? {
        v: CURSOR_VERSION,
        key: categoriesKey,
        generation,
        position,
      }
    : null;

  return {
    items,
    cursor: nextCursor ? encodeCursor(nextCursor) : null,
    totalAvailable: pool.length,
  };
};

const clampBatchSize = (value: number): number => {
  if (!Number.isFinite(value)) {
    return MIN_BATCH;
  }
  const rounded = Math.round(value);
  if (rounded < MIN_BATCH) {
    return MIN_BATCH;
  }
  if (rounded > MAX_BATCH) {
    return MAX_BATCH;
  }
  return rounded;
};

const sanitizeCategories = (categories?: Category[] | null): Category[] => {
  if (!categories || !categories.length) {
    return [...CATEGORIES];
  }
  const valid = new Set(CATEGORIES);
  const deduped: Category[] = [];
  const seen = new Set<Category>();
  categories.forEach((category) => {
    if (valid.has(category) && !seen.has(category)) {
      seen.add(category);
      deduped.push(category);
    }
  });
  return deduped.length ? deduped : [...CATEGORIES];
};

const buildPool = (categories: Category[]): Phrase[] => {
  const set = new Set(categories);
  return PHRASE_PACK_V1.phrases.filter((phrase) => set.has(phrase.category));
};

const normalizeCursor = (
  cursor: string | null | undefined,
  expectedKey: string,
): CursorState | null => {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(cursor) as CursorState | null;
    if (
      !parsed ||
      parsed.v !== CURSOR_VERSION ||
      typeof parsed.key !== 'string' ||
      parsed.key !== expectedKey ||
      typeof parsed.generation !== 'number' ||
      typeof parsed.position !== 'number'
    ) {
      return null;
    }
    if (parsed.position < 0) {
      return { ...parsed, position: 0 };
    }
    return parsed;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse feed cursor', error);
    }
    return null;
  }
};

const encodeCursor = (state: CursorState): string => JSON.stringify(state);

const createSeed = (key: string, generation: number): number => {
  return hashString(`${key}|${generation}`);
};

const resetSeen = (seen: Set<string>, current: Phrase[]): void => {
  const keep = new Set(current.map((item) => item.id));
  seen.clear();
  keep.forEach((id) => seen.add(id));
};
