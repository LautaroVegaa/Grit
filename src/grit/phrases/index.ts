import { PHRASE_PACK_V1 } from './phrasePack.v1';
import { CATEGORIES, Category, Phrase, PhrasePack } from './types';
import { validatePhrasePack } from './utils/validate';

export { PHRASE_PACK_V1 };
export type { Category, Phrase, PhrasePack };
export { CATEGORIES };
export { selectPhrases } from './engine';
export type {
  DayPart,
  SelectionContext,
  SelectedPhrase,
  SelectionResult,
} from './engine';
export { getDailyPhrases, commitDailyPhrases } from './runtime';
export { runPhrasesSelfTest } from './selfTest';
export { getFeedBatch } from './feedRuntime';
export type { FeedRuntimeRequest, FeedRuntimeResponse } from './feedRuntime';
export type { FeedRequest, FeedResponse } from './feedEngine';
export const getPhraseById = (id: string): Phrase | undefined =>
  PHRASE_PACK_V1.phrases.find((phrase) => phrase.id === id);

export const getPhrasesByCategory = (category: Category): Phrase[] =>
  PHRASE_PACK_V1.phrases.filter((phrase) => phrase.category === category);

export const getAllCategories = (): Category[] => [...CATEGORIES];

export { validatePhrasePack };
