import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { AVOIDANCE_OPTIONS, BLOCK_OPTIONS, GOAL_OPTIONS, OUTCOME_OPTIONS } from '@/data/onboardingOptions';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { deriveActiveCategories } from '@/utils/deriveCategories';
import { spacing } from '@/utils/spacing';

export type SummaryScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingSummary'>;

type Option = { key: string; label: string };

const toMap = (options: Option[]) => Object.fromEntries(options.map((option) => [option.key, option.label]));

const goalLabelMap = toMap(GOAL_OPTIONS);
const blockLabelMap = toMap(BLOCK_OPTIONS);
const avoidanceLabelMap = toMap(AVOIDANCE_OPTIONS);
const outcomeLabelMap = toMap(OUTCOME_OPTIONS);

export function SummaryScreen({ navigation }: SummaryScreenProps) {
  const { data } = useOnboarding();
  const derivedCategories = useMemo(() => deriveActiveCategories(data), [data]);

  useEffect(() => {
    trackScreen('OnboardingSummary');
    capture('onboarding_step_viewed', { stepName: 'summary', derivedCategories });
  }, [derivedCategories]);

  const renderPills = (items: string[]) => (
    <View style={styles.pills}>
      {items.map((item) => (
        <View style={styles.pill} key={item}>
          <Text style={styles.pillText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const sections = [
    {
      title: 'Goals',
      items: data.user_goals.map((key) => goalLabelMap[key] ?? key),
    },
    {
      title: 'Blocks',
      items: data.user_blocks.map((key) => blockLabelMap[key] ?? key),
    },
    {
      title: 'Avoidance',
      items: data.user_avoidance.map((key) => avoidanceLabelMap[key] ?? key),
    },
  ];

  return (
    <OnboardingShell
      title="Preview your ritual"
      primaryCta={{
        label: 'Continue',
        onPress: () => {
          capture('onboarding_step_completed', { stepName: 'summary', derivedCategories });
          navigation.navigate('OnboardingTrialOffer');
        },
      }}
      progress={ONBOARDING_PROGRESS.OnboardingSummary}
      mascotHero
    >
      <View style={styles.card}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {renderPills(section.items)}
          </View>
        ))}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outcome</Text>
          <Text style={styles.body}>{data.primary_outcome ? outcomeLabelMap[data.primary_outcome] : '—'}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily focus</Text>
          <Text style={styles.body}>{data.custom_focus_text?.trim().length ? data.custom_focus_text : 'No note set'}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active categories</Text>
          {derivedCategories.length > 0 ? (
            renderPills(derivedCategories)
          ) : (
            <Text style={styles.body}>We’ll fallback to Mix until you finish.</Text>
          )}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GRIT.colors.bg1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    padding: spacing(4),
    gap: spacing(3),
  },
  section: {
    gap: spacing(1),
  },
  sectionTitle: {
    color: GRIT.colors.text2,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    color: GRIT.colors.text0,
    fontSize: 16,
    fontWeight: '600',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1),
  },
  pill: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: 12,
    backgroundColor: GRIT.colors.bg2,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
  },
  pillText: {
    color: GRIT.colors.text0,
    fontSize: 14,
    fontWeight: '600',
  },
});
