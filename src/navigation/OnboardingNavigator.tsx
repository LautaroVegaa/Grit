import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AvoidanceFeedbackScreen } from '@/screens/onboarding/AvoidanceFeedbackScreen';
import { AvoidanceScreen } from '@/screens/onboarding/AvoidanceScreen';
import { AvoidingConfrontScreen } from '@/screens/onboarding/AvoidingConfrontScreen';
import { AwarenessBreatherScreen } from '@/screens/onboarding/AwarenessBreatherScreen';
import { AgeScreen } from '@/screens/onboarding/AgeScreen';
import { AffirmationsDailyHabitHelpersScreen } from '@/screens/onboarding/AffirmationsDailyHabitHelpersScreen';
import { AffirmationsFamiliarityScreen } from '@/screens/onboarding/AffirmationsFamiliarityScreen';
import { AffirmationsNotificationScheduleScreen } from '@/screens/onboarding/AffirmationsNotificationScheduleScreen';
import { BiggestBlockerScreen } from '@/screens/onboarding/BiggestBlockerScreen';
import { BlocksScreen } from '@/screens/onboarding/BlocksScreen';
import { CommitmentBreatherScreen } from '@/screens/onboarding/CommitmentBreatherScreen';
import { ConsistencyBreatherScreen } from '@/screens/onboarding/ConsistencyBreatherScreen';
import { EmploymentScreen } from '@/screens/onboarding/EmploymentScreen';
import { FeelingLatelyScreen } from '@/screens/onboarding/FeelingLatelyScreen';
import { FinalScreen } from '@/screens/onboarding/FinalScreen';
import { FocusScreen } from '@/screens/onboarding/FocusScreen';
import { FutureFeelingScreen } from '@/screens/onboarding/FutureFeelingScreen';
import { GoalsScreen } from '@/screens/onboarding/GoalsScreen';
import { IdentityScreen } from '@/screens/onboarding/IdentityScreen';
import { ImproveAreasScreen } from '@/screens/onboarding/ImproveAreasScreen';
import { IntroScreen } from '@/screens/onboarding/IntroScreen';
import { MomentumBreatherScreen } from '@/screens/onboarding/MomentumBreatherScreen';
import { NameScreen } from '@/screens/onboarding/NameScreen';
import { NotificationsPermissionScreen } from '@/screens/onboarding/NotificationsPermissionScreen';
import { OutcomeScreen } from '@/screens/onboarding/OutcomeScreen';
import { PrimaryGoalScreen } from '@/screens/onboarding/PrimaryGoalScreen';
import { RelationshipScreen } from '@/screens/onboarding/RelationshipScreen';
import { StudiesAffirmationsInfoScreen } from '@/screens/onboarding/StudiesAffirmationsInfoScreen';
import { SummaryScreen } from '@/screens/onboarding/SummaryScreen';
import { TrialInfoScreen } from '@/screens/onboarding/TrialInfoScreen';
import { TrialOfferScreen } from '@/screens/onboarding/TrialOfferScreen';
import { TrialReminderScreen } from '@/screens/onboarding/TrialReminderScreen';
import { TrainingFrequencyScreen } from '@/screens/onboarding/TrainingFrequencyScreen';
import { TrainingTimeScreen } from '@/screens/onboarding/TrainingTimeScreen';
import { WidgetScreen } from '@/screens/onboarding/WidgetScreen';
import { GRIT } from '@/theme/gritTheme';
import { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GRIT.colors.bg0 },
      }}
      initialRouteName="OnboardingIntro"
    >
      <Stack.Screen name="OnboardingIntro" component={IntroScreen} />
      <Stack.Screen name="OnboardingName" component={NameScreen} />
      <Stack.Screen name="OnboardingAge" component={AgeScreen} />
      <Stack.Screen name="OnboardingIdentity" component={IdentityScreen} />
      <Stack.Screen name="OnboardingRelationship" component={RelationshipScreen} />
      <Stack.Screen name="OnboardingEmployment" component={EmploymentScreen} />
      <Stack.Screen name="OnboardingPrimaryGoal" component={PrimaryGoalScreen} />
      <Stack.Screen name="OnboardingBiggestBlocker" component={BiggestBlockerScreen} />
      <Stack.Screen name="OnboardingTrainingFrequency" component={TrainingFrequencyScreen} />
      <Stack.Screen name="OnboardingTrainingTime" component={TrainingTimeScreen} />
      <Stack.Screen name="OnboardingFeelingLately" component={FeelingLatelyScreen} />
      <Stack.Screen name="OnboardingFutureFeeling" component={FutureFeelingScreen} />
      <Stack.Screen name="OnboardingImproveAreas" component={ImproveAreasScreen} />
      <Stack.Screen name="OnboardingAvoidingConfront" component={AvoidingConfrontScreen} />
      <Stack.Screen name="OnboardingGoals" component={GoalsScreen} />
      <Stack.Screen name="OnboardingBlocks" component={BlocksScreen} />
      <Stack.Screen name="OnboardingAvoidance" component={AvoidanceScreen} />
      <Stack.Screen name="OnboardingAvoidanceFeedback" component={AvoidanceFeedbackScreen} />
      <Stack.Screen name="OnboardingMomentumBreather" component={MomentumBreatherScreen} />
      <Stack.Screen name="OnboardingAffirmationsStudies" component={StudiesAffirmationsInfoScreen} />
      <Stack.Screen name="OnboardingAffirmationsFamiliarity" component={AffirmationsFamiliarityScreen} />
      <Stack.Screen
        name="OnboardingAffirmationsDailyHabitHelpers"
        component={AffirmationsDailyHabitHelpersScreen}
      />
      <Stack.Screen name="OnboardingNotificationsPermission" component={NotificationsPermissionScreen} />
      <Stack.Screen
        name="OnboardingAffirmationsNotificationSchedule"
        component={AffirmationsNotificationScheduleScreen}
      />
      <Stack.Screen name="OnboardingAwarenessBreather" component={AwarenessBreatherScreen} />
      <Stack.Screen name="OnboardingOutcome" component={OutcomeScreen} />
      <Stack.Screen name="OnboardingFocus" component={FocusScreen} />
      <Stack.Screen name="OnboardingSummary" component={SummaryScreen} />
      <Stack.Screen name="OnboardingTrialOffer" component={TrialOfferScreen} />
      <Stack.Screen name="OnboardingTrialReminder" component={TrialReminderScreen} />
      <Stack.Screen name="OnboardingTrialInfo" component={TrialInfoScreen} />
      <Stack.Screen name="OnboardingCommitmentBreather" component={CommitmentBreatherScreen} />
      <Stack.Screen name="OnboardingWidget" component={WidgetScreen} />
      <Stack.Screen name="OnboardingConsistencyBreather" component={ConsistencyBreatherScreen} />
      <Stack.Screen name="OnboardingFinal" component={FinalScreen} />
    </Stack.Navigator>
  );
}
