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

const OPTIONS = [
  { key: 'new', label: 'This is new for me', emoji: '🌱' },
  { key: 'occasional', label: "I've used them occasionally", emoji: '🔄' },
  { key: 'regular', label: 'I use them regularly', emoji: '⭐' },
];

export type AffirmationsFamiliarityScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingAffirmationsFamiliarity'
>;

export function AffirmationsFamiliarityScreen({ navigation }: AffirmationsFamiliarityScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.affirmations_familiarity;

  useEffect(() => {
    trackScreen('OnboardingAffirmationsFamiliarity');
    capture('onboarding_step_viewed', { stepName: 'affirmations-familiarity' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'affirmations_familiarity', value: key });
    void setValue('affirmations_familiarity', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'affirmations-familiarity', value: selected });
    navigation.navigate('OnboardingAffirmationsDailyHabitHelpers');
  };

  const handleSkip = async () => {
    capture('onboarding_step_skipped', { stepName: 'affirmations-familiarity' });
    await setValue('affirmations_familiarity', null);
    navigation.navigate('OnboardingAffirmationsDailyHabitHelpers');
  };

  return (
    <OnboardingShell
      title="How familiar are you?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingAffirmationsFamiliarity}
      mascotHero
      showSkip
      onSkip={handleSkip}
    >
      <View style={styles.stack}>
        {OPTIONS.map((option) => (
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
