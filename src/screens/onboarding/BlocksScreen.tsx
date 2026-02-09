import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { BLOCK_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

export type BlocksScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingBlocks'>;

export function BlocksScreen({ navigation }: BlocksScreenProps) {
  const { data, setValue } = useOnboarding();

  useEffect(() => {
    trackScreen('OnboardingBlocks');
    capture('onboarding_step_viewed', { stepName: 'blocks' });
  }, []);

  const toggleBlock = (key: string) => {
    const exists = data.user_blocks.includes(key);
    const next = exists ? data.user_blocks.filter((item) => item !== key) : [...data.user_blocks, key];
    capture('onboarding_answer_changed', {
      field: 'user_blocks',
      value: next,
    });
    void setValue('user_blocks', next);
  };

  const handleContinue = () => {
    if (data.user_blocks.length === 0) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'blocks', answers: data.user_blocks });
    navigation.navigate('OnboardingAvoidance');
  };

  return (
    <OnboardingShell
      title="What knocks you off track?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: data.user_blocks.length === 0 }}
      progress={ONBOARDING_PROGRESS.OnboardingBlocks}
      mascotHero
    >
      <View style={styles.stack}>
        {BLOCK_OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            title={option.label}
            selected={data.user_blocks.includes(option.key)}
            onPress={() => toggleBlock(option.key)}
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
