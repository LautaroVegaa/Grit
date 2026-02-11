import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import type { OnboardingData } from '@/storage/onboarding';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

type PermissionState = OnboardingData['notifications_permission'];
type NativePermissionStatus = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

function derivePermissionState(settings: NativePermissionStatus): PermissionState {
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }
  if (settings.status === 'denied' || settings.ios?.status === Notifications.IosAuthorizationStatus.DENIED) {
    return 'denied';
  }
  return 'undetermined';
}

export type NotificationsPermissionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingNotificationsPermission'
>;

export function NotificationsPermissionScreen({ navigation }: NotificationsPermissionScreenProps) {
  const { setValue } = useOnboarding();
  const [permissionState, setPermissionState] = useState<PermissionState>('undetermined');
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;

  const persistStateOnly = useCallback(
    async (state: PermissionState) => {
      await setValue('notifications_permission', state);
    },
    [setValue]
  );

  const persistAndContinue = useCallback(
    async (state: PermissionState) => {
      await persistStateOnly(state);
      navigation.navigate('OnboardingAffirmationsNotificationSchedule');
    },
    [navigation, persistStateOnly]
  );

  useEffect(() => {
    console.log('[NotificationsPermissionScreen] mounted');
    trackScreen('OnboardingNotificationsPermission');
    capture('onboarding_step_viewed', { stepName: 'notifications-permission' });
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setCheckingStatus(true);

      const checkExistingPermission = async () => {
        try {
          const settings = await Notifications.getPermissionsAsync();
          const state = derivePermissionState(settings);
          if (state === 'granted') {
            capture('onboarding_notifications_permission_autoskip', { status: state });
            await persistAndContinue('granted');
            return;
          }
          if (!cancelled) {
            if (state === 'denied') {
              await persistStateOnly('denied');
            }
            setPermissionState(state);
            setCheckingStatus(false);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('Failed to load notification permission state', error);
          }
          if (!cancelled) {
            setPermissionState('undetermined');
            setCheckingStatus(false);
          }
        }
      };

      void checkExistingPermission();

      return () => {
        cancelled = true;
      };
    }, [persistAndContinue, persistStateOnly])
  );

  const handleSkip = useCallback(async () => {
    capture('onboarding_step_skipped', { stepName: 'notifications-permission' });
    await persistAndContinue('skipped');
  }, [persistAndContinue]);

  const handleDontAllow = useCallback(async () => {
    if (requesting) {
      return;
    }
    capture('onboarding_notifications_permission_declined');
    await persistAndContinue('denied');
  }, [persistAndContinue, requesting]);

  const handleAllow = useCallback(async () => {
    if (checkingStatus || requesting) {
      return;
    }
    setRequesting(true);
    try {
      capture('onboarding_notifications_permission_request');
      const requestedSettings = await Notifications.requestPermissionsAsync();
      const requestedState = derivePermissionState(requestedSettings);
      if (requestedState === 'granted') {
        capture('onboarding_notifications_permission_result', { status: 'granted', source: 'request' });
        capture('onboarding_step_completed', { stepName: 'notifications-permission', status: 'granted' });
        await persistAndContinue('granted');
        return;
      }
      capture('onboarding_notifications_permission_result', { status: 'denied', source: 'request' });
      await persistStateOnly('denied');
      setPermissionState('denied');
    } catch (error) {
      capture('onboarding_notifications_permission_error', {
        message: error instanceof Error ? error.message : 'unknown',
      });
      await persistStateOnly('denied');
      setPermissionState('denied');
    } finally {
      setRequesting(false);
    }
  }, [checkingStatus, persistAndContinue, persistStateOnly, requesting]);

  const helperStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
      {
        scale: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  } as const;

  const helperCopy =
    permissionState === 'denied'
      ? 'Notifications are off for now. You can change this anytime in Settings.'
      : 'You can change this anytime in Settings.';

  return (
    <OnboardingShell
      title="Stay on plan with reminders."
      progress={ONBOARDING_PROGRESS.OnboardingNotificationsPermission}
      mascotHero
      showSkip
      onSkip={handleSkip}
      hideFooter
    >
      <Animated.View style={[styles.mockCard, helperStyle]}>
        <View style={styles.mockHeader}>
          <View style={styles.mockIconWrap}>
            <View style={styles.mockIcon} />
          </View>
          <View style={styles.mockHeaderText}>
            <Text style={styles.mockTitle}>&quot;GRIT&quot; Would Like to Send You Notifications</Text>
            <Text style={styles.mockBody}>Notifications may include alerts, sounds, and icon badges.</Text>
          </View>
        </View>
        <View style={styles.mockButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.mockButton,
              styles.mockButtonSecondary,
              pressed ? styles.mockButtonSecondaryPressed : null,
            ]}
            onPress={handleDontAllow}
            accessibilityRole="button"
            accessibilityLabel="Don&apos;t allow notifications"
          >
            <Text style={styles.mockButtonSecondaryLabel}>Don&apos;t Allow</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.mockButton,
              styles.mockButtonPrimary,
              pressed ? styles.mockButtonPrimaryPressed : null,
            ]}
            onPress={handleAllow}
            disabled={checkingStatus || requesting}
            accessibilityRole="button"
            accessibilityLabel="Allow notifications"
          >
            <Text style={styles.mockButtonPrimaryLabel}>{requesting ? 'Requesting…' : 'Allow'}</Text>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.helperNote, helperStyle]}>
        {helperCopy}
      </Animated.Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  mockCard: {
    width: '100%',
    borderRadius: 28,
    padding: spacing(3),
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    gap: spacing(2.5),
  },
  mockHeader: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  mockIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GRIT.colors.blue,
  },
  mockHeaderText: {
    flex: 1,
    gap: spacing(1),
  },
  mockTitle: {
    color: GRIT.colors.text0,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  mockBody: {
    color: GRIT.colors.text2,
    fontSize: 14,
    lineHeight: 20,
  },
  mockButtons: {
    flexDirection: 'row',
    gap: spacing(1.5),
  },
  mockButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
  },
  mockButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mockButtonSecondaryPressed: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  mockButtonPrimary: {
    backgroundColor: GRIT.colors.blue,
  },
  mockButtonPrimaryPressed: {
    backgroundColor: GRIT.colors.blue2,
  },
  mockButtonSecondaryLabel: {
    color: GRIT.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  mockButtonPrimaryLabel: {
    color: '#080C15',
    fontSize: 15,
    fontWeight: '700',
  },
  helperNote: {
    color: GRIT.colors.text2,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
