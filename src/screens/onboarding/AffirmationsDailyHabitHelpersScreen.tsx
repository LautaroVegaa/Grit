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
  { key: 'reminders', label: 'Getting regular reminders', emoji: '🔔' },
  { key: 'tracking', label: 'Tracking my progress', emoji: '📊' },
  { key: 'widget', label: 'A home/lock screen widget', emoji: '📱' },
  { key: 'unknown', label: "I don't know yet", emoji: '🤷' },
];

export type AffirmationsDailyHabitHelpersScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingAffirmationsDailyHabitHelpers'
>;

export function AffirmationsDailyHabitHelpersScreen({ navigation }: AffirmationsDailyHabitHelpersScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.affirmations_daily_habit_helpers ?? [];

  useEffect(() => {
    trackScreen('OnboardingAffirmationsDailyHabitHelpers');
    capture('onboarding_step_viewed', { stepName: 'affirmations-daily-helpers' });
  }, []);

  const toggleOption = (key: string) => {
    let next: string[] = [];
    const exists = selected.includes(key);

    if (key === 'unknown') {
      next = exists ? [] : ['unknown'];
    } else {
      const filtered = selected.filter((item) => item !== key && item !== 'unknown');
      next = exists ? filtered : [...filtered, key];
    }

    capture('onboarding_answer_changed', { field: 'affirmations_daily_habit_helpers', value: next });
    void setValue('affirmations_daily_habit_helpers', next);
  };

  const handleContinue = () => {
    if (selected.length === 0) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'affirmations-daily-helpers', value: selected });
    navigation.navigate('OnboardingNotificationsPermission');
  };

  const handleSkip = async () => {
    capture('onboarding_step_skipped', { stepName: 'affirmations-daily-helpers' });
    await setValue('affirmations_daily_habit_helpers', []);
    navigation.navigate('OnboardingNotificationsPermission');
  };

  return (
    <OnboardingShell
      title="What helps you stay consistent?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: selected.length === 0 }}
      progress={ONBOARDING_PROGRESS.OnboardingAffirmationsDailyHabitHelpers}
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
            selected={selected.includes(option.key)}
            onPress={() => toggleOption(option.key)}
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
