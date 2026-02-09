import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { IMPROVEMENT_FOCUS_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type ImproveAreasScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingImproveAreas'>;

export function ImproveAreasScreen({ navigation }: ImproveAreasScreenProps) {
  const { data, setValue } = useOnboarding();
  const selections = data.improvement_focus;

  const firstName = useMemo(() => {
    const trimmed = (data.user_name ?? '').trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.split(/\s+/)[0];
  }, [data.user_name]);

  const title = firstName ? `Where do you need reps, ${firstName}?` : 'Where do you need reps?';

  useEffect(() => {
    trackScreen('OnboardingImproveAreas');
    capture('onboarding_step_viewed', { stepName: 'improve-areas' });
  }, []);

  const toggleArea = (key: string) => {
    const exists = selections.includes(key);
    const next = exists ? selections.filter((entry) => entry !== key) : [...selections, key];
    capture('onboarding_answer_changed', { field: 'improvement_focus', value: next });
    void setValue('improvement_focus', next);
  };

  const handleContinue = () => {
    if (selections.length === 0) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'improve-areas' });
    navigation.navigate('OnboardingAvoidingConfront');
  };

  return (
    <OnboardingShell
      title={title}
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: selections.length === 0 }}
      progress={ONBOARDING_PROGRESS.OnboardingImproveAreas}
      mascotHero
    >
      <View style={styles.stack}>
        {IMPROVEMENT_FOCUS_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
            emoji={option.emoji}
            selected={selections.includes(option.key)}
            onPress={() => toggleArea(option.key)}
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
