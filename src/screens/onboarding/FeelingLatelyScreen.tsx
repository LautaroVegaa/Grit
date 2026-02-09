import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { FEELING_LATELY_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type FeelingLatelyScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFeelingLately'>;

export function FeelingLatelyScreen({ navigation }: FeelingLatelyScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.feeling_lately;

  const firstName = useMemo(() => {
    const trimmed = (data.user_name ?? '').trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.split(/\s+/)[0];
  }, [data.user_name]);

  const title = firstName
    ? `How steady does training feel, ${firstName}?`
    : 'How steady does training feel?';

  useEffect(() => {
    trackScreen('OnboardingFeelingLately');
    capture('onboarding_step_viewed', { stepName: 'feeling-lately' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'feeling_lately', value: key });
    void setValue('feeling_lately', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'feeling-lately', value: selected });
    navigation.navigate('OnboardingFutureFeeling');
  };

  return (
    <OnboardingShell
      title={title}
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingFeelingLately}
      mascotHero
    >
      <View style={styles.stack}>
        {FEELING_LATELY_OPTIONS.map((option) => (
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
