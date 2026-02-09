import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationPreference = 'enabled' | 'disabled' | null;

export type OnboardingData = {
  completed: boolean;
  user_name: string;
  user_age_range: string | null;
  user_identity: string | null;
  user_relationship_status: string | null;
  user_employment_status: string | null;
  training_primary_goal: string | null;
  training_biggest_blocker: string | null;
  training_frequency: string | null;
  training_time: string | null;
  feeling_lately: string | null;
  future_feeling: string | null;
  improvement_focus: string[];
  avoidance_focus: string[];
  affirmations_familiarity: string | null;
  affirmations_daily_habit_helpers: string[];
  affirmations_notif_count: number;
  affirmations_notif_start: string;
  affirmations_notif_end: string;
  user_goals: string[];
  user_blocks: string[];
  user_avoidance: string[];
  primary_outcome: string | null;
  custom_focus_text: string;
  active_categories: string[];
  notification_preference: NotificationPreference;
  notifications_permission: 'granted' | 'denied' | 'skipped' | 'undetermined';
};

const STORAGE_PREFIX = 'onboarding.';

const KEYS = {
  completed: `${STORAGE_PREFIX}completed`,
  user_name: `${STORAGE_PREFIX}user_name`,
  user_age_range: `${STORAGE_PREFIX}user_age_range`,
  user_identity: `${STORAGE_PREFIX}user_identity`,
  user_relationship_status: `${STORAGE_PREFIX}user_relationship_status`,
  user_employment_status: `${STORAGE_PREFIX}user_employment_status`,
  training_primary_goal: `${STORAGE_PREFIX}training_primary_goal`,
  training_biggest_blocker: `${STORAGE_PREFIX}training_biggest_blocker`,
  training_frequency: `${STORAGE_PREFIX}training_frequency`,
  training_time: `${STORAGE_PREFIX}training_time`,
  feeling_lately: `${STORAGE_PREFIX}feeling_lately`,
  future_feeling: `${STORAGE_PREFIX}future_feeling`,
  improvement_focus: `${STORAGE_PREFIX}improvement_focus`,
  avoidance_focus: `${STORAGE_PREFIX}avoidance_focus`,
  affirmations_familiarity: `${STORAGE_PREFIX}affirmations_familiarity`,
  affirmations_daily_habit_helpers: `${STORAGE_PREFIX}affirmations_daily_habit_helpers`,
  affirmations_notif_count: `${STORAGE_PREFIX}affirmations_notif_count`,
  affirmations_notif_start: `${STORAGE_PREFIX}affirmations_notif_start`,
  affirmations_notif_end: `${STORAGE_PREFIX}affirmations_notif_end`,
  user_goals: `${STORAGE_PREFIX}user_goals`,
  user_blocks: `${STORAGE_PREFIX}user_blocks`,
  user_avoidance: `${STORAGE_PREFIX}user_avoidance`,
  primary_outcome: `${STORAGE_PREFIX}primary_outcome`,
  custom_focus_text: `${STORAGE_PREFIX}custom_focus_text`,
  active_categories: `${STORAGE_PREFIX}active_categories`,
  notification_preference: `${STORAGE_PREFIX}notification_preference`,
  notifications_permission: `${STORAGE_PREFIX}notifications_permission`,
} as const;

const EXTRA_KEYS = {
  force: `${STORAGE_PREFIX}force`,
} as const;

const DEFAULT_DATA: OnboardingData = {
  completed: false,
  user_name: '',
  user_age_range: null,
  user_identity: null,
  user_relationship_status: null,
  user_employment_status: null,
  training_primary_goal: null,
  training_biggest_blocker: null,
  training_frequency: null,
  training_time: null,
  feeling_lately: null,
  future_feeling: null,
  improvement_focus: [],
  avoidance_focus: [],
  affirmations_familiarity: null,
  affirmations_daily_habit_helpers: [],
  affirmations_notif_count: 8,
  affirmations_notif_start: '09:00',
  affirmations_notif_end: '22:00',
  user_goals: [],
  user_blocks: [],
  user_avoidance: [],
  primary_outcome: null,
  custom_focus_text: '',
  active_categories: [],
  notification_preference: null,
  notifications_permission: 'undetermined',
};

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) ?? fallback;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse onboarding storage value', error);
    }
    return fallback;
  }
}

export async function loadOnboardingData(): Promise<OnboardingData> {
  try {
    const entries = await AsyncStorage.multiGet(Object.values(KEYS));
    const map = new Map(entries);
    const primaryOutcomeValue = map.get(KEYS.primary_outcome);
    const customFocusValue = map.get(KEYS.custom_focus_text);
    const userNameValue = map.get(KEYS.user_name);
    const userAgeValue = map.get(KEYS.user_age_range);
    const userIdentityValue = map.get(KEYS.user_identity);
    const userRelationshipValue = map.get(KEYS.user_relationship_status);
    const userEmploymentValue = map.get(KEYS.user_employment_status);
    const trainingPrimaryGoalValue = map.get(KEYS.training_primary_goal);
    const trainingBlockerValue = map.get(KEYS.training_biggest_blocker);
    const trainingFrequencyValue = map.get(KEYS.training_frequency);
    const trainingTimeValue = map.get(KEYS.training_time);
    const feelingLatelyValue = map.get(KEYS.feeling_lately);
    const futureFeelingValue = map.get(KEYS.future_feeling);
    const familiarityValue = map.get(KEYS.affirmations_familiarity);
    const habitHelpersValue = map.get(KEYS.affirmations_daily_habit_helpers);
    const notifCountValue = map.get(KEYS.affirmations_notif_count);
    const notifStartValue = map.get(KEYS.affirmations_notif_start);
    const notifEndValue = map.get(KEYS.affirmations_notif_end);

    const notificationValue = map.get(KEYS.notification_preference);
    const notificationsPermissionValue = map.get(KEYS.notifications_permission);

    return {
      completed: map.get(KEYS.completed) === 'true',
      user_name: userNameValue ?? '',
      user_age_range: userAgeValue && userAgeValue.length > 0 ? userAgeValue : null,
      user_identity: userIdentityValue && userIdentityValue.length > 0 ? userIdentityValue : null,
      user_relationship_status:
        userRelationshipValue && userRelationshipValue.length > 0 ? userRelationshipValue : null,
      user_employment_status:
        userEmploymentValue && userEmploymentValue.length > 0 ? userEmploymentValue : null,
      training_primary_goal:
        trainingPrimaryGoalValue && trainingPrimaryGoalValue.length > 0 ? trainingPrimaryGoalValue : null,
      training_biggest_blocker:
        trainingBlockerValue && trainingBlockerValue.length > 0 ? trainingBlockerValue : null,
      training_frequency:
        trainingFrequencyValue && trainingFrequencyValue.length > 0 ? trainingFrequencyValue : null,
      training_time: trainingTimeValue && trainingTimeValue.length > 0 ? trainingTimeValue : null,
      feeling_lately: feelingLatelyValue && feelingLatelyValue.length > 0 ? feelingLatelyValue : null,
      future_feeling: futureFeelingValue && futureFeelingValue.length > 0 ? futureFeelingValue : null,
      affirmations_familiarity: familiarityValue && familiarityValue.length > 0 ? familiarityValue : null,
      affirmations_daily_habit_helpers: parseJSON<string[]>(habitHelpersValue ?? null, []),
      improvement_focus: parseJSON<string[]>(map.get(KEYS.improvement_focus) ?? null, []),
      avoidance_focus: parseJSON<string[]>(map.get(KEYS.avoidance_focus) ?? null, []),
      affirmations_notif_count: notifCountValue ? Number(notifCountValue) || DEFAULT_DATA.affirmations_notif_count : DEFAULT_DATA.affirmations_notif_count,
      affirmations_notif_start: notifStartValue ?? DEFAULT_DATA.affirmations_notif_start,
      affirmations_notif_end: notifEndValue ?? DEFAULT_DATA.affirmations_notif_end,
      user_goals: parseJSON<string[]>(map.get(KEYS.user_goals) ?? null, []),
      user_blocks: parseJSON<string[]>(map.get(KEYS.user_blocks) ?? null, []),
      user_avoidance: parseJSON<string[]>(map.get(KEYS.user_avoidance) ?? null, []),
      primary_outcome: primaryOutcomeValue && primaryOutcomeValue.length > 0 ? primaryOutcomeValue : null,
      custom_focus_text: customFocusValue ?? '',
      active_categories: parseJSON<string[]>(map.get(KEYS.active_categories) ?? null, []),
      notification_preference:
        notificationValue && notificationValue.length > 0 ? (notificationValue as NotificationPreference) : null,
      notifications_permission:
        notificationsPermissionValue && notificationsPermissionValue.length > 0
          ? (notificationsPermissionValue as OnboardingData['notifications_permission'])
          : DEFAULT_DATA.notifications_permission,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to load onboarding data', error);
    }
    return { ...DEFAULT_DATA };
  }
}

async function saveValue(key: string, value: string | null) {
  if (value === null) {
    await AsyncStorage.removeItem(key);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function setOnboardingValue<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
  switch (key) {
    case 'user_goals':
    case 'user_blocks':
    case 'user_avoidance':
    case 'improvement_focus':
    case 'avoidance_focus':
    case 'active_categories':
      await saveValue(KEYS[key], JSON.stringify(value));
      break;
    case 'completed':
      await saveValue(KEYS.completed, value ? 'true' : 'false');
      break;
    case 'primary_outcome': {
      const stored = typeof value === 'string' ? value : null;
      await saveValue(KEYS.primary_outcome, stored ?? '');
      break;
    }
    case 'user_name':
      await saveValue(KEYS.user_name, (value as string) ?? '');
      break;
    case 'user_age_range':
    case 'user_identity':
    case 'user_relationship_status':
    case 'user_employment_status':
    case 'training_primary_goal':
    case 'training_biggest_blocker':
    case 'training_frequency':
    case 'training_time':
    case 'feeling_lately':
    case 'future_feeling': {
      const storageKey = KEYS[key];
      if (typeof value === 'string' && value.length > 0) {
        await saveValue(storageKey, value);
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
      break;
    }
    case 'affirmations_familiarity': {
      const storageKey = KEYS.affirmations_familiarity;
      if (typeof value === 'string' && value.length > 0) {
        await saveValue(storageKey, value);
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
      break;
    }
    case 'affirmations_daily_habit_helpers':
      await saveValue(KEYS.affirmations_daily_habit_helpers, JSON.stringify(value));
      break;
    case 'affirmations_notif_count':
      await saveValue(KEYS.affirmations_notif_count, String(value ?? DEFAULT_DATA.affirmations_notif_count));
      break;
    case 'affirmations_notif_start':
    case 'affirmations_notif_end':
      await saveValue(KEYS[key], (value as string) ?? '');
      break;
    case 'custom_focus_text':
      await saveValue(KEYS.custom_focus_text, (value as string) ?? '');
      break;
    case 'notification_preference':
      if (value) {
        await saveValue(KEYS.notification_preference, value as string);
      } else {
        await AsyncStorage.removeItem(KEYS.notification_preference);
      }
      break;
    case 'notifications_permission':
      await saveValue(KEYS.notifications_permission, (value as string) ?? DEFAULT_DATA.notifications_permission);
      break;
    default:
      break;
  }
}

export async function setCompleted(value: boolean) {
  await saveValue(KEYS.completed, value ? 'true' : 'false');
}

export async function getCompleted() {
  const value = await AsyncStorage.getItem(KEYS.completed);
  return value === 'true';
}

export async function setForceOnboarding(value: boolean) {
  await saveValue(EXTRA_KEYS.force, value ? 'true' : 'false');
}

export async function getForceOnboarding() {
  const value = await AsyncStorage.getItem(EXTRA_KEYS.force);
  return value === 'true';
}

export async function clearOnboardingData() {
  const keysToClear = [
    KEYS.user_name,
    KEYS.user_age_range,
    KEYS.user_identity,
    KEYS.user_relationship_status,
    KEYS.user_employment_status,
    KEYS.training_primary_goal,
    KEYS.training_biggest_blocker,
    KEYS.training_frequency,
    KEYS.training_time,
    KEYS.feeling_lately,
    KEYS.future_feeling,
    KEYS.improvement_focus,
    KEYS.avoidance_focus,
    KEYS.affirmations_familiarity,
    KEYS.affirmations_daily_habit_helpers,
    KEYS.affirmations_notif_count,
    KEYS.affirmations_notif_start,
    KEYS.affirmations_notif_end,
    KEYS.user_goals,
    KEYS.user_blocks,
    KEYS.user_avoidance,
    KEYS.primary_outcome,
    KEYS.custom_focus_text,
    KEYS.active_categories,
    KEYS.notification_preference,
    KEYS.notifications_permission,
  ];
  await AsyncStorage.multiRemove(keysToClear);
  await setCompleted(false);
}

export { DEFAULT_DATA as DEFAULT_ONBOARDING_DATA, EXTRA_KEYS as ONBOARDING_EXTRA_KEYS, KEYS as ONBOARDING_KEYS };

