import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_COUNT = 8;
const DEFAULT_START = '09:00';
const DEFAULT_END = '22:00';

const DAY_MINUTES = 24 * 60;

function timeStringToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes: number) {
  const minutes = Math.max(0, Math.min(DAY_MINUTES - 1, totalMinutes));
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function minutesToDate(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(DAY_MINUTES - 1, totalMinutes));
  const date = new Date();
  date.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
  return date;
}

export type AffirmationsNotificationScheduleScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingAffirmationsNotificationSchedule'
>;

export function AffirmationsNotificationScheduleScreen({ navigation }: AffirmationsNotificationScheduleScreenProps) {
  const { data, setValue } = useOnboarding();
  const [count, setCount] = useState(data.affirmations_notif_count ?? DEFAULT_COUNT);
  const [startMinutes, setStartMinutes] = useState(
    timeStringToMinutes(data.affirmations_notif_start ?? DEFAULT_START)
  );
  const [endMinutes, setEndMinutes] = useState(timeStringToMinutes(data.affirmations_notif_end ?? DEFAULT_END));
  const [iosPickerField, setIosPickerField] = useState<'start' | 'end' | null>(null);
  const cardOneProgress = useRef(new Animated.Value(0)).current;
  const cardTwoProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackScreen('OnboardingAffirmationsNotificationSchedule');
    capture('onboarding_step_viewed', { stepName: 'affirmations-schedule' });
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) {
        return;
      }
      if (reduceMotion) {
        cardOneProgress.setValue(1);
        cardTwoProgress.setValue(1);
        return;
      }
      Animated.sequence([
        Animated.timing(cardOneProgress, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(180),
        Animated.timing(cardTwoProgress, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const helperLine = useMemo(
    () =>
      `You’ll receive ${count} notifications per day between ${minutesToTimeString(startMinutes)} and ${minutesToTimeString(endMinutes)}.`,
    [count, endMinutes, startMinutes]
  );

  const clampEnd = (nextStart: number, proposedEnd: number) => {
    if (proposedEnd <= nextStart) {
      return Math.min(nextStart + 60, DAY_MINUTES - 1);
    }
    return proposedEnd;
  };

  const handleAdjustCount = (delta: number) => {
    setCount((prev) => {
      const next = Math.max(MIN_COUNT, Math.min(MAX_COUNT, prev + delta));
      if (next !== prev) {
        capture('onboarding_answer_changed', { field: 'affirmations_notif_count', value: next });
      }
      return next;
    });
  };

  const applyStartMinutes = (minutes: number) => {
    setStartMinutes((prev) => {
      const clamped = Math.max(0, Math.min(DAY_MINUTES - 1, minutes));
      if (clamped !== prev) {
        capture('onboarding_answer_changed', {
          field: 'affirmations_notif_start',
          value: minutesToTimeString(clamped),
        });
      }
      setEndMinutes((currentEnd) => clampEnd(clamped, currentEnd));
      return clamped;
    });
  };

  const applyEndMinutes = (minutes: number) => {
    setEndMinutes((prev) => {
      const clamped = Math.max(0, Math.min(DAY_MINUTES - 1, minutes));
      const adjusted = clampEnd(startMinutes, clamped);
      if (adjusted !== prev) {
        capture('onboarding_answer_changed', {
          field: 'affirmations_notif_end',
          value: minutesToTimeString(adjusted),
        });
      }
      return adjusted;
    });
  };

  const showPicker = (field: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'time',
        is24Hour: true,
        value: minutesToDate(field === 'start' ? startMinutes : endMinutes),
        onChange: (_, date) => {
          if (!date) {
            return;
          }
          const minutes = date.getHours() * 60 + date.getMinutes();
          if (field === 'start') {
            applyStartMinutes(minutes);
          } else {
            applyEndMinutes(minutes);
          }
        },
      });
      return;
    }
    setIosPickerField(field);
  };

  const closeIosPicker = () => {
    setIosPickerField(null);
  };

  const handleIosChange = (_: unknown, date?: Date) => {
    if (!date || !iosPickerField) {
      return;
    }
    const minutes = date.getHours() * 60 + date.getMinutes();
    if (iosPickerField === 'start') {
      applyStartMinutes(minutes);
    } else {
      applyEndMinutes(minutes);
    }
  };

  const handleContinue = async () => {
    const startValue = minutesToTimeString(startMinutes);
    const endValue = minutesToTimeString(endMinutes);
    capture('onboarding_step_completed', {
      stepName: 'affirmations-schedule',
      count,
      start: startValue,
      end: endValue,
    });
    await setValue('affirmations_notif_count', count);
    await setValue('affirmations_notif_start', startValue);
    await setValue('affirmations_notif_end', endValue);
    navigation.navigate('OnboardingAwarenessBreather');
  };

  const handleSkip = async () => {
    capture('onboarding_step_skipped', { stepName: 'affirmations-schedule' });
    await setValue('affirmations_notif_count', DEFAULT_COUNT);
    await setValue('affirmations_notif_start', DEFAULT_START);
    await setValue('affirmations_notif_end', DEFAULT_END);
    navigation.navigate('OnboardingAwarenessBreather');
  };

  const canDecrement = count <= MIN_COUNT;
  const canIncrement = count >= MAX_COUNT;

  return (
    <>
      <OnboardingShell
        title="Set your reminder window"
        primaryCta={{ label: 'Continue', onPress: handleContinue }}
        progress={ONBOARDING_PROGRESS.OnboardingAffirmationsNotificationSchedule}
        mascotHero
        showSkip
        onSkip={handleSkip}
      >
        <View style={styles.previewStack}>
          <Animated.View
            style={[
              styles.previewCard,
              styles.previewCardSecondary,
              {
                opacity: cardOneProgress,
                transform: [
                  {
                    translateY: cardOneProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-14, 0],
                    }),
                  },
                  {
                    scale: cardOneProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                  { translateY: 10 },
                ],
              },
            ]}
          >
            <View style={styles.previewBadge} />
            <View style={styles.previewTextBlock}>
              <Text style={styles.previewTime}>now</Text>
              <Text style={styles.previewBody}>
                Today is full of possibilities. Embrace them with open arms.
              </Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              styles.previewCard,
              styles.previewCardPrimary,
              {
                opacity: cardTwoProgress,
                transform: [
                  {
                    translateY: cardTwoProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-14, 0],
                    }),
                  },
                  {
                    scale: cardTwoProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                  { translateY: -30 },
                ],
              },
            ]}
          >
            <View style={styles.previewBadge} />
            <View style={styles.previewTextBlock}>
              <Text style={styles.previewTime}>now</Text>
              <Text style={styles.previewBody}>
                You are capable of achieving great things. Trust yourself.
              </Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>How many</Text>
          <View style={styles.countRow}>
            <Pressable
              onPress={() => handleAdjustCount(-1)}
              disabled={canDecrement}
              style={[styles.circleButton, canDecrement && styles.circleButtonDisabled]}
            >
              <Text style={styles.circleButtonLabel}>-</Text>
            </Pressable>
            <Text style={styles.countValue}>{count}x</Text>
            <Pressable
              onPress={() => handleAdjustCount(1)}
              disabled={canIncrement}
              style={[styles.circleButton, canIncrement && styles.circleButtonDisabled]}
            >
              <Text style={styles.circleButtonLabel}>+</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.frequencyCaption}>You can change this anytime. Most athletes start with 6x.</Text>

        <View style={styles.timeCard}>
          <Text style={styles.cardLabel}>Start at</Text>
          <Pressable style={styles.timePill} onPress={() => showPicker('start')}>
            <Text style={styles.timeValue}>{minutesToTimeString(startMinutes)}</Text>
          </Pressable>
        </View>

        <View style={styles.timeCard}>
          <Text style={styles.cardLabel}>End at</Text>
          <Pressable style={styles.timePill} onPress={() => showPicker('end')}>
            <Text style={styles.timeValue}>{minutesToTimeString(endMinutes)}</Text>
          </Pressable>
        </View>

        <Text style={styles.helper}>{helperLine}</Text>
      </OnboardingShell>

      {Platform.OS === 'ios' && iosPickerField ? (
        <Modal transparent animationType="fade" onRequestClose={closeIosPicker}>
          <TouchableWithoutFeedback onPress={closeIosPicker}>
            <View style={styles.pickerBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.pickerSheet}>
                  <DateTimePicker
                    mode="time"
                    display="spinner"
                    value={minutesToDate(iosPickerField === 'start' ? startMinutes : endMinutes)}
                    onChange={handleIosChange}
                  />
                  <Pressable style={styles.pickerDone} onPress={closeIosPicker}>
                    <Text style={styles.pickerDoneLabel}>Done</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  previewStack: {
    gap: spacing(2),
  },
  previewCard: {
    flexDirection: 'row',
    gap: spacing(2),
    borderRadius: 20,
    padding: spacing(2.5),
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    backgroundColor: GRIT.colors.bg1,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  previewCardSecondary: {
    opacity: 0.6,
    transform: [{ translateY: 10 }],
  },
  previewCardPrimary: {
    marginTop: -30,
  },
  previewBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GRIT.colors.blue,
  },
  previewTextBlock: {
    flex: 1,
    gap: spacing(0.5),
  },
  previewTime: {
    color: GRIT.colors.text2,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewBody: {
    color: GRIT.colors.text0,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginTop: spacing(0.5),
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    backgroundColor: GRIT.colors.bg1,
    padding: spacing(2.5),
    gap: spacing(2),
  },
  frequencyCaption: {
    fontSize: 13,
    color: GRIT.colors.text2,
    marginTop: spacing(1),
  },
  cardLabel: {
    color: GRIT.colors.text2,
    fontSize: 14,
    fontWeight: '600',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonDisabled: {
    opacity: 0.3,
  },
  circleButtonLabel: {
    color: GRIT.colors.text0,
    fontSize: 24,
    fontWeight: '600',
  },
  countValue: {
    color: GRIT.colors.text0,
    fontSize: 32,
    fontWeight: '800',
  },
  timeCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    backgroundColor: GRIT.colors.bg1,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePill: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timeValue: {
    color: GRIT.colors.text0,
    fontSize: 18,
    fontWeight: '700',
  },
  helper: {
    textAlign: 'center',
    color: GRIT.colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: spacing(3),
  },
  pickerSheet: {
    borderRadius: 24,
    backgroundColor: GRIT.colors.bg1,
    paddingTop: spacing(2),
    paddingBottom: spacing(1),
  },
  pickerDone: {
    paddingVertical: spacing(1.5),
    alignItems: 'center',
  },
  pickerDoneLabel: {
    color: GRIT.colors.blue,
    fontSize: 16,
    fontWeight: '700',
  },
});
