import { OnboardingData } from '@/storage/onboarding';

const goalCategoryMap: Record<string, string[]> = {
  confidence: ['confidence'],
  stress: ['recovery', 'mindset'],
  focus: ['focus'],
  discipline: ['discipline'],
  'self-control': ['consistency', 'discipline'],
};

const blockCategoryMap: Record<string, string[]> = {
  'self-doubt': ['confidence'],
  comparison: ['mindset'],
  burnout: ['recovery'],
  'fear-of-failure': ['confidence', 'focus'],
  imposter: ['confidence', 'mindset'],
};

const avoidanceCategoryMap: Record<string, string[]> = {
  feedback: ['confidence'],
  rest: ['recovery'],
  relationships: ['focus'],
  identity: ['mindset'],
  clarity: ['focus'],
};

const outcomeCategoryMap: Record<string, string[]> = {
  steady: ['consistency'],
  breakthrough: ['strength'],
  control: ['discipline'],
  momentum: ['training', 'focus'],
  recenter: ['mindset'],
};

export function deriveActiveCategories(data: OnboardingData) {
  const set = new Set<string>();

  const push = (keys: string[] | undefined, map: Record<string, string[]>) => {
    keys?.forEach((key) => {
      map[key]?.forEach((category) => set.add(category));
    });
  };

  push(data.user_goals, goalCategoryMap);
  push(data.user_blocks, blockCategoryMap);
  push(data.user_avoidance, avoidanceCategoryMap);
  if (data.primary_outcome) {
    push([data.primary_outcome], outcomeCategoryMap);
  }

  if (data.custom_focus_text.trim().length > 0) {
    set.add('focus');
  }

  return Array.from(set);
}
