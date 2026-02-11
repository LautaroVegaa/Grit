import { CATEGORIES, Category, PhrasePack } from '../types';

export const validatePhrasePack = (
  pack: PhrasePack,
): { ok: boolean; errors: string[] } => {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const counts = new Map<Category, number>();
  const validCategories = new Set<Category>(CATEGORIES);

  pack.phrases.forEach((phrase, index) => {
    const location = `phrase[${index}]`;

    if (!validCategories.has(phrase.category)) {
      errors.push(`${location}: invalid category "${phrase.category}"`);
    } else {
      counts.set(phrase.category, (counts.get(phrase.category) ?? 0) + 1);
    }

    if (!phrase.text.trim()) {
      errors.push(`${location}: text is empty`);
    }

    if (seenIds.has(phrase.id)) {
      errors.push(`${location}: duplicate id "${phrase.id}"`);
    } else {
      seenIds.add(phrase.id);
    }
  });

  CATEGORIES.forEach((category) => {
    if ((counts.get(category) ?? 0) < 10) {
      errors.push(`category "${category}" has fewer than 10 phrases`);
    }
  });

  return { ok: errors.length === 0, errors };
};
