export type Quote = {
  id: string;
  text: string;
  categories: string[];
};

export const QUOTES: Quote[] = [
  {
    id: 'discipline-1',
    text: 'Discipline is choosing what you want most over what you want now.',
    categories: ['discipline', 'mindset'],
  },
  {
    id: 'discipline-2',
    text: 'You will never always be motivated, so you must learn to be disciplined.',
    categories: ['discipline', 'consistency'],
  },
  {
    id: 'discipline-3',
    text: 'Sweat is your body proving your mind wrong.',
    categories: ['training', 'mindset'],
  },
  {
    id: 'discipline-4',
    text: 'Small reps done daily beat massive effort done rarely.',
    categories: ['consistency', 'training'],
  },
  {
    id: 'discipline-5',
    text: 'Your future self is built in the sets no one watches.',
    categories: ['strength', 'focus'],
  },
  {
    id: 'discipline-6',
    text: 'Comfort is a slow death. Train anyway.',
    categories: ['training', 'confidence'],
  },
  {
    id: 'discipline-7',
    text: 'Excuses burn zero calories.',
    categories: ['nutrition', 'discipline'],
  },
];
