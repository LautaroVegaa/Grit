/**
 * DEV VISUAL CHECKLIST — Settings Notifications parity
 * - Title font, weight, and top spacing match onboarding shell header.
 * - Mascot hero placement aligns with onboarding “Set your reminder window”.
 * - Preview cards mirror onboarding shadow, opacity, and NOW label styling.
 * - Stepper buttons, count typography, and helper caption spacing match exactly.
 * - Start/End rows reuse identical pill, corner radius, and typography.
 * - Primary CTA uses the onboarding shell button style/spacing.
 * - No additional paddings, separators, or layout wrappers beyond onboarding shell.
 * - Toggle row (when shown) collapses cleanly and does not offset any other spacing.
 */
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { ReminderWindowScreenContent } from '@/components/ReminderWindowScreenContent';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import {
    cancelScheduledDrops,
    ensureNotificationPermissions,
    forceRescheduleDailyDrops,
    ReminderScheduleValidationError,
} from '@/grit/notifications/notificationsScheduler';
import { MainStackParamList } from '@/navigation/types';
import { getNotificationsEnabled, setNotificationsEnabled } from '@/storage/profileStorage';
import { loadReminderSettings, saveReminderSettings } from '@/storage/reminderWindow';
import { GRIT } from '@/theme/gritTheme';
import { emitProfileUpdated } from '@/utils/profileEvents';
import {
    clampReminderCount,
    DAY_MINUTES,
    DEFAULT_REMINDER_COUNT,
    DEFAULT_REMINDER_END,
    DEFAULT_REMINDER_START,
    ensureValidEndMinutes,
    minutesToDate,
    minutesToTimeString,
    timeStringToMinutes,
} from '@/utils/reminderWindow';
import { spacing } from '@/utils/spacing';

import { useProfileHeaderBackButton } from './useProfileHeaderBackButton';

type Props = NativeStackScreenProps<MainStackParamList, 'ProfileNotifications'>;
type PickerField = 'start' | 'end' | null;

const SCREEN_TITLE = 'Set your reminder window';
const clampMinutesValue = (value: number) => Math.max(0, Math.min(DAY_MINUTES - 1, Math.floor(value)));

export default function ProfileNotificationsScreen({ navigation }: Props) {
  useProfileHeaderBackButton(navigation);

  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [count, setCount] = useState(DEFAULT_REMINDER_COUNT);
  const [startMinutes, setStartMinutes] = useState(timeStringToMinutes(DEFAULT_REMINDER_START));
  const [endMinutes, setEndMinutes] = useState(timeStringToMinutes(DEFAULT_REMINDER_END));
  const [iosPickerField, setIosPickerField] = useState<PickerField>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [{ count: storedCount, start, end }, enabled] = await Promise.all([
          loadReminderSettings(),
          getNotificationsEnabled(),
        ]);
        if (!mounted) {
          return;
        }
        setCount(storedCount);
        setStartMinutes(timeStringToMinutes(start));
        setEndMinutes(timeStringToMinutes(end));
        setNotificationsEnabledState(enabled);
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to load reminder settings', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const helperLine = useMemo(
    () =>
      `You’ll receive ${count} notifications per day between ${minutesToTimeString(startMinutes)} and ${minutesToTimeString(endMinutes)}.`,
    [count, endMinutes, startMinutes],
  );

  const handleAdjustCount = useCallback((delta: number) => {
    setCount((prev) => clampReminderCount(prev + delta));
  }, []);

  const applyStartMinutes = useCallback((minutes: number) => {
    setStartMinutes((prev) => {
      const clamped = clampMinutesValue(minutes);
      if (clamped !== prev) {
        setEndMinutes((currentEnd) => ensureValidEndMinutes(clamped, currentEnd));
      }
      return clamped;
    });
  }, []);

  const applyEndMinutes = useCallback(
    (minutes: number) => {
      setEndMinutes(() => ensureValidEndMinutes(startMinutes, minutes));
    },
    [startMinutes],
  );

  const showPicker = useCallback(
    (field: 'start' | 'end') => {
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
    },
    [applyEndMinutes, applyStartMinutes, endMinutes, startMinutes],
  );

  const closeIosPicker = useCallback(() => {
    setIosPickerField(null);
  }, []);

  const handleIosChange = useCallback(
    (_: unknown, date?: Date) => {
      if (!date || !iosPickerField) {
        return;
      }
      const minutes = date.getHours() * 60 + date.getMinutes();
      if (iosPickerField === 'start') {
        applyStartMinutes(minutes);
      } else {
        applyEndMinutes(minutes);
      }
    },
    [applyEndMinutes, applyStartMinutes, iosPickerField],
  );

  const handleToggleNotifications = useCallback(
    async (value: boolean) => {
      if (loading || saving || toggleBusy) {
        return;
      }
      setToggleBusy(true);
      try {
        if (value) {
          const granted = await ensureNotificationPermissions();
          if (!granted) {
            Alert.alert('Enable notifications', 'Allow notifications in system settings to continue.');
            setNotificationsEnabledState(false);
            await setNotificationsEnabled(false);
            return;
          }
          await setNotificationsEnabled(true);
          setNotificationsEnabledState(true);
          await forceRescheduleDailyDrops();
        } else {
          await setNotificationsEnabled(false);
          setNotificationsEnabledState(false);
          await cancelScheduledDrops();
        }
        emitProfileUpdated();
      } catch (error) {
        if (error instanceof ReminderScheduleValidationError) {
          Alert.alert('Adjust reminder window', error.message);
        } else {
          Alert.alert('Something went wrong', 'Unable to update notifications right now.');
        }
        if (__DEV__) {
          console.warn('Failed to toggle notifications', error);
        }
      } finally {
        setToggleBusy(false);
      }
    },
    [loading, saving, toggleBusy],
  );

  const handleSave = useCallback(async () => {
    if (loading) {
      return;
    }
    setSaving(true);
    try {
      const startValue = minutesToTimeString(startMinutes);
      const endValue = minutesToTimeString(endMinutes);
      const payload = { count, start: startValue, end: endValue };
      if (notificationsEnabled) {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
          Alert.alert('Enable notifications', 'Allow notifications in system settings to continue.');
          setNotificationsEnabledState(false);
          await setNotificationsEnabled(false);
          await cancelScheduledDrops();
          return;
        }
        await forceRescheduleDailyDrops({ overrides: payload });
        await saveReminderSettings(payload);
      } else {
        await saveReminderSettings(payload);
        await cancelScheduledDrops();
      }
      emitProfileUpdated();
      navigation.goBack();
    } catch (error) {
      if (error instanceof ReminderScheduleValidationError) {
        Alert.alert('Adjust reminder window', error.message);
      } else {
        Alert.alert('Unable to save', 'Please try again later.');
      }
      if (__DEV__) {
        console.warn('Failed to save reminder settings', error);
      }
    } finally {
      setSaving(false);
    }
  }, [count, endMinutes, loading, navigation, notificationsEnabled, startMinutes]);

  const actionDisabled = loading || saving || toggleBusy;

  return (
    <>
      <OnboardingShell
        title={SCREEN_TITLE}
        primaryCta={{ label: 'Save', onPress: handleSave, disabled: actionDisabled }}
        mascotHero
        showSkip={false}
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
          disabled={actionDisabled}
          toggle={{ value: notificationsEnabled, onChange: handleToggleNotifications, label: 'Notifications' }}
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
