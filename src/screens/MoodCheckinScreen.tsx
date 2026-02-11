import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { loadMoodForDate, saveDailyMood } from '@/grit/mood/moodStorage';
import type { Mood } from '@/grit/mood/types';
import { MOOD_OPTIONS } from '@/grit/mood/types';
import { MainStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

type Props = NativeStackScreenProps<MainStackParamList, 'MoodCheckin'>;

export default function MoodCheckinScreen({ navigation, route }: Props) {
  const { todayISO } = route.params;
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const stored = await loadMoodForDate(todayISO);
        if (mounted && stored) {
          setSelectedMood(stored);
        }
      } catch {
        // Ignore hydration errors; user can still select a mood.
      }
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, [todayISO]);

  const handleSelect = useCallback((mood: Mood) => {
    setSelectedMood(mood);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedMood || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await saveDailyMood(selectedMood, todayISO);
      navigation.replace('Home');
    } catch {
      Alert.alert('Unable to save mood', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, navigation, selectedMood, todayISO]);

  return (
    <OnboardingShell
      title="How are you feeling right now?"
      primaryCta={{ label: 'Let’s go', onPress: handleSubmit, disabled: !selectedMood || isSaving }}
      mascotHero
    >
      <View style={styles.stack}>
        {MOOD_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            emoji={option.emoji}
            selected={selectedMood === option.id}
            onPress={() => handleSelect(option.id)}
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
