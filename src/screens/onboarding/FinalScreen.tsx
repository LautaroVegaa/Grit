import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { saveSelectedCategories } from '@/storage/preferences';
import { GRIT } from '@/theme/gritTheme';
import { deriveActiveCategories } from '@/utils/deriveCategories';
import { spacing } from '@/utils/spacing';

export type FinalScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFinal'>;

export function FinalScreen(_: FinalScreenProps) {
  const { data, setValue, updateForceOnboarding } = useOnboarding();
  const [finishing, setFinishing] = useState(false);
  const derivedCategories = useMemo(() => deriveActiveCategories(data), [data]);

  useEffect(() => {
    trackScreen('OnboardingFinal');
    capture('onboarding_step_viewed', { stepName: 'final' });
  }, []);

  const handleFinish = async () => {
    if (finishing) {
      return;
    }
    setFinishing(true);
    try {
      capture('onboarding_step_completed', { stepName: 'final' });
      await setValue('active_categories', derivedCategories);
      await saveSelectedCategories(derivedCategories);
      await setValue('completed', true);
      await updateForceOnboarding(false);
      capture('onboarding_completed', {
        categories: derivedCategories,
        goals: data.user_goals,
        blocks: data.user_blocks,
        avoidance: data.user_avoidance,
        outcome: data.primary_outcome,
      });
    } catch (error) {
      capture('onboarding_completion_error', { message: error instanceof Error ? error.message : 'unknown' });
    } finally {
      setFinishing(false);
    }
  };

  return (
    <OnboardingShell
      title="You’re set"
      primaryCta={{ label: finishing ? 'Finishing…' : 'Enter GRIT', onPress: handleFinish, disabled: finishing }}
      progress={ONBOARDING_PROGRESS.OnboardingFinal}
      mascotHero
    >
      <View style={styles.card}>
        <Text style={styles.headline}>We’ll start with:</Text>
        <View style={styles.pills}>
          {derivedCategories.length > 0 ? (
            derivedCategories.map((category) => (
              <View key={category} style={styles.pill}>
                <Text style={styles.pillText}>{category}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>We’ll start with Mix until you set a focus.</Text>
          )}
        </View>
        {finishing ? <ActivityIndicator color={GRIT.colors.blue} /> : null}
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
    gap: spacing(2),
  },
  headline: {
    color: GRIT.colors.text0,
    fontSize: 18,
    fontWeight: '700',
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
  emptyText: {
    color: GRIT.colors.text1,
    fontSize: 14,
  },
});
