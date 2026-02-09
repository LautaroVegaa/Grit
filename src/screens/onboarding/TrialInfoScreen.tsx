import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

const TIMELINE_ITEMS = [
  {
    title: 'Today - Begin your journey',
    body: '3 days of full access, completely free.',
  },
  {
    title: 'Day 2 - Trial reminder',
    body: 'We will nudge you before the trial ends.',
  },
  {
    title: 'Day 3 - Keep going',
    body: 'Continue with full access or cancel anytime.',
  },
];

export type TrialInfoScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingTrialInfo'>;

export function TrialInfoScreen({ navigation }: TrialInfoScreenProps) {
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    trackScreen('OnboardingTrialInfo');
    capture('onboarding_step_viewed', { stepName: 'trial-info' });
  }, []);

  const proceed = () => {
    navigation.navigate('OnboardingCommitmentBreather');
  };

  const handleTry = async () => {
    if (subscribing) {
      return;
    }
    setSubscribing(true);
    capture('onboarding_subscription_cta');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      capture('onboarding_subscription_success', { plan: 'grit-monthly' });
      proceed();
    } catch (error) {
      capture('onboarding_subscription_failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleClose = () => {
    capture('onboarding_trial_info_closed');
    proceed();
  };

  const openLink = (url: string, label: string) => {
    capture('onboarding_trial_link_opened', { label });
    Linking.openURL(url).catch(() => {
      // ignore
    });
  };

  const handleRestore = () => {
    capture('onboarding_subscription_restore');
    openLink('https://support.apple.com/en-us/HT204530', 'restore');
  };

  const handleTerms = () => openLink('https://grit.app/terms', 'terms');
  const handlePrivacy = () => openLink('https://grit.app/privacy', 'privacy');

  return (
    <OnboardingShell
      title=""
      hideFooter
      progress={ONBOARDING_PROGRESS.OnboardingTrialInfo}
      mascotHero
    >
      <View style={styles.modalWrapper}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} accessibilityRole="button">
            <Text style={styles.closeLabel}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>How your free trial works</Text>
          <Text style={styles.modalSubtitle}>Nothing will be charged today</Text>
          <View style={styles.timeline}>
            {TIMELINE_ITEMS.map((item, index) => (
              <View key={item.title} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  {index < TIMELINE_ITEMS.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineBody}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            style={[styles.primaryButton, subscribing && styles.primaryDisabled]}
            onPress={handleTry}
            disabled={subscribing}
          >
            {subscribing ? (
              <ActivityIndicator color={GRIT.colors.white} />
            ) : (
              <Text style={styles.primaryLabel}>Try for free</Text>
            )}
          </Pressable>
          <Text style={styles.priceNote}>US$ 0,91/month, billed yearly as USD 11.00/year</Text>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.link}>Restore Purchases</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTerms}>
              <Text style={styles.link}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePrivacy}>
              <Text style={styles.link}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: GRIT.colors.bg1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    padding: spacing(4),
    gap: spacing(2.5),
  },
  closeButton: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    padding: spacing(0.75),
  },
  closeLabel: {
    fontSize: 20,
    color: GRIT.colors.text1,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: GRIT.colors.text0,
  },
  modalSubtitle: {
    fontSize: 16,
    color: GRIT.colors.text1,
  },
  timeline: {
    gap: spacing(3),
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  timelineRail: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GRIT.colors.blue,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: spacing(0.5),
    backgroundColor: GRIT.colors.border0,
  },
  timelineCopy: {
    flex: 1,
    gap: spacing(0.5),
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GRIT.colors.text0,
  },
  timelineBody: {
    fontSize: 15,
    color: GRIT.colors.text1,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: GRIT.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: GRIT.colors.white,
  },
  priceNote: {
    textAlign: 'center',
    fontSize: 14,
    color: GRIT.colors.text1,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    color: GRIT.colors.text1,
    fontWeight: '600',
  },
});
