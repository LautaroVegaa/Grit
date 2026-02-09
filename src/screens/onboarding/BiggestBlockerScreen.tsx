import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { TRAINING_BLOCKER_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type BiggestBlockerScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingBiggestBlocker'>;

export function BiggestBlockerScreen({ navigation }: BiggestBlockerScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.training_biggest_blocker;

  useEffect(() => {
    trackScreen('OnboardingBiggestBlocker');
    capture('onboarding_step_viewed', { stepName: 'training-biggest-blocker' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'training_biggest_blocker', value: key });
    void setValue('training_biggest_blocker', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'training-biggest-blocker', value: selected });
    navigation.navigate('OnboardingTrainingFrequency');
  };

  return (
    <OnboardingShell
      title="What's getting in the way?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingBiggestBlocker}
      mascotHero
    >
      <View style={styles.stack}>
        {TRAINING_BLOCKER_OPTIONS.map((option) => (
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
