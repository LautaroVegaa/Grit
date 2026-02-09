import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

export type TrialReminderScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingTrialReminder'>;

export function TrialReminderScreen({ navigation }: TrialReminderScreenProps) {
  useEffect(() => {
    trackScreen('OnboardingTrialReminder');
    capture('onboarding_step_viewed', { stepName: 'trial-reminder' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'trial-reminder' });
    navigation.navigate('OnboardingTrialInfo');
  };

  return (
    <OnboardingShell
      title="We’ll send you a reminder 1 day before your trial ends"
      primaryCta={{ label: 'Continue for FREE', onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingTrialReminder}
      mascotHero
    >
      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons name="notifications-outline" size={42} color={GRIT.colors.blue} />
        </View>
        <Text style={styles.subtitle}>
          Expect a heads-up <Text style={styles.highlight}>1 day</Text> before we bill anything.
        </Text>
        <Text style={styles.caption}>✓ No Payment Due Now</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GRIT.colors.bg1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    padding: spacing(4),
    gap: spacing(2.5),
    alignItems: 'center',
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GRIT.colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: GRIT.colors.text0,
    textAlign: 'center',
  },
  caption: {
    fontSize: 15,
    color: GRIT.colors.text1,
    fontWeight: '600',
  },
  highlight: {
    color: GRIT.colors.blue,
  },
});
