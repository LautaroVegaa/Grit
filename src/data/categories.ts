export type QuoteCategory = {
  key: string;
  label: string;
  emoji?: string;
};

export const CATEGORIES: QuoteCategory[] = [
  { key: 'discipline', label: 'Discipline', emoji: '🛡️' },
  { key: 'consistency', label: 'Consistency', emoji: '📅' },
  { key: 'training', label: 'Training', emoji: '🏋️' },
  { key: 'strength', label: 'Strength', emoji: '⚡' },
  { key: 'mindset', label: 'Mindset', emoji: '🧠' },
  { key: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { key: 'recovery', label: 'Recovery', emoji: '💤' },
  { key: 'confidence', label: 'Confidence', emoji: '🔥' },
  { key: 'focus', label: 'Focus', emoji: '🎯' },
];

export const DEFAULT_CATEGORY_KEY = 'discipline';

export const CATEGORY_LOOKUP = CATEGORIES.reduce<Record<string, QuoteCategory>>((acc, category) => {
  acc[category.key] = category;
  return acc;
}, {});
