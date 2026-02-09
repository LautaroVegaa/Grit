import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { TRAINING_TIME_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { DEFAULT_ONBOARDING_DATA } from '@/storage/onboarding';
import { spacing } from '@/utils/spacing';

const TRAINING_NOTIF_WINDOWS: Record<string, { start: string; end: string }> = {
  morning: { start: '07:30', end: '09:00' },
  afternoon: { start: '12:00', end: '15:00' },
  night: { start: '18:00', end: '21:00' },
};

export type TrainingTimeScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingTrainingTime'>;

export function TrainingTimeScreen({ navigation }: TrainingTimeScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.training_time;

  useEffect(() => {
    trackScreen('OnboardingTrainingTime');
    capture('onboarding_step_viewed', { stepName: 'training-time' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'training_time', value: key });
    void setValue('training_time', key);
  };

  const shouldOverrideNotificationWindow = () => {
    const currentStart = data.affirmations_notif_start ?? DEFAULT_ONBOARDING_DATA.affirmations_notif_start;
    const currentEnd = data.affirmations_notif_end ?? DEFAULT_ONBOARDING_DATA.affirmations_notif_end;
    return (
      currentStart === DEFAULT_ONBOARDING_DATA.affirmations_notif_start &&
      currentEnd === DEFAULT_ONBOARDING_DATA.affirmations_notif_end
    );
  };

  const handleContinue = async () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'training-time', value: selected });
    const updates = [setValue('training_time', selected)];
    if (shouldOverrideNotificationWindow()) {
      const window = TRAINING_NOTIF_WINDOWS[selected];
      if (window) {
        updates.push(setValue('affirmations_notif_start', window.start));
        updates.push(setValue('affirmations_notif_end', window.end));
      }
    }
    await Promise.all(updates);
    navigation.navigate('OnboardingFeelingLately');
  };

  return (
    <OnboardingShell
      title="When do you train?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingTrainingTime}
      mascotHero
    >
      <View style={styles.stack}>
        {TRAINING_TIME_OPTIONS.map((option) => (
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
