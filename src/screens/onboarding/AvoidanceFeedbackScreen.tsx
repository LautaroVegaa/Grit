import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

export type AvoidanceFeedbackScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingAvoidanceFeedback'
>;

const AUTO_ADVANCE_DELAY_MS = 2000;

export function AvoidanceFeedbackScreen({ navigation }: AvoidanceFeedbackScreenProps) {
  const { data } = useOnboarding();

  const firstName = useMemo(() => {
    const trimmed = (data.user_name ?? '').trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.split(/\s+/)[0];
  }, [data.user_name]);

  const message = firstName
    ? `Got it, ${firstName}. We're tailoring your reminders to fix that.`
    : "Got it. We're tailoring your reminders to fix that.";

  useEffect(() => {
    trackScreen('OnboardingAvoidanceFeedback');
    capture('onboarding_step_viewed', { stepName: 'avoidance-feedback' });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      capture('onboarding_step_completed', { stepName: 'avoidance-feedback' });
      navigation.replace('OnboardingMomentumBreather');
    }, AUTO_ADVANCE_DELAY_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [navigation]);

  return (
    <OnboardingShell progress={ONBOARDING_PROGRESS.OnboardingAvoidanceFeedback} title="Locking it in." hideFooter>
      <View style={styles.card}>
        <Text style={styles.body}>{message}</Text>
        <Text style={styles.caption}>Priming your affirmations now.</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GRIT.colors.bg2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    padding: spacing(4),
    gap: spacing(1.5),
  },
  body: {
    fontSize: 20,
    fontWeight: '700',
    color: GRIT.colors.text0,
    lineHeight: 28,
  },
  caption: {
    fontSize: 15,
    color: GRIT.colors.text1,
  },
});
