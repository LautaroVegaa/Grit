const pad = (value: number): string => value.toString().padStart(2, '0');

export const getLocalDateISO = (date: Date = new Date()): string => {
  const copy = new Date(date);
  copy.setHours(copy.getHours(), copy.getMinutes(), 0, 0);
  return `${copy.getFullYear()}-${pad(copy.getMonth() + 1)}-${pad(copy.getDate())}`;
};

export const getDateFromLocalISO = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  const date = new Date();
  date.setFullYear(year, (month ?? 1) - 1, day ?? 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const shiftLocalDate = (date: Date, deltaDays: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + deltaDays);
  return copy;
};

export const getYesterdayISO = (todayISO: string): string => {
  const date = getDateFromLocalISO(todayISO);
  date.setDate(date.getDate() - 1);
  return getLocalDateISO(date);
};

export const getGreetingPeriod = (date: Date = new Date()): 'morning' | 'afternoon' | 'night' => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 18) {
    return 'afternoon';
  }
  return 'night';
};

export const formatGreeting = (name?: string | null, date: Date = new Date()): string => {
  const period = getGreetingPeriod(date);
  const salutation =
    period === 'morning' ? 'Good morning' : period === 'afternoon' ? 'Good afternoon' : 'Good night';
  return name ? `${salutation}, ${name}` : salutation;
};
