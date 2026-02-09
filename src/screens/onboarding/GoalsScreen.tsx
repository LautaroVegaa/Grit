import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { GOAL_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type GoalsScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingGoals'>;

export function GoalsScreen({ navigation }: GoalsScreenProps) {
  const { data, setValue } = useOnboarding();

  useEffect(() => {
    trackScreen('OnboardingGoals');
    capture('onboarding_step_viewed', { stepName: 'goals' });
  }, []);

  const toggleGoal = (key: string) => {
    const currentlySelected = data.user_goals;
    const exists = currentlySelected.includes(key);
    const next = exists ? currentlySelected.filter((item) => item !== key) : [...currentlySelected, key];
    capture('onboarding_answer_changed', { field: 'user_goals', value: next });
    void setValue('user_goals', next);
  };

  const handleContinue = () => {
    if (data.user_goals.length === 0) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'goals' });
    navigation.navigate('OnboardingBlocks');
  };

  return (
    <OnboardingShell
      title="Which wins matter most?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: data.user_goals.length === 0 }}
      progress={ONBOARDING_PROGRESS.OnboardingGoals}
      mascotHero
    >
      <View style={styles.stack}>
        {GOAL_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
            selected={data.user_goals.includes(option.key)}
            onPress={() => toggleGoal(option.key)}
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
