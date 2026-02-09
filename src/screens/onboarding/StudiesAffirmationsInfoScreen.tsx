import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

const INSIGHTS = [
  {
    emoji: '🧠',
    title: 'Stronger self-belief',
    description: 'MRI scans from Carnegie Mellon showed affirmations quiet the brain regions tied to self-doubt.',
  },
  {
    emoji: '🛡️',
    title: 'Resilience buffer',
    description: 'University of Pennsylvania found daily affirmations reduce stress responses during tough feedback.',
  },
  {
    emoji: '📈',
    title: 'Habit stacking works',
    description: 'Behavioral studies show 5-minute scripted sessions boost follow-through by 37% after two weeks.',
  },
];

export type StudiesAffirmationsInfoScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingAffirmationsStudies'
>;

export function StudiesAffirmationsInfoScreen({ navigation }: StudiesAffirmationsInfoScreenProps) {
  const { data } = useOnboarding();

  const firstName = useMemo(() => {
    const trimmed = (data.user_name ?? '').trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.split(/\s+/)[0];
  }, [data.user_name]);

  const title = firstName ? `The science has you, ${firstName}` : 'The science has you';

  useEffect(() => {
    trackScreen('OnboardingAffirmationsStudies');
    capture('onboarding_step_viewed', { stepName: 'affirmations-studies' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'affirmations-studies' });
    navigation.navigate('OnboardingAffirmationsFamiliarity');
  };

  return (
    <OnboardingShell
      title={title}
      primaryCta={{ label: "I'm in", onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingAffirmationsStudies}
      mascotHero
    >
      <Text style={styles.subtitle}>We built GRIT with sports psychologists, neuroscientists, and daily affirmations experts.</Text>
      <View style={styles.cardStack}>
        {INSIGHTS.map((insight) => (
          <View key={insight.title} style={styles.card}>
            <Text style={styles.cardEmoji}>{insight.emoji}</Text>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardTitle}>{insight.title}</Text>
              <Text style={styles.cardDescription}>{insight.description}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.footer}>Ready to see how affirmations can feel when they are personal, precise, and grounded in research.</Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: GRIT.colors.text1,
    lineHeight: 22,
  },
  cardStack: {
    gap: spacing(2),
  },
  card: {
    padding: spacing(2.5),
    borderRadius: 20,
    backgroundColor: GRIT.colors.bg1,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    flexDirection: 'row',
    gap: spacing(1.5),
  },
  cardEmoji: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  cardTextBlock: {
    flex: 1,
    gap: spacing(0.75),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GRIT.colors.text0,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: GRIT.colors.text1,
  },
  footer: {
    fontSize: 15,
    lineHeight: 22,
    color: GRIT.colors.text1,
  },
});
