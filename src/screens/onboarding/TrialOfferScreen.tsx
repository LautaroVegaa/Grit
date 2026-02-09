import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

export type TrialOfferScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingTrialOffer'>;

export function TrialOfferScreen({ navigation }: TrialOfferScreenProps) {
  useEffect(() => {
    trackScreen('OnboardingTrialOffer');
    capture('onboarding_step_viewed', { stepName: 'trial-offer' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'trial-offer' });
    navigation.navigate('OnboardingTrialReminder');
  };

  return (
    <OnboardingShell
      title="We offer 3 days of premium access, just for you"
      primaryCta={{ label: 'Try now for USD0.00', onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingTrialOffer}
      mascotHero
    >
      <View style={styles.heroBlock}>
        <Text style={styles.subtitle}>
          We offer <Text style={styles.highlight}>3 days</Text> of premium access, tailored to your goals.
        </Text>
        <Text style={styles.body}>Unlock every ritual, briefing, and accountability check-in.</Text>
        <Text style={styles.caption}>✓ No Payment Due Now</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    backgroundColor: GRIT.colors.bg1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    padding: spacing(4),
    gap: spacing(2.5),
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: GRIT.colors.text0,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: GRIT.colors.text1,
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
