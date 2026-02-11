import { Category } from '../phrases';

export type PrimaryGoal =
  | 'strength'
  | 'muscle'
  | 'fat_loss'
  | 'consistency'
  | 'confidence';

export type BiggestBlocker =
  | 'motivation'
  | 'comparison'
  | 'burnout'
  | 'diet'
  | 'recovery';

export type TrainingFrequency = '0_2' | '3_4' | '5_plus';

export type TrainingTime = 'morning' | 'afternoon' | 'night';

export interface OnboardingAnswers {
  primaryGoal?: PrimaryGoal;
  biggestBlocker?: BiggestBlocker;
  trainingFrequency?: TrainingFrequency;
  trainingTime?: TrainingTime;
  remindersPerDay?: number;
}

export const MIN_ACTIVE_CATEGORIES = 4;
export const MAX_ACTIVE_CATEGORIES = 6;

export const FALLBACK_CATEGORY_ORDER: Category[] = [
  'Consistency',
  'Discipline',
  'Focus',
  'Training',
  'Mindset',
  'Recovery',
  'Strength',
  'Nutrition',
  'Confidence',
];

const PRIMARY_GOAL_MAP: Record<PrimaryGoal, Category[]> = {
  strength: ['Strength', 'Training', 'Consistency'],
  muscle: ['Training', 'Nutrition', 'Consistency'],
  fat_loss: ['Nutrition', 'Discipline', 'Consistency'],
  consistency: ['Consistency', 'Discipline', 'Focus'],
  confidence: ['Confidence', 'Mindset', 'Discipline'],
};

const BIGGEST_BLOCKER_MAP: Record<BiggestBlocker, Category[]> = {
  motivation: ['Discipline', 'Consistency'],
  comparison: ['Mindset', 'Confidence'],
  burnout: ['Recovery', 'Mindset'],
  diet: ['Nutrition', 'Discipline'],
  recovery: ['Recovery', 'Consistency'],
};

const TRAINING_FREQUENCY_ENSURE_MAP: Record<TrainingFrequency, Category[]> = {
  '0_2': ['Discipline', 'Consistency', 'Confidence'],
  '3_4': [],
  '5_plus': ['Recovery', 'Focus'],
};

const TRAINING_TIME_ENSURE_MAP: Record<TrainingTime, Category[]> = {
  morning: ['Discipline', 'Focus'],
  afternoon: ['Focus'],
  night: ['Recovery', 'Mindset'],
};

type ReasonTag =
  | 'primaryGoal'
  | 'biggestBlocker'
  | 'trainingFrequency'
  | 'trainingTime'
  | 'fallback';

type ReasonMap = Map<Category, Set<ReasonTag>>;

type InsertionOrderMap = Map<Category, number>;

export const computeInitialActiveCategories = (
  answers: OnboardingAnswers,
): Category[] => {
  const selection = new Set<Category>();
  const reasons: ReasonMap = new Map();
  const insertionOrder: InsertionOrderMap = new Map();
  let insertionCursor = 0;

  const recordCategory = (category: Category, reason: ReasonTag) => {
    if (!selection.has(category)) {
      selection.add(category);
      insertionOrder.set(category, insertionCursor);
      insertionCursor += 1;
    }
    if (!reasons.has(category)) {
      reasons.set(category, new Set());
    }
    reasons.get(category)!.add(reason);
  };

  const addFromMap = <T extends string>(
    value: T | undefined,
    map: Partial<Record<T, Category[]>>,
    reason: ReasonTag,
  ) => {
    if (!value) {
      return;
    }
    const categories = map[value];
    categories?.forEach((category) => recordCategory(category, reason));
  };

  addFromMap(answers.primaryGoal, PRIMARY_GOAL_MAP, 'primaryGoal');
  addFromMap(answers.biggestBlocker, BIGGEST_BLOCKER_MAP, 'biggestBlocker');
  addFromMap(
    answers.trainingFrequency,
    TRAINING_FREQUENCY_ENSURE_MAP,
    'trainingFrequency',
  );
  addFromMap(answers.trainingTime, TRAINING_TIME_ENSURE_MAP, 'trainingTime');

  let orderedCategories = buildOrderedCategories(selection, insertionOrder);

  if (orderedCategories.length < MIN_ACTIVE_CATEGORIES) {
    orderedCategories = fillMissingWithFallback(
      orderedCategories,
      selection,
      reasons,
      insertionOrder,
    );
  }

  if (orderedCategories.length > MAX_ACTIVE_CATEGORIES) {
    orderedCategories = trimToMax(
      orderedCategories,
      reasons,
      insertionOrder,
    );
  }

  return orderedCategories;
};

const buildOrderedCategories = (
  selection: Set<Category>,
  insertionOrder: InsertionOrderMap,
): Category[] =>
  Array.from(insertionOrder.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([category]) => category)
    .filter((category) => selection.has(category));

const fillMissingWithFallback = (
  current: Category[],
  selection: Set<Category>,
  reasons: ReasonMap,
  insertionOrder: InsertionOrderMap,
): Category[] => {
  const result = [...current];
  const needed = MIN_ACTIVE_CATEGORIES - result.length;
  if (needed <= 0) {
    return result;
  }

  let added = 0;
  FALLBACK_CATEGORY_ORDER.forEach((category) => {
    if (added >= needed) {
      return;
    }
    if (!selection.has(category)) {
      selection.add(category);
      const nextIndex = insertionOrder.size;
      insertionOrder.set(category, nextIndex);
      if (!reasons.has(category)) {
        reasons.set(category, new Set());
      }
      reasons.get(category)!.add('fallback');
      result.push(category);
      added += 1;
    }
  });

  return buildOrderedCategories(selection, insertionOrder);
};

const trimToMax = (
  orderedCategories: Category[],
  reasons: ReasonMap,
  insertionOrder: InsertionOrderMap,
): Category[] => {
  const compare = (a: Category, b: Category) => {
    const priorityA = buildPriorityTuple(a, reasons);
    const priorityB = buildPriorityTuple(b, reasons);

    for (let i = 0; i < priorityA.length; i += 1) {
      if (priorityA[i] !== priorityB[i]) {
        return priorityB[i] - priorityA[i];
      }
    }

    return (insertionOrder.get(a) ?? 0) - (insertionOrder.get(b) ?? 0);
  };

  const sorted = [...orderedCategories].sort(compare);
  const keep = new Set(sorted.slice(0, MAX_ACTIVE_CATEGORIES));

  return orderedCategories.filter((category) => keep.has(category));
};

const buildPriorityTuple = (
  category: Category,
  reasons: ReasonMap,
): number[] => {
  const hasReason = (reason: ReasonTag) => reasons.get(category)?.has(reason);
  const fallbackIndex = FALLBACK_CATEGORY_ORDER.indexOf(category);
  const fallbackScore =
    fallbackIndex === -1 ? -FALLBACK_CATEGORY_ORDER.length : -fallbackIndex;

  return [
    hasReason('primaryGoal') ? 1 : 0,
    hasReason('biggestBlocker') ? 1 : 0,
    category === 'Consistency' ? 1 : 0,
    hasReason('trainingTime') ? 1 : 0,
    hasReason('trainingFrequency') ? 1 : 0,
    fallbackScore,
  ];
};

export const clampRemindersPerDay = (
  value: number | undefined,
): number | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  const integer = Math.floor(value);
  if (integer < 1) {
    return 1;
  }
  if (integer > 20) {
    return 20;
  }
  return integer;
};
