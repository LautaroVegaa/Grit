import { capture } from '@/analytics/posthog';
import { navigationRef } from '@/navigation/navigationRef';

type PhraseNotificationData = {
  phraseId?: string;
  category?: string;
  dateISO?: string;
  dayPart?: string;
};

let pendingPhraseId: string | null = null;

const extractPhraseId = (data: PhraseNotificationData | undefined): string | null => {
  if (!data) {
    return null;
  }
  return typeof data.phraseId === 'string' ? data.phraseId : null;
};

const tryNavigate = () => {
  if (!pendingPhraseId) {
    return;
  }
  if (!navigationRef.isReady()) {
    return;
  }

  const phraseId = pendingPhraseId;
  pendingPhraseId = null;

  navigationRef.navigate('Main', {
    screen: 'PhraseDetail',
    params: { phraseId },
  });
  capture('notification_phrase_opened', { phraseId });
};

export const handlePhraseNotificationNavigation = (
  data: PhraseNotificationData | undefined,
) => {
  const phraseId = extractPhraseId(data);
  if (!phraseId) {
    return;
  }
  pendingPhraseId = phraseId;
  tryNavigate();
};

export const onNavigationReady = () => {
  tryNavigate();
};
