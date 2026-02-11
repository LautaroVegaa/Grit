const DAY_MINUTES = 24 * 60;

export const MIN_REMINDER_COUNT = 1;
export const MAX_REMINDER_COUNT = 20;
export const DEFAULT_REMINDER_COUNT = 8;
export const DEFAULT_REMINDER_START = '09:00';
export const DEFAULT_REMINDER_END = '22:00';

const clampMinutes = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(DAY_MINUTES - 1, Math.floor(value)));
};

export const clampReminderCount = (value: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_REMINDER_COUNT;
  }
  if (value <= MIN_REMINDER_COUNT) {
    return MIN_REMINDER_COUNT;
  }
  if (value >= MAX_REMINDER_COUNT) {
    return MAX_REMINDER_COUNT;
  }
  return Math.floor(value);
};

export const timeStringToMinutes = (value?: string | null, fallback = DEFAULT_REMINDER_START): number => {
  const source = value ?? fallback;
  const [hours, minutes] = source.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    const fallbackSource = fallback ?? DEFAULT_REMINDER_START;
    const [fallbackHours, fallbackMinutes] = fallbackSource.split(':').map((part) => Number(part));
    if (Number.isNaN(fallbackHours) || Number.isNaN(fallbackMinutes)) {
      return 0;
    }
    return clampMinutes(fallbackHours * 60 + fallbackMinutes);
  }
  return clampMinutes(hours * 60 + minutes);
};

export const minutesToTimeString = (minutes: number): string => {
  const clamped = clampMinutes(minutes);
  const h = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const m = (clamped % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const minutesToDate = (minutes: number): Date => {
  const clamped = clampMinutes(minutes);
  const date = new Date();
  date.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
  return date;
};

export const ensureValidEndMinutes = (startMinutes: number, proposedEndMinutes: number): number => {
  const clampedEnd = clampMinutes(proposedEndMinutes);
  const clampedStart = clampMinutes(startMinutes);
  if (clampedEnd <= clampedStart) {
    return Math.min(clampedStart + 60, DAY_MINUTES - 1);
  }
  return clampedEnd;
};

export { DAY_MINUTES };
