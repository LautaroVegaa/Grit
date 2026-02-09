import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { TRAINING_FREQUENCY_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type TrainingFrequencyScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingTrainingFrequency'>;

export function TrainingFrequencyScreen({ navigation }: TrainingFrequencyScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.training_frequency;

  useEffect(() => {
    trackScreen('OnboardingTrainingFrequency');
    capture('onboarding_step_viewed', { stepName: 'training-frequency' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'training_frequency', value: key });
    void setValue('training_frequency', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'training-frequency', value: selected });
    navigation.navigate('OnboardingTrainingTime');
  };

  return (
    <OnboardingShell
      title="How often are you training?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingTrainingFrequency}
      mascotHero
    >
      <View style={styles.stack}>
        {TRAINING_FREQUENCY_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
            emoji={option.emoji}
            selected={selected === option.key}
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
