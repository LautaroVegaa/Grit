import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

export type NameScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingName'>;

export function NameScreen({ navigation }: NameScreenProps) {
  const { data, setValue } = useOnboarding();
  const [name, setName] = useState<string>(data.user_name ?? '');

  useEffect(() => {
    trackScreen('OnboardingName');
    capture('onboarding_step_viewed', { stepName: 'name' });
  }, []);

  useEffect(() => {
    setName(data.user_name ?? '');
  }, [data.user_name]);

  const trimmed = useMemo(() => name.trim(), [name]);

  const handleChange = (value: string) => {
    setName(value);
    void setValue('user_name', value);
  };

  const handleContinue = () => {
    if (!trimmed.length) {
      return;
    }
    capture('onboarding_step_completed', { stepName: 'name', value: trimmed });
    navigation.navigate('OnboardingAge');
  };

  return (
    <OnboardingShell
      title="What's your name?"
      primaryCta={{ label: 'Next', onPress: handleContinue, disabled: trimmed.length === 0 }}
      progress={ONBOARDING_PROGRESS.OnboardingName}
      mascotHero
    >
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={handleChange}
          placeholder="Enter your name"
          placeholderTextColor={GRIT.colors.text2}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GRIT.colors.bg2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    padding: spacing(3),
    gap: spacing(1.5),
  },
  label: {
    color: GRIT.colors.text2,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    color: GRIT.colors.text0,
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: spacing(1),
  },
});
