import { PHRASE_PACK_V1 } from './phrasePack.v1';
import { validatePhrasePack } from './utils/validate';

export const runPhrasesSelfTest = (): { ok: boolean; errors: string[] } =>
  validatePhrasePack(PHRASE_PACK_V1);
