import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { TRAINING_PRIMARY_GOAL_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type PrimaryGoalScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingPrimaryGoal'>;

export function PrimaryGoalScreen({ navigation }: PrimaryGoalScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.training_primary_goal;

  useEffect(() => {
    trackScreen('OnboardingPrimaryGoal');
    capture('onboarding_step_viewed', { stepName: 'training-primary-goal' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'training_primary_goal', value: key });
    void setValue('training_primary_goal', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'training-primary-goal', value: selected });
    navigation.navigate('OnboardingBiggestBlocker');
  };

  return (
    <OnboardingShell
      title="What's the big goal?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingPrimaryGoal}
      mascotHero
    >
      <View style={styles.stack}>
        {TRAINING_PRIMARY_GOAL_OPTIONS.map((option) => (
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
