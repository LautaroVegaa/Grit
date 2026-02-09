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

const RELATIONSHIP_OPTIONS = [
  { key: 'single_open', label: 'Grinding solo but open to a crew', emoji: '🏃‍♂️' },
  { key: 'complicated', label: 'Accountability is hit or miss', emoji: '🎯' },
  { key: 'happily_single', label: 'I like training alone', emoji: '🧘' },
  { key: 'happy_relationship', label: 'I have a steady training partner', emoji: '🤝' },
  { key: 'breakup', label: 'Rebuilding after setbacks', emoji: '🧩' },
  { key: 'not_interested', label: 'Skip this topic', emoji: '⏭️' },
];

export type RelationshipScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingRelationship'>;

export function RelationshipScreen({ navigation }: RelationshipScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.user_relationship_status;

  useEffect(() => {
    trackScreen('OnboardingRelationship');
    capture('onboarding_step_viewed', { stepName: 'relationship' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'user_relationship_status', value: key });
    void setValue('user_relationship_status', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'relationship', value: selected });
    navigation.navigate('OnboardingEmployment');
  };

  const handleSkip = async () => {
    capture('onboarding_step_skipped', { stepName: 'relationship' });
    await setValue('user_relationship_status', null);
    navigation.navigate('OnboardingEmployment');
  };

  return (
    <OnboardingShell
      title="Who keeps you accountable?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingRelationship}
      mascotHero
      showSkip
      onSkip={handleSkip}
    >
      <View style={styles.stack}>
        {RELATIONSHIP_OPTIONS.map((option) => (
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
