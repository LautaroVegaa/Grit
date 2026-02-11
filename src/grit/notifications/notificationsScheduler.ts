import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { capture } from '@/analytics/posthog';

import { getNotificationsEnabled } from '../../storage/profileStorage';
import { loadReminderWindow } from '../../storage/reminderWindow';
import { clampReminderCount, timeStringToMinutes } from '../../utils/reminderWindow';
import {
  DayPart,
  SelectionResult,
  commitDailyPhrases,
  getDailyPhrases,
} from '../phrases';
import { loadLastCommittedDropsKey, saveLastCommittedDropsKey } from '../storage/dropsStorage';
import {
  loadRemindersPerDay,
  loadTrainingTimePreference,
} from '../storage/notificationsStorage';

import {
  ScheduledDropsState,
  TimezoneSignature,
  clearScheduledDropsState,
  getCurrentTimezoneSignature,
  loadLastScheduledDropsState,
  loadScheduledNotificationIds,
  saveLastScheduledDropsState,
  saveScheduledNotificationIds,
} from './notificationsStorage';

const DEFAULT_REMINDERS = 6;
const MIN_SPACING_MINUTES = 15;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MIN_TRIGGER_LEAD_MS = 5 * 1000;
const PAST_TIME_BUMP_MS = 60 * 1000;
const MAX_LOGGED_NOTIFICATIONS = 10;

type ReminderScheduleOverrides = {
  count?: number;
  start?: string;
  end?: string;
};

type ReminderWindowPlan = {
  startLabel: string;
  endLabel: string;
  startMinutes: number;
  endMinutes: number;
  windowMinutes: number;
  crossesMidnight: boolean;
};

type ReminderScheduleDebug = {
  reminders: number;
  start: string;
  end: string;
  windowMinutes: number;
  spacingMinutes: number;
  timesISO: string[];
  timeZone?: string | null;
  offsetMinutes?: number | null;
};

type NotificationRequest = Notifications.NotificationRequest;

type GritNotificationData = {
  kind?: string;
  source?: string;
  scheduleKey?: string;
  phraseId?: string;
  index?: number;
  total?: number;
  [key: string]: unknown;
};

type NotificationSummary = {
  id: string;
  trigger: string | null;
  body?: string | null;
  phraseId?: string;
  scheduleKey?: string;
  index?: number;
};

const resolveNotificationData = (request: NotificationRequest): GritNotificationData => {
  const raw = request.content?.data;
  if (raw && typeof raw === 'object') {
    return raw as GritNotificationData;
  }
  return {};
};

const isGritNotificationRequest = (request: NotificationRequest): boolean => {
  const data = resolveNotificationData(request);
  if (data.kind === 'daily_drop' || data.source === 'grit') {
    return true;
  }
  const title = typeof request.content?.title === 'string' ? request.content.title.trim().toLowerCase() : '';
  return title === 'grit';
};

const resolveTriggerDate = (trigger: Notifications.NotificationTrigger | null): Date | null => {
  if (!trigger) {
    return null;
  }
  if ('date' in trigger && trigger.date) {
    if (trigger.date instanceof Date) {
      return trigger.date;
    }
    return new Date(trigger.date);
  }
  if ('seconds' in trigger && typeof trigger.seconds === 'number') {
    return new Date(Date.now() + trigger.seconds * 1000);
  }
  return null;
};

const summarizeNotifications = (requests: NotificationRequest[], limit?: number): NotificationSummary[] => {
  const slice = typeof limit === 'number' ? requests.slice(0, limit) : requests;
  return slice.map((request) => {
    const data = resolveNotificationData(request);
    const trigger = resolveTriggerDate(request.trigger);
    return {
      id: request.identifier,
      trigger: trigger?.toISOString() ?? null,
      body: request.content?.body,
      phraseId: data.phraseId,
      scheduleKey: data.scheduleKey,
      index: data.index,
    };
  });
};

const devLogScheduledNotifications = (label: string, requests: NotificationRequest[]): void => {
  if (!__DEV__) {
    return;
  }
  console.log(`[GRIT] Scheduled notifications dump (${label})`, {
    count: requests.length,
    preview: summarizeNotifications(requests, MAX_LOGGED_NOTIFICATIONS),
  });
};

const fetchGritNotificationRequests = async (): Promise<NotificationRequest[]> => {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  return pending.filter(isGritNotificationRequest);
};

const assertGritNotificationCount = async (
  label: string,
  expected: number,
  options?: { scheduleKey?: string; devOnlyThrow?: boolean },
): Promise<void> => {
  const pending = await fetchGritNotificationRequests();
  const relevant = options?.scheduleKey
    ? pending.filter((request) => resolveNotificationData(request).scheduleKey === options.scheduleKey)
    : pending;
  if (relevant.length !== expected) {
    const summaries = summarizeNotifications(relevant);
    devLogScheduledNotifications(`${label}-mismatch`, relevant);
    const message = `[GRIT] Pending GRIT notifications mismatch (${label}) expected=${expected} actual=${relevant.length}`;
    console.warn(message, { notifications: summaries });
    if (__DEV__ && options?.devOnlyThrow) {
      throw new Error(message);
    }
  }
};

const cancelNotificationsByStoredIds = async (): Promise<void> => {
  const ids = await loadScheduledNotificationIds();
  if (!ids.length) {
    return;
  }
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
};

export class ReminderScheduleValidationError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'ReminderScheduleValidationError';
  }
}

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync('grit-drops', {
    name: 'GRIT Drops',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: undefined,
    enableVibrate: false,
  });
};

const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

const buildScheduleKey = (
  dateISO: string,
  dayPart: DayPart,
  itemsPerDay: number,
  trainingTime: DayPart,
  startLabel: string,
  endLabel: string,
): string => `${dateISO}|${dayPart}|${itemsPerDay}|${trainingTime}|${startLabel}|${endLabel}`;

const buildCommitKey = (result: SelectionResult, itemsPerDay: number): string =>
  `${result.dateISO}|${result.dayPart}|${itemsPerDay}`;

const clampMinutes = (value: number) => Math.max(0, Math.min(24 * 60 - 1, Math.floor(value)));

const devLogSchedulePreview = (
  signature: TimezoneSignature,
  start: Date,
  end: Date,
  times: Date[],
) => {
  if (!__DEV__) {
    return;
  }
  console.log('[GRIT] Reminder schedule preview', {
    timeZone: signature.timeZone ?? 'unknown',
    offsetMinutes: signature.offsetMinutes,
    windowStart: start.toString(),
    windowEnd: end.toString(),
    preview: times.slice(0, 3).map((time) => time.toString()),
  });
};

const parseReminderWindow = (startLabel: string, endLabel: string): ReminderWindowPlan => {
  const startMinutes = clampMinutes(timeStringToMinutes(startLabel));
  const rawEndMinutes = clampMinutes(timeStringToMinutes(endLabel));
  const crossesMidnight = rawEndMinutes <= startMinutes;
  const endMinutesAbsolute = crossesMidnight ? rawEndMinutes + 24 * 60 : rawEndMinutes;
  const windowMinutes = endMinutesAbsolute - startMinutes;
  if (windowMinutes <= 0) {
    throw new ReminderScheduleValidationError('Choose different start and end times so we have a real window.');
  }
  return {
    startLabel,
    endLabel,
    startMinutes,
    endMinutes: rawEndMinutes,
    windowMinutes,
    crossesMidnight,
  };
};

const validateWindowCapacity = (reminders: number, windowMinutes: number): number => {
  if (reminders <= 0) {
    throw new ReminderScheduleValidationError('Select at least one reminder per day.');
  }
  const segments = Math.max(reminders - 1, 1);
  const needsSpacing = reminders > 1;
  const minimumWindow = needsSpacing ? segments * MIN_SPACING_MINUTES : 1;
  if (needsSpacing && windowMinutes < minimumWindow) {
    throw new ReminderScheduleValidationError(
      'Extend your window or reduce reminders so we can keep at least 15 minutes between drops.',
      { windowMinutes, minimumWindow },
    );
  }
  if (!needsSpacing && windowMinutes < 1) {
    throw new ReminderScheduleValidationError('Increase your window so we can deliver your reminder.');
  }
  const spacingMinutes = windowMinutes / segments;
  if (spacingMinutes < 1) {
    throw new ReminderScheduleValidationError('Increase your window so reminders are at least a minute apart.');
  }
  return spacingMinutes;
};

const resolveWindowAnchors = (
  plan: ReminderWindowPlan,
  reference: Date,
): { start: Date; end: Date } => {
  const dayStart = new Date(reference);
  dayStart.setHours(0, 0, 0, 0);
  let start = new Date(dayStart.getTime() + plan.startMinutes * MINUTE_MS);

  if (plan.crossesMidnight && reference.getHours() * 60 + reference.getMinutes() < plan.endMinutes) {
    start = new Date(start.getTime() - DAY_MS);
  }

  let end = new Date(start.getTime() + plan.windowMinutes * MINUTE_MS);

  if (reference.getTime() > end.getTime() - MIN_TRIGGER_LEAD_MS) {
    start = new Date(start.getTime() + DAY_MS);
    end = new Date(end.getTime() + DAY_MS);
  }

  return { start, end };
};

const adjustCandidateTime = (candidateMs: number, previous: Date | undefined, nowMs: number): number => {
  let next = candidateMs;
  const minSpacingTarget = previous ? previous.getTime() + MIN_SPACING_MINUTES * MINUTE_MS : undefined;
  if (minSpacingTarget && next < minSpacingTarget) {
    next = minSpacingTarget;
  }

  const minFuture = nowMs + MIN_TRIGGER_LEAD_MS;
  if (next <= minFuture) {
    const diff = minFuture - next;
    const increments = Math.ceil(diff / PAST_TIME_BUMP_MS);
    next += increments * PAST_TIME_BUMP_MS;
  }

  return next;
};

const buildReminderTimes = (
  start: Date,
  end: Date,
  count: number,
  nowMs: number,
): { times: Date[]; spacingMinutes: number } => {
  if (count <= 0) {
    return { times: [], spacingMinutes: 0 };
  }
  const startMs = start.getTime();
  const endMs = end.getTime();
  const windowMs = Math.max(endMs - startMs, MINUTE_MS);
  const segments = Math.max(count - 1, 1);
  const baseSpacing = windowMs / segments;
  const spacingMs = Math.max(baseSpacing, MIN_SPACING_MINUTES * MINUTE_MS);

  const times: Date[] = [];
  for (let index = 0; index < count; index += 1) {
    let candidate = startMs + spacingMs * index;
    if (candidate > endMs) {
      candidate = endMs;
    }
    const previous = times.length ? times[times.length - 1] : undefined;
    candidate = adjustCandidateTime(candidate, previous, nowMs);
    const date = new Date(candidate);
    date.setSeconds(0, 0);
    times.push(date);
  }

  return { times, spacingMinutes: spacingMs / MINUTE_MS };
};

const didTimezoneChange = (
  lastState: ScheduledDropsState | null,
  current: TimezoneSignature,
): boolean => {
  if (!lastState) {
    return false;
  }
  const storedZone = typeof lastState.timeZone === 'string' && lastState.timeZone.length ? lastState.timeZone : null;
  const storedOffset = typeof lastState.offsetMinutes === 'number' ? lastState.offsetMinutes : null;

  if (storedZone && current.timeZone && storedZone !== current.timeZone) {
    return true;
  }
  if (storedOffset !== null && storedOffset !== current.offsetMinutes) {
    return true;
  }
  if (storedZone && !current.timeZone) {
    return true;
  }
  return false;
};

const ensureHistoryCommitted = async (
  result: SelectionResult,
  itemsPerDay: number,
): Promise<void> => {
  const commitKey = buildCommitKey(result, itemsPerDay);
  const lastKey = await loadLastCommittedDropsKey();
  if (lastKey === commitKey) {
    return;
  }
  await commitDailyPhrases(result);
  await saveLastCommittedDropsKey(commitKey);
};

const logScheduleFailure = (error: unknown, context: ReminderScheduleDebug) => {
  console.warn('Failed to schedule notifications', {
    message: error instanceof Error ? error.message : error,
    ...context,
  });
  capture('drops_notifications_schedule_failed', {
    reminders: context.reminders,
    windowMinutes: context.windowMinutes,
    spacingMinutes: context.spacingMinutes,
    error: error instanceof Error ? error.message : String(error),
  });
};

const scheduleDropsInternal = async (
  force: boolean,
  overrides?: ReminderScheduleOverrides,
): Promise<boolean> => {
  const notificationsEnabled = await getNotificationsEnabled();
  if (!notificationsEnabled) {
    await cancelScheduledDrops({ reason: 'notifications-disabled' });
    return false;
  }

  const permissionsGranted = await ensureNotificationPermissions();
  if (!permissionsGranted) {
    return false;
  }

  const [storedReminders, storedTrainingTime, storedWindow, lastScheduled] = await Promise.all([
    loadRemindersPerDay(),
    loadTrainingTimePreference(),
    loadReminderWindow(),
    loadLastScheduledDropsState(),
  ]);

  const dayPart: DayPart = storedTrainingTime ?? 'morning';
  const reminders = clampReminderCount(overrides?.count ?? storedReminders ?? DEFAULT_REMINDERS);
  const startLabel = overrides?.start ?? storedWindow.start;
  const endLabel = overrides?.end ?? storedWindow.end;
  const windowPlan = parseReminderWindow(startLabel, endLabel);
  validateWindowCapacity(reminders, windowPlan.windowMinutes);

  const now = new Date();
  const { start, end } = resolveWindowAnchors(windowPlan, now);
  const dateISO = formatDateKey(start);
  const scheduleKey = buildScheduleKey(dateISO, dayPart, reminders, dayPart, startLabel, endLabel);
  const timezoneSignature = getCurrentTimezoneSignature();
  const timezoneChanged = didTimezoneChange(lastScheduled, timezoneSignature);

  if (!force && !timezoneChanged && lastScheduled?.key === scheduleKey) {
    return false;
  }

  await cancelScheduledDrops({ reason: 'schedule-drops' });
  await ensureAndroidChannel();

  const selection = await getDailyPhrases(dayPart, reminders, dateISO);
  await ensureHistoryCommitted(selection, reminders);

  const { times, spacingMinutes } = buildReminderTimes(start, end, selection.items.length, now.getTime());
  if (!times.length) {
    throw new ReminderScheduleValidationError('Unable to compute reminder times. Try expanding your window.');
  }
  devLogSchedulePreview(timezoneSignature, start, end, times);

  const scheduledIds: string[] = [];
  const debugContext: ReminderScheduleDebug = {
    reminders: selection.items.length,
    start: startLabel,
    end: endLabel,
    windowMinutes: windowPlan.windowMinutes,
    spacingMinutes,
    timesISO: times.map((time) => time.toISOString()),
    timeZone: timezoneSignature.timeZone,
    offsetMinutes: timezoneSignature.offsetMinutes,
  };

  try {
    for (let index = 0; index < selection.items.length; index += 1) {
      const phrase = selection.items[index].phrase;
      const triggerDate = times[index] ?? times[times.length - 1];
      const trigger: Notifications.DateTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === 'android' ? { channelId: 'grit-drops' } : {}),
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'GRIT',
          body: phrase.text,
          data: {
            kind: 'daily_drop',
            source: 'grit',
            scheduleKey,
            index,
            total: selection.items.length,
            phraseId: phrase.id,
            category: phrase.category,
            dateISO: selection.dateISO,
            dayPart: selection.dayPart,
          },
        },
        trigger,
      });
      scheduledIds.push(id);
    }
  } catch (error) {
    logScheduleFailure(error, debugContext);
    throw error;
  }

  await saveScheduledNotificationIds(scheduledIds);
  await saveLastScheduledDropsState({
    key: scheduleKey,
    timestamp: Date.now(),
    timeZone: timezoneSignature.timeZone,
    offsetMinutes: timezoneSignature.offsetMinutes,
  });

  capture('drops_notifications_scheduled', {
    dayPart,
    items: selection.items.length,
    reminders,
    start: startLabel,
    end: endLabel,
  });

  await assertGritNotificationCount('post-schedule', selection.items.length, {
    scheduleKey,
    devOnlyThrow: true,
  });

  return true;
};

export const ensureNotificationPermissions = async (): Promise<boolean> => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return true;
  }
  if (!settings.canAskAgain) {
    return false;
  }
  const status = await Notifications.requestPermissionsAsync();
  return Boolean(status.granted);
};

export const scheduleDailyDropsIfNeeded = async (): Promise<boolean> => {
  try {
    return await scheduleDropsInternal(false);
  } catch (error) {
    if (error instanceof ReminderScheduleValidationError) {
      console.warn('Skipping schedule due to invalid reminder window', error.message);
      return false;
    }
    throw error;
  }
};

export const forceRescheduleDailyDrops = async (
  options?: { overrides?: ReminderScheduleOverrides },
): Promise<boolean> => scheduleDropsInternal(true, options?.overrides);

export const debugDumpScheduledNotifications = async (label = 'manual'): Promise<void> => {
  if (!__DEV__) {
    return;
  }
  const pending = await fetchGritNotificationRequests();
  devLogScheduledNotifications(label, pending);
};

export const cancelScheduledDrops = async (options?: { reason?: string }): Promise<void> => {
  const reason = options?.reason ?? 'unspecified';
  await cancelNotificationsByStoredIds();
  const pending = await fetchGritNotificationRequests();
  if (pending.length) {
    devLogScheduledNotifications(`cancel-${reason}`, pending);
    await Promise.all(pending.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
  }
  await assertGritNotificationCount(`post-cancel-${reason}`, 0);
  await clearScheduledDropsState();
};

export const rescheduleDropsIfTimezoneChanged = async (): Promise<boolean> => {
  const lastState = await loadLastScheduledDropsState();
  const currentSignature = getCurrentTimezoneSignature();
  if (!didTimezoneChange(lastState, currentSignature)) {
    return false;
  }
  console.log('Timezone change detected, rescheduling reminders');
  try {
    await scheduleDropsInternal(true);
    return true;
  } catch (error) {
    if (error instanceof ReminderScheduleValidationError) {
      console.warn('Unable to reschedule after timezone change', error.message);
      return false;
    }
    throw error;
  }
};

const runReminderSchedulerSelfTest = () => {
  if (!__DEV__) {
    return;
  }
  const reference = new Date('2024-01-15T12:00:00Z');
  const scenarios: {
    label: string;
    count: number;
    start: string;
    end: string;
    expectError?: boolean;
  }[] = [
    { label: 'single-short-window', count: 1, start: '10:00', end: '10:05' },
    { label: 'max-tight-window', count: 20, start: '08:00', end: '09:00', expectError: true },
    { label: 'cross-midnight', count: 4, start: '23:50', end: '00:30' },
    { label: 'identical-times', count: 3, start: '12:00', end: '12:00', expectError: true },
  ];

  scenarios.forEach((scenario) => {
    try {
      const plan = parseReminderWindow(scenario.start, scenario.end);
      validateWindowCapacity(scenario.count, plan.windowMinutes);
      const anchors = resolveWindowAnchors(plan, reference);
      const { times } = buildReminderTimes(anchors.start, anchors.end, scenario.count, reference.getTime());
      if (scenario.expectError) {
        console.warn('Reminder scheduler self-test expected error but succeeded', scenario.label);
      } else if (times.length !== scenario.count) {
        console.warn('Reminder scheduler self-test invalid count', scenario.label, times.length);
      }
    } catch (error) {
      if (!scenario.expectError) {
        console.warn('Reminder scheduler self-test failed', scenario.label, error);
      }
    }
  });

  const timezoneState: ScheduledDropsState = {
    key: 'tz-test',
    timestamp: Date.now(),
    timeZone: 'UTC',
    offsetMinutes: 0,
  };
  const changedSignature: TimezoneSignature = { timeZone: 'America/Argentina/Buenos_Aires', offsetMinutes: 180 };
  const sameSignature: TimezoneSignature = { timeZone: 'UTC', offsetMinutes: 0 };
  if (!didTimezoneChange(timezoneState, changedSignature)) {
    console.warn('Reminder scheduler self-test failed to detect timezone change');
  }
  if (didTimezoneChange(timezoneState, sameSignature)) {
    console.warn('Reminder scheduler self-test falsely detected timezone change');
  }
};

if (__DEV__) {
  runReminderSchedulerSelfTest();
}
