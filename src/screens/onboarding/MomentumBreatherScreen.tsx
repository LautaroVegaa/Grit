import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';

export type MomentumBreatherScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingMomentumBreather'
>;

export function MomentumBreatherScreen({ navigation }: MomentumBreatherScreenProps) {
  useEffect(() => {
    trackScreen('OnboardingMomentumBreather');
    capture('onboarding_step_viewed', { stepName: 'breather-momentum' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'breather-momentum' });
    navigation.navigate('OnboardingAffirmationsStudies');
  };

  return (
    <OnboardingShell
      title="Momentum beats motivation."
      primaryCta={{ label: "I'm in", onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingMomentumBreather}
      mascotHero
    >
      <Text style={styles.subtitle}>
        Daily reps, even tiny ones, double your odds of sticking with a training plan.
      </Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: GRIT.colors.text1,
  },
});
