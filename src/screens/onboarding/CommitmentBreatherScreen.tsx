import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';

export type CommitmentBreatherScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingCommitmentBreather'
>;

export function CommitmentBreatherScreen({ navigation }: CommitmentBreatherScreenProps) {
  useEffect(() => {
    trackScreen('OnboardingCommitmentBreather');
    capture('onboarding_step_viewed', { stepName: 'breather-commitment' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'breather-commitment' });
    navigation.navigate('OnboardingWidget');
  };

  return (
    <OnboardingShell
      title="Discipline is a choice."
      primaryCta={{ label: 'Continue', onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingCommitmentBreather}
      mascotHero
    >
      <Text style={styles.subtitle}>
        Athletes who pre-commit to coaching stick with their plans three times longer than those who go solo.
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
