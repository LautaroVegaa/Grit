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

const IDENTITY_OPTIONS = [
  { key: 'female', label: 'Female', emoji: '👩' },
  { key: 'male', label: 'Male', emoji: '👨' },
  { key: 'others', label: 'Others', emoji: '🏳️‍🌈' },
  { key: 'prefer_not_say', label: 'Prefer not to say', emoji: '🤐' },
];

export type IdentityScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingIdentity'>;

export function IdentityScreen({ navigation }: IdentityScreenProps) {
  const { data, setValue } = useOnboarding();
  const selected = data.user_identity;

  useEffect(() => {
    trackScreen('OnboardingIdentity');
    capture('onboarding_step_viewed', { stepName: 'identity' });
  }, []);

  const handleSelect = (key: string) => {
    capture('onboarding_answer_changed', { field: 'user_identity', value: key });
    void setValue('user_identity', key);
  };

  const handleContinue = () => {
    if (!selected) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'identity', value: selected });
    navigation.navigate('OnboardingRelationship');
  };

  return (
    <OnboardingShell
      title="How do you identify?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: !selected }}
      progress={ONBOARDING_PROGRESS.OnboardingIdentity}
      mascotHero
    >
      <View style={styles.stack}>
        {IDENTITY_OPTIONS.map((option) => (
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
