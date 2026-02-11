import { OnboardingStackParamList } from '@/navigation/types';

export type OnboardingSectionKey = 'identity' | 'goals' | 'setup';

type SectionDefinition = {
  key: OnboardingSectionKey;
  label: string;
  routes: (keyof OnboardingStackParamList)[];
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    key: 'identity',
    label: 'Identity',
    routes: [
      'OnboardingIntro',
      'OnboardingName',
      'OnboardingAge',
      'OnboardingIdentity',
      'OnboardingRelationship',
      'OnboardingEmployment',
    ],
  },
  {
    key: 'goals',
    label: 'Goals',
    routes: [
      'OnboardingPrimaryGoal',
      'OnboardingBiggestBlocker',
      'OnboardingTrainingFrequency',
      'OnboardingTrainingTime',
      'OnboardingFeelingLately',
      'OnboardingFutureFeeling',
      'OnboardingImproveAreas',
      'OnboardingAvoidingConfront',
      'OnboardingGoals',
      'OnboardingBlocks',
      'OnboardingAvoidance',
    ],
  },
  {
    key: 'setup',
    label: 'Setup',
    routes: [
      'OnboardingAvoidanceFeedback',
      'OnboardingMomentumBreather',
      'OnboardingAffirmationsStudies',
      'OnboardingAffirmationsFamiliarity',
      'OnboardingAffirmationsDailyHabitHelpers',
      'OnboardingNotificationsPermission',
      'OnboardingAffirmationsNotificationSchedule',
      'OnboardingAwarenessBreather',
      'OnboardingOutcome',
      'OnboardingFocus',
      'OnboardingSummary',
      'OnboardingTrialOffer',
      'OnboardingTrialReminder',
      'OnboardingTrialInfo',
      'OnboardingCommitmentBreather',
      'OnboardingWidget',
      'OnboardingConsistencyBreather',
      'OnboardingFinal',
    ],
  },
];

export const ONBOARDING_SECTION_LABELS = SECTION_DEFINITIONS.map((section) => section.label);

const STEP_ORDER: (keyof OnboardingStackParamList)[] = SECTION_DEFINITIONS.flatMap((section) => section.routes);

export const TOTAL_ONBOARDING_STEPS = STEP_ORDER.length;

type SectionProgress = {
  key: OnboardingSectionKey;
  label: string;
  index: number;
  current: number;
  total: number;
};

export type Progress = {
  current: number;
  total: number;
  section: SectionProgress;
};

export const ONBOARDING_PROGRESS: Record<keyof OnboardingStackParamList, Progress> = (() => {
  const map = {} as Record<keyof OnboardingStackParamList, Progress>;
  let globalIndex = 0;

  SECTION_DEFINITIONS.forEach((section, sectionIndex) => {
    section.routes.forEach((route, routeIndex) => {
      map[route] = {
        current: globalIndex + 1,
        total: TOTAL_ONBOARDING_STEPS,
        section: {
          key: section.key,
          label: section.label,
          index: sectionIndex,
          current: routeIndex + 1,
          total: section.routes.length,
        },
      };
      globalIndex += 1;
    });
  });

  return map;
})();