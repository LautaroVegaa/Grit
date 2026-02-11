import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Loading: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
};

export type MainStackParamList = {
  DailyGate: undefined;
  Home: undefined;
  Favorites: undefined;
  Drops: undefined;
  PhraseDetail: { phraseId: string };
  Profile: undefined;
  ProfileName: undefined;
  ProfileGender: undefined;
  ProfileNotifications: undefined;
  ProfileFeedback: undefined;
  MoodCheckin: {
    todayISO: string;
  };
  StreakWelcome: {
    todayISO: string;
    streakCount: number;
    lastCompletedDateISO: string | null;
    greeting: string;
  };
};

export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  OnboardingName: undefined;
  OnboardingAge: undefined;
  OnboardingIdentity: undefined;
  OnboardingRelationship: undefined;
  OnboardingPrimaryGoal: undefined;
  OnboardingBiggestBlocker: undefined;
  OnboardingTrainingFrequency: undefined;
  OnboardingTrainingTime: undefined;
  OnboardingEmployment: undefined;
  OnboardingFeelingLately: undefined;
  OnboardingFutureFeeling: undefined;
  OnboardingImproveAreas: undefined;
  OnboardingAvoidingConfront: undefined;
  OnboardingMomentumBreather: undefined;
  OnboardingAffirmationsStudies: undefined;
  OnboardingAffirmationsFamiliarity: undefined;
  OnboardingAffirmationsDailyHabitHelpers: undefined;
  OnboardingNotificationsPermission: undefined;
  OnboardingAffirmationsNotificationSchedule: undefined;
  OnboardingGoals: undefined;
  OnboardingBlocks: undefined;
  OnboardingAvoidance: undefined;
  OnboardingAvoidanceFeedback: undefined;
  OnboardingAwarenessBreather: undefined;
  OnboardingOutcome: undefined;
  OnboardingFocus: undefined;
  OnboardingSummary: undefined;
  OnboardingTrialOffer: undefined;
  OnboardingTrialReminder: undefined;
  OnboardingTrialInfo: undefined;
  OnboardingCommitmentBreather: undefined;
  OnboardingWidget: undefined;
  OnboardingConsistencyBreather: undefined;
  OnboardingFinal: undefined;
};
