export const CATEGORIES = [
  'Discipline',
  'Training',
  'Mindset',
  'Recovery',
  'Focus',
  'Consistency',
  'Strength',
  'Nutrition',
  'Confidence',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Tone = 'push' | 'grounding' | 'reality-check' | 'recovery';

export interface Phrase {
  id: string;
  category: Category;
  text: string;
  tone: Tone;
  intensity: 1 | 2 | 3;
  isNotifSafe: boolean;
}

export interface PhrasePack {
  version: number;
  updatedAtISO: string;
  phrases: Phrase[];
}
