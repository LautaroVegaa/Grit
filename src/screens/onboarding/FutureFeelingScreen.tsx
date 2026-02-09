import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { FUTURE_FEELING_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type FutureFeelingScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFutureFeeling'>;

export function FutureFeelingScreen({ navigation }: FutureFeelingScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.future_feeling;

  useEffect(() => {
    trackScreen('OnboardingFutureFeeling');
    capture('onboarding_step_viewed', { stepName: 'future-feeling' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'future_feeling', value: key });
    void setValue('future_feeling', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'future-feeling', value: selected });
    navigation.navigate('OnboardingImproveAreas');
  };

  return (
    <OnboardingShell
      title="How ready do you feel for what's next?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingFutureFeeling}
      mascotHero
    >
      <View style={styles.stack}>
        {FUTURE_FEELING_OPTIONS.map((option) => (
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
