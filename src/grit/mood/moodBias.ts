import { CATEGORIES, Category } from '@/grit/phrases/types';

import type { Mood } from './types';

export type CategoryWeightMap = Record<Category, number>;

const createUniformWeights = (): CategoryWeightMap => {
  return CATEGORIES.reduce<CategoryWeightMap>((acc, category) => {
    acc[category] = 1;
    return acc;
  }, {} as CategoryWeightMap);
};

const MOOD_CATEGORY_BIAS: Record<Mood, Partial<Record<Category, number>>> = {
  terrible: {
    Recovery: 1.5,
    Mindset: 1.3,
    Confidence: 1.25,
    Focus: 1.2,
  },
  bad: {
    Recovery: 1.3,
    Mindset: 1.2,
    Confidence: 1.15,
    Focus: 1.1,
  },
  neutral: {},
  great: {
    Discipline: 1.15,
    Consistency: 1.15,
    Training: 1.1,
    Strength: 1.1,
  },
  excellent: {
    Discipline: 1.3,
    Consistency: 1.25,
    Training: 1.2,
    Strength: 1.2,
  },
};

export const getMoodCategoryBias = (mood: Mood): Partial<Record<Category, number>> => {
  return MOOD_CATEGORY_BIAS[mood] ?? {};
};

export const applyBiasToWeights = (
  base: CategoryWeightMap,
  bias: Partial<Record<Category, number>>,
): CategoryWeightMap => {
  const next: CategoryWeightMap = { ...base };
  Object.entries(bias).forEach(([key, weight]) => {
    if (typeof weight !== 'number' || !Number.isFinite(weight)) {
      return;
    }
    const category = key as Category;
    next[category] = (next[category] ?? 1) * weight;
  });
  return next;
};

export const createBiasedWeights = (mood: Mood | null | undefined): CategoryWeightMap => {
  const base = createUniformWeights();
  if (!mood) {
    return base;
  }
  return applyBiasToWeights(base, getMoodCategoryBias(mood));
};
