export {
  computeInitialActiveCategories,
  clampRemindersPerDay,
  MIN_ACTIVE_CATEGORIES,
  MAX_ACTIVE_CATEGORIES,
  FALLBACK_CATEGORY_ORDER,
} from './mapping';
export type {
  OnboardingAnswers,
  PrimaryGoal,
  BiggestBlocker,
  TrainingFrequency,
  TrainingTime,
} from './mapping';
export { applyOnboardingDefaultsOnce } from './applyDefaults';
export { runOnboardingMappingSelfTest } from './mappingSelfTest';
