import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

const EMPLOYMENT_OPTIONS = [
  { key: 'studying', label: 'Studying', emoji: '📚' },
  { key: 'looking', label: 'Looking for a job', emoji: '🔎' },
  { key: 'working', label: 'Working', emoji: '💼' },
  { key: 'retired', label: 'Retired', emoji: '🏖️' },
  { key: 'stay_home_parent', label: 'Stay at home parent', emoji: '🏠' },
  { key: 'other', label: 'Other', emoji: '✨' },
];

export type EmploymentScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingEmployment'>;

export function EmploymentScreen({ navigation }: EmploymentScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.user_employment_status;

  useEffect(() => {
    trackScreen('OnboardingEmployment');
    capture('onboarding_step_viewed', { stepName: 'employment' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'user_employment_status', value: key });
    void setValue('user_employment_status', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'employment', value: selected });
    navigation.navigate('OnboardingPrimaryGoal');
  };

  const handleSkip = async () => {
    capture('onboarding_step_skipped', { stepName: 'employment' });
    await setValue('user_employment_status', null);
    navigation.navigate('OnboardingPrimaryGoal');
  };

  return (
    <OnboardingShell
      title="What best describes your work?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingEmployment}
      mascotHero
      showSkip
      onSkip={handleSkip}
    >
      <View style={styles.stack}>
        {EMPLOYMENT_OPTIONS.map((option) => (
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
