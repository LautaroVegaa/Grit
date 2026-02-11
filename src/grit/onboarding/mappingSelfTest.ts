import { Category } from '../phrases';
import {
    FALLBACK_CATEGORY_ORDER,
    MAX_ACTIVE_CATEGORIES,
    MIN_ACTIVE_CATEGORIES,
    OnboardingAnswers,
    clampRemindersPerDay,
    computeInitialActiveCategories,
} from './mapping';

export const runOnboardingMappingSelfTest = (): {
  ok: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  const case1Answers: OnboardingAnswers = {
    primaryGoal: 'strength',
    biggestBlocker: 'motivation',
    trainingFrequency: '5_plus',
    trainingTime: 'morning',
  };

  const case1 = computeInitialActiveCategories(case1Answers);
  assertIncludes(case1, ['Strength', 'Training', 'Consistency', 'Discipline', 'Focus', 'Recovery'], errors, 'case1');
  if (case1.length > MAX_ACTIVE_CATEGORIES) {
    errors.push('case1 produced more than MAX categories');
  }

  const case2Answers: OnboardingAnswers = {
    primaryGoal: 'fat_loss',
    biggestBlocker: 'diet',
    trainingFrequency: '0_2',
    trainingTime: 'night',
  };

  const case2 = computeInitialActiveCategories(case2Answers);
  assertIncludes(case2, ['Nutrition', 'Discipline', 'Consistency', 'Recovery', 'Mindset'], errors, 'case2');
  if (case2.length > MAX_ACTIVE_CATEGORIES) {
    errors.push('case2 produced more than MAX categories');
  }

  const case3 = computeInitialActiveCategories({});
  if (
    case3.length < MIN_ACTIVE_CATEGORIES ||
    case3.length > MAX_ACTIVE_CATEGORIES
  ) {
    errors.push('case3 did not respect min/max category bounds');
  }
  const expectedFallback = FALLBACK_CATEGORY_ORDER.slice(0, case3.length);
  if (!arraysEqual(case3, expectedFallback)) {
    errors.push('case3 did not use fallback order for empty answers');
  }

  const clampCases: { input: number | undefined; expected: number | null }[] = [
    { input: 0, expected: 1 },
    { input: 25, expected: 20 },
    { input: 6.7, expected: 6 },
    { input: undefined, expected: null },
  ];

  clampCases.forEach(({ input, expected }, index) => {
    const actual = clampRemindersPerDay(input);
    if (actual !== expected) {
      errors.push(`clampRemindersPerDay case${index + 1} expected ${expected} got ${actual}`);
    }
  });

  return { ok: errors.length === 0, errors };
};

const assertIncludes = (
  result: Category[],
  expected: Category[],
  errors: string[],
  label: string,
) => {
  expected.forEach((category) => {
    if (!result.includes(category)) {
      errors.push(`${label} missing category ${category}`);
    }
  });
};

const arraysEqual = (a: Category[], b: Category[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => item === b[index]);
};
