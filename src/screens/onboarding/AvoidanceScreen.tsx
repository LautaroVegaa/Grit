import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { AVOIDANCE_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type AvoidanceScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingAvoidance'>;

export function AvoidanceScreen({ navigation }: AvoidanceScreenProps) {
  const { data, setValue } = useOnboarding();

  useEffect(() => {
    trackScreen('OnboardingAvoidance');
    capture('onboarding_step_viewed', { stepName: 'avoidance' });
  }, []);

  const toggleAvoidance = (key: string) => {
    const exists = data.user_avoidance.includes(key);
    const next = exists ? data.user_avoidance.filter((item) => item !== key) : [...data.user_avoidance, key];
    capture('onboarding_answer_changed', { field: 'user_avoidance', value: next });
    void setValue('user_avoidance', next);
  };

  const handleContinue = () => {
    if (data.user_avoidance.length === 0) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'avoidance', answers: data.user_avoidance });
    navigation.navigate('OnboardingAvoidanceFeedback');
  };

  return (
    <OnboardingShell
      title="What do you keep dodging?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: data.user_avoidance.length === 0 }}
      progress={ONBOARDING_PROGRESS.OnboardingAvoidance}
      mascotHero
    >
      <View style={styles.stack}>
        {AVOIDANCE_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
            selected={data.user_avoidance.includes(option.key)}
            onPress={() => toggleAvoidance(option.key)}
            type="check"
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing(2.5),
  },
});
