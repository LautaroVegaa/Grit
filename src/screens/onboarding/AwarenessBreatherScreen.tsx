import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';

export type AwarenessBreatherScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingAwarenessBreather'
>;

export function AwarenessBreatherScreen({ navigation }: AwarenessBreatherScreenProps) {
  useEffect(() => {
    trackScreen('OnboardingAwarenessBreather');
    capture('onboarding_step_viewed', { stepName: 'breather-awareness' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'breather-awareness' });
    navigation.navigate('OnboardingOutcome');
  };

  return (
    <OnboardingShell
      title="Awareness changes behavior."
      primaryCta={{ label: 'Understand', onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingAwarenessBreather}
      mascotHero
    >
      <Text style={styles.subtitle}>
        Once you name the habit you dodge, you are far more likely to confront it this week.
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
