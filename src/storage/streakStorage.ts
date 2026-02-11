import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_STATE_KEY = 'grit.profile.streakState.v1';
const DAY_MS = 24 * 60 * 60 * 1000;

export type StreakState = {
  lastOpenedDateISO: string | null;
  streakCount: number;
};

const getDefaultState = (): StreakState => ({
  lastOpenedDateISO: null,
  streakCount: 0,
});

const safeParse = (value: string | null): StreakState | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'streakCount' in parsed &&
      typeof parsed.streakCount === 'number'
    ) {
      return {
        lastOpenedDateISO:
          typeof parsed.lastOpenedDateISO === 'string' ? parsed.lastOpenedDateISO : null,
        streakCount: Math.max(0, parsed.streakCount | 0),
      };
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse streak state', error);
    }
  }
  return null;
};

const formatLocalDateKey = (date: Date): string => {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return local.toISOString().split('T')[0];
};

const diffInDays = (previousISO: string, currentISO: string): number => {
  const [prevYear, prevMonth, prevDay] = previousISO.split('-').map((value) => Number(value));
  const [currYear, currMonth, currDay] = currentISO.split('-').map((value) => Number(value));
  const previousDate = new Date(prevYear, prevMonth - 1, prevDay);
  const currentDate = new Date(currYear, currMonth - 1, currDay);
  const diff = Math.round((currentDate.getTime() - previousDate.getTime()) / DAY_MS);
  return diff;
};

const saveStreakState = async (state: StreakState): Promise<void> => {
  await AsyncStorage.setItem(STREAK_STATE_KEY, JSON.stringify(state));
};

export const getStreakState = async (): Promise<StreakState> => {
  const stored = await AsyncStorage.getItem(STREAK_STATE_KEY);
  return safeParse(stored) ?? getDefaultState();
};

export const updateStreakOnAppOpen = async (): Promise<StreakState> => {
  const todayKey = formatLocalDateKey(new Date());
  const currentState = await getStreakState();

  if (currentState.lastOpenedDateISO === todayKey) {
    return currentState;
  }

  let nextCount = 1;
  if (currentState.lastOpenedDateISO) {
    const dayDiff = diffInDays(currentState.lastOpenedDateISO, todayKey);
    if (dayDiff === 0) {
      nextCount = Math.max(1, currentState.streakCount || 1);
    } else if (dayDiff === 1) {
      nextCount = Math.max(1, currentState.streakCount + 1);
    } else {
      nextCount = 1;
    }
  }

  const nextState: StreakState = {
    lastOpenedDateISO: todayKey,
    streakCount: nextCount,
  };
  await saveStreakState(nextState);
  return nextState;
};
