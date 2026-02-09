import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';

export type ConsistencyBreatherScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingConsistencyBreather'
>;

export function ConsistencyBreatherScreen({ navigation }: ConsistencyBreatherScreenProps) {
  useEffect(() => {
    trackScreen('OnboardingConsistencyBreather');
    capture('onboarding_step_viewed', { stepName: 'breather-consistency' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'breather-consistency' });
    navigation.navigate('OnboardingFinal');
  };

  return (
    <OnboardingShell
      title="Consistency > intensity."
      primaryCta={{ label: 'Understand', onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingConsistencyBreather}
      mascotHero
    >
      <Text style={styles.subtitle}>
        Neuroscience shows frequent reps rewire faster than rare bursts, so keep showing up.
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
