import { Category } from '../phrases';
import {
  OnboardingAnswers,
  clampRemindersPerDay,
  computeInitialActiveCategories,
} from './mapping';
import {
  loadActiveCategories,
  saveActiveCategories,
} from '../storage/phrasesStorage';
import {
  loadRemindersPerDay,
  saveRemindersPerDay,
  loadTrainingTimePreference,
  saveTrainingTimePreference,
} from '../storage/notificationsStorage';

export interface ApplyDefaultsResult {
  categoriesApplied: boolean;
  remindersApplied: boolean;
  finalActiveCategories: Category[];
  finalRemindersPerDay: number | null;
}

export const applyOnboardingDefaultsOnce = async (
  answers: OnboardingAnswers,
): Promise<ApplyDefaultsResult> => {
  const [existingCategories, existingReminders, existingTrainingTime] = await Promise.all([
    loadActiveCategories(),
    loadRemindersPerDay(),
    loadTrainingTimePreference(),
  ]);

  let categoriesApplied = false;
  let remindersApplied = false;

  let finalActiveCategories = existingCategories ?? [];
  if (!existingCategories || existingCategories.length === 0) {
    finalActiveCategories = computeInitialActiveCategories(answers);
    await saveActiveCategories(finalActiveCategories);
    categoriesApplied = true;
  }

  let finalRemindersPerDay = existingReminders;
  if (finalRemindersPerDay == null) {
    const clamped = clampRemindersPerDay(answers.remindersPerDay);
    if (clamped != null) {
      await saveRemindersPerDay(clamped);
      finalRemindersPerDay = clamped;
      remindersApplied = true;
    }
  }

  if (!existingTrainingTime && answers.trainingTime) {
    await saveTrainingTimePreference(answers.trainingTime);
  }

  return {
    categoriesApplied,
    remindersApplied,
    finalActiveCategories,
    finalRemindersPerDay,
  };
};
