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

const AGE_OPTIONS = [
  { key: '18-24', label: '18-24' },
  { key: '25-34', label: '25-34' },
  { key: '35-44', label: '35-44' },
  { key: '45-54', label: '45-54' },
  { key: '55+', label: '55+' },
];

export type AgeScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingAge'>;

export function AgeScreen({ navigation }: AgeScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.user_age_range;

  useEffect(() => {
    trackScreen('OnboardingAge');
    capture('onboarding_step_viewed', { stepName: 'age' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'user_age_range', value: key });
    void setValue('user_age_range', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'age', value: selected });
    navigation.navigate('OnboardingIdentity');
  };

  return (
    <OnboardingShell
      title="How old are you?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingAge}
      mascotHero
    >
      <View style={styles.stack}>
        {AGE_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
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
