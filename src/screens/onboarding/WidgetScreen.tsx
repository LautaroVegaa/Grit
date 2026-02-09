import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

export type WidgetScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingWidget'>;

export function WidgetScreen({ navigation }: WidgetScreenProps) {
  useEffect(() => {
    trackScreen('OnboardingWidget');
    capture('onboarding_step_viewed', { stepName: 'widget' });
  }, []);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'widget' });
    navigation.navigate('OnboardingConsistencyBreather');
  };

  const handleOpenGuide = () => {
    capture('onboarding_widget_guide_opened');
    Linking.openURL('https://support.apple.com/en-us/HT207122').catch(() => {
      // ignore
    });
  };

  return (
    <OnboardingShell
      title="Pin the GRIT widget"
      primaryCta={{ label: 'Got it', onPress: handleContinue }}
      progress={ONBOARDING_PROGRESS.OnboardingWidget}
      mascotHero
    >
      <View style={styles.mockupWrapper}>
        <View style={styles.phoneShell}>
          <View style={styles.phoneNotch} />
          <View style={styles.phoneScreen}>
            <View style={styles.widgetCard}>
              <Text style={styles.widgetLabel}>GRIT WIDGET</Text>
              <Text style={styles.widgetFocus}>STAY IN THE ARENA</Text>
              <Text style={styles.widgetSupport}>Daily focus • Live streak</Text>
            </View>
            <View style={styles.widgetMetaRow}>
              <Text style={styles.widgetMetaLabel}>Streak</Text>
              <Text style={styles.widgetMetaValue}>12 days</Text>
            </View>
          </View>
          <View style={styles.phoneIndicator} />
        </View>
      </View>
      <Text style={styles.body}>Long-press your Home Screen &gt; tap + &gt; search for GRIT.</Text>
      <Text style={styles.body}>Pinning it keeps your focus statement front and center.</Text>
      <TouchableOpacity onPress={handleOpenGuide} activeOpacity={0.85}>
        <Text style={styles.footer}>Need help adding it?</Text>
      </TouchableOpacity>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  mockupWrapper: {
    alignItems: 'center',
  },
  phoneShell: {
    width: 220,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: GRIT.colors.border0,
    padding: spacing(2),
    backgroundColor: GRIT.colors.bg2,
    gap: spacing(2),
  },
  phoneNotch: {
    alignSelf: 'center',
    width: 90,
    height: 16,
    borderRadius: 12,
    backgroundColor: GRIT.colors.bg0,
  },
  phoneScreen: {
    borderRadius: 24,
    backgroundColor: GRIT.colors.bg0,
    padding: spacing(2.5),
    gap: spacing(2),
  },
  widgetCard: {
    borderRadius: 18,
    backgroundColor: GRIT.colors.blue,
    padding: spacing(2),
    gap: spacing(0.75),
  },
  widgetLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: GRIT.colors.text0,
    opacity: 0.7,
  },
  widgetFocus: {
    fontSize: 18,
    fontWeight: '800',
    color: GRIT.colors.text0,
    letterSpacing: 0.5,
  },
  widgetSupport: {
    color: GRIT.colors.text0,
    fontSize: 13,
    opacity: 0.75,
  },
  widgetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetMetaLabel: {
    color: GRIT.colors.text2,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  widgetMetaValue: {
    color: GRIT.colors.text0,
    fontSize: 16,
    fontWeight: '700',
  },
  phoneIndicator: {
    alignSelf: 'center',
    width: 90,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#222',
  },
  body: {
    color: GRIT.colors.text1,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    textAlign: 'center',
    color: GRIT.colors.text1,
    textDecorationLine: 'underline',
  },
});
