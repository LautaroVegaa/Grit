import type { MainStackParamList } from '@/navigation/types';
import { getDisplayName } from '@/storage/profileStorage';
import { formatGreeting, getLocalDateISO } from '@/utils/localTime';

import { loadMoodForDate } from '@/grit/mood/moodStorage';
import {
    getLastStreakModalShownDate,
    markTodayCompleted,
    setLastStreakModalShownDate,
} from '@/grit/streak/streakStorage';

type StreakParams = MainStackParamList['StreakWelcome'];
type MoodParams = MainStackParamList['MoodCheckin'];

type GateDecision =
  | { route: 'Home' }
  | { route: 'StreakWelcome'; params: StreakParams }
  | { route: 'MoodCheckin'; params: MoodParams };

const shouldShowMoodForDate = async (dateISO: string): Promise<boolean> => {
  const mood = await loadMoodForDate(dateISO);
  return !mood;
};

export const decideInitialRoute = async (): Promise<GateDecision> => {
  const todayISO = getLocalDateISO();
  const [modalDate, displayName] = await Promise.all([
    getLastStreakModalShownDate(),
    getDisplayName(),
  ]);

  if (modalDate !== todayISO) {
    const streakState = await markTodayCompleted(todayISO);
    const greeting = formatGreeting(displayName);
    return {
      route: 'StreakWelcome',
      params: {
        todayISO,
        streakCount: streakState.currentStreak,
        lastCompletedDateISO: streakState.lastCompletedDateISO,
        greeting,
      },
    };
  }

  if (await shouldShowMoodForDate(todayISO)) {
    return { route: 'MoodCheckin', params: { todayISO } };
  }

  return { route: 'Home' };
};

export const resolvePostStreakRoute = async (todayISO: string): Promise<'Home' | 'MoodCheckin'> => {
  await setLastStreakModalShownDate(todayISO);
  return (await shouldShowMoodForDate(todayISO)) ? 'MoodCheckin' : 'Home';
};

export const shouldShowMoodCheckinForDate = async (dateISO: string): Promise<boolean> => {
  return shouldShowMoodForDate(dateISO);
};
