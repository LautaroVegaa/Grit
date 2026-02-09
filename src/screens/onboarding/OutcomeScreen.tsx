import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OUTCOME_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type OutcomeScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingOutcome'>;

export function OutcomeScreen({ navigation }: OutcomeScreenProps) {
  const { data, setValue } = useOnboarding();

  useEffect(() => {
    trackScreen('OnboardingOutcome');
    capture('onboarding_step_viewed', { stepName: 'outcome' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'primary_outcome', value: key });
    void setValue('primary_outcome', key);
  };

  const handleContinue = () => {
    if (!data.primary_outcome) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'outcome', answer: data.primary_outcome });
    navigation.navigate('OnboardingFocus');
  };

  return (
    <OnboardingShell
      title="What's the result you want?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !data.primary_outcome }}
      progress={ONBOARDING_PROGRESS.OnboardingOutcome}
      mascotHero
    >
      <View style={styles.stack}>
        {OUTCOME_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
            selected={data.primary_outcome === option.key}
            onPress={() => handleSelect(option.key)}
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
