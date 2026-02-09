import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

const FOCUS_SUGGESTIONS = ['No excuses', 'Phone away', 'Deep work', 'Stay calm', 'Execute'];

export type FocusScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFocus'>;

export function FocusScreen({ navigation }: FocusScreenProps) {
  const { data, setValue } = useOnboarding();
  const [text, setText] = useState<string>(data.custom_focus_text ?? '');

  useEffect(() => {
    trackScreen('OnboardingFocus');
    capture('onboarding_step_viewed', { stepName: 'focus' });
  }, []);

  useEffect(() => {
    setText(data.custom_focus_text ?? '');
  }, [data.custom_focus_text]);

  const trimmed = useMemo(() => text.trim(), [text]);

  const handleChange = (value: string) => {
    setText(value);
    void setValue('custom_focus_text', value);
  };

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'focus', length: trimmed.length });
    navigation.navigate('OnboardingSummary');
  };

  const handleSkip = () => {
    capture('onboarding_focus_skipped');
    void setValue('custom_focus_text', '');
    navigation.navigate('OnboardingSummary');
  };

  return (
    <OnboardingShell
      title="Name your daily focus."
      primaryCta={{ label: 'Continue', onPress: handleContinue, disabled: trimmed.length < 6 }}
      secondaryCta={{ label: 'Skip', onPress: handleSkip }}
      progress={ONBOARDING_PROGRESS.OnboardingFocus}
      mascotHero
    >
      <View style={styles.card}>
        <Text style={styles.label}>My daily focus</Text>
        <TextInput
          value={text}
          onChangeText={handleChange}
          placeholder="e.g. Slow down before decision spikes"
          placeholderTextColor={GRIT.colors.text2}
          multiline
          numberOfLines={4}
          style={styles.input}
          maxLength={160}
        />
        <Text style={styles.helper}>Min 6 characters. This fuels your categories.</Text>
        <View style={styles.chipWrap}>
          {FOCUS_SUGGESTIONS.map((suggestion) => {
            const selected = trimmed === suggestion;
            return (
              <Pressable
                key={suggestion}
                onPress={() => handleChange(suggestion)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{suggestion}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GRIT.colors.bg2,
    borderRadius: 16,
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
    fontSize: 18,
    fontWeight: '600',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helper: {
    color: GRIT.colors.text1,
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing(2),
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
    marginRight: spacing(1),
    marginBottom: spacing(1),
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: GRIT.colors.blue,
    borderColor: GRIT.colors.blue,
  },
  chipLabel: {
    color: GRIT.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: GRIT.colors.text0,
  },
});
