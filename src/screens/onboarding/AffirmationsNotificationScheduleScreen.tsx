import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { ReminderWindowScreenContent } from '@/components/ReminderWindowScreenContent';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { useOnboarding } from '@/context/OnboardingContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';
import {
  DAY_MINUTES,
  DEFAULT_REMINDER_COUNT,
  DEFAULT_REMINDER_END,
  DEFAULT_REMINDER_START,
  clampReminderCount,
  ensureValidEndMinutes,
  minutesToDate,
  minutesToTimeString,
  timeStringToMinutes,
} from '@/utils/reminderWindow';


export type AffirmationsNotificationScheduleScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'OnboardingAffirmationsNotificationSchedule'
>;

const clampMinutes = (value: number) => Math.max(0, Math.min(DAY_MINUTES - 1, value));

export function AffirmationsNotificationScheduleScreen({ navigation }: AffirmationsNotificationScheduleScreenProps) {
  const { data, setValue } = useOnboarding();
  const [count, setCount] = useState(data.affirmations_notif_count ?? DEFAULT_REMINDER_COUNT);
  const [startMinutes, setStartMinutes] = useState(
    timeStringToMinutes(data.affirmations_notif_start ?? DEFAULT_REMINDER_START)
  );
  const [endMinutes, setEndMinutes] = useState(timeStringToMinutes(data.affirmations_notif_end ?? DEFAULT_REMINDER_END));
  const [iosPickerField, setIosPickerField] = useState<'start' | 'end' | null>(null);
  useEffect(() => {
    trackScreen('OnboardingAffirmationsNotificationSchedule');
    capture('onboarding_step_viewed', { stepName: 'affirmations-schedule' });
  }, []);

  const helperLine = useMemo(
    () =>
      `You’ll receive ${count} notifications per day between ${minutesToTimeString(startMinutes)} and ${minutesToTimeString(endMinutes)}.`,
    [count, endMinutes, startMinutes]
  );

  const handleAdjustCount = (delta: number) => {
    setCount((prev) => {
      const next = clampReminderCount(prev + delta);
      if (next !== prev) {
        capture('onboarding_answer_changed', { field: 'affirmations_notif_count', value: next });
      }
      return next;
    });
  };

  const applyStartMinutes = (minutes: number) => {
    setStartMinutes((prev) => {
      const clamped = clampMinutes(minutes);
      if (clamped !== prev) {
        capture('onboarding_answer_changed', {
          field: 'affirmations_notif_start',
          value: minutesToTimeString(clamped),
        });
      }
      setEndMinutes((currentEnd) => ensureValidEndMinutes(clamped, currentEnd));
      return clamped;
    });
  };

  const applyEndMinutes = (minutes: number) => {
    setEndMinutes((prev) => {
      const adjusted = ensureValidEndMinutes(startMinutes, minutes);
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
    await setValue('affirmations_notif_count', DEFAULT_REMINDER_COUNT);
    await setValue('affirmations_notif_start', DEFAULT_REMINDER_START);
    await setValue('affirmations_notif_end', DEFAULT_REMINDER_END);
    navigation.navigate('OnboardingAwarenessBreather');
  };

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
        <ReminderWindowScreenContent
          count={count}
          onIncrement={() => handleAdjustCount(1)}
          onDecrement={() => handleAdjustCount(-1)}
          startTimeLabel={minutesToTimeString(startMinutes)}
          endTimeLabel={minutesToTimeString(endMinutes)}
          onPressStart={() => showPicker('start')}
          onPressEnd={() => showPicker('end')}
          helperLine={helperLine}
        />
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
