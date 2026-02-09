import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { AVOIDING_CONFRONT_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type AvoidingConfrontScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingAvoidingConfront'>;

export function AvoidingConfrontScreen({ navigation }: AvoidingConfrontScreenProps) {
  const { data, setValue } = useOnboarding();
  const selections = data.avoidance_focus;

  const firstName = useMemo(() => {
    const trimmed = (data.user_name ?? '').trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.split(/\s+/)[0];
  }, [data.user_name]);

  const title = firstName ? `What are you putting off, ${firstName}?` : 'What are you putting off?';

  useEffect(() => {
    trackScreen('OnboardingAvoidingConfront');
    capture('onboarding_step_viewed', { stepName: 'avoiding-confront' });
  }, []);

  const toggleSelection = (key: string) => {
    const exists = selections.includes(key);
    const next = exists ? selections.filter((entry) => entry !== key) : [...selections, key];
    capture('onboarding_answer_changed', { field: 'avoidance_focus', value: next });
    void setValue('avoidance_focus', next);
  };

  const handleContinue = () => {
    if (selections.length === 0) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'avoiding-confront' });
    navigation.navigate('OnboardingGoals');
  };

  return (
    <OnboardingShell
      title={title}
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: selections.length === 0 }}
      progress={ONBOARDING_PROGRESS.OnboardingAvoidingConfront}
      mascotHero
    >
      <Text style={styles.lede}>We'll tackle it head-on.</Text>
      <View style={styles.stack}>
        {AVOIDING_CONFRONT_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
            emoji={option.emoji}
            selected={selections.includes(option.key)}
            onPress={() => toggleSelection(option.key)}
            type="check"
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  lede: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: spacing(0.5),
  },
  stack: {
    gap: spacing(2.5),
  },
});
