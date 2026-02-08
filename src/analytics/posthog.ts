import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STORAGE_KEY = 'grit_distinct_id';
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST?.replace(/\/$/, '');
const CAPTURE_URL = POSTHOG_HOST ? `${POSTHOG_HOST}/capture/` : null;

let hasWarnedMissingConfig = false;
let initialized = false;
let cachedAnonymousId: string | null = null;
let identifiedDistinctId: string | null = null;

const legacyManifest = (Constants as Record<string, any>).manifest ?? {};
const appVersion = Constants.expoConfig?.version ?? legacyManifest.version ?? 'unknown';
const buildNumber = (() => {
  if (Platform.OS === 'ios') {
    return Constants.expoConfig?.ios?.buildNumber ?? legacyManifest.ios?.buildNumber;
  }
  const versionCode =
    Constants.expoConfig?.android?.versionCode ?? legacyManifest.android?.versionCode;
  return versionCode ? String(versionCode) : undefined;
})();

function ensureConfigured() {
  if (!POSTHOG_KEY || !POSTHOG_HOST || !CAPTURE_URL) {
    if (!hasWarnedMissingConfig) {
      console.warn(
        'PostHog analytics disabled: set EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_POSTHOG_HOST.'
      );
      hasWarnedMissingConfig = true;
    }
    return false;
  }
  return true;
}

async function ensureAnonymousId() {
  if (cachedAnonymousId) {
    return cachedAnonymousId;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedAnonymousId = stored;
      return stored;
    }

    const generated = `grit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(STORAGE_KEY, generated);
    cachedAnonymousId = generated;
    return generated;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to access AsyncStorage for analytics id', error);
    }
    cachedAnonymousId = `grit_${Math.random().toString(36).slice(2, 10)}`;
    return cachedAnonymousId;
  }
}

async function getDistinctId() {
  if (identifiedDistinctId) {
    return identifiedDistinctId;
  }
  return ensureAnonymousId();
}

function getLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
  } catch {
    return 'en';
  }
}

function baseProperties(extra?: Record<string, unknown>) {
  return {
    platform: Platform.OS,
    appVersion,
    buildNumber: buildNumber ?? 'unknown',
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    locale: getLocale(),
    ...(extra ?? {}),
  };
}

type PosthogPayload = {
  event: string;
  distinct_id: string;
  properties?: Record<string, unknown>;
};

async function sendToPosthog(payload: PosthogPayload) {
  if (!ensureConfigured()) {
    return;
  }

  try {
    await fetch(CAPTURE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        ...payload,
      }),
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to send PostHog event', error);
    }
  }
}

export function initAnalytics() {
  if (initialized) {
    return;
  }
  initialized = true;

  if (!ensureConfigured()) {
    return;
  }

  void ensureAnonymousId();
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (!event || !ensureConfigured()) {
    return;
  }

  void (async () => {
    const distinctId = await getDistinctId();
    await sendToPosthog({
      event,
      distinct_id: distinctId,
      properties: baseProperties(props),
    });
  })();
}

export function screen(name: string, props?: Record<string, unknown>) {
  if (!name) {
    return;
  }
  capture('screen_view', {
    screenName: name,
    ...(props ?? {}),
  });
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (!userId || !ensureConfigured()) {
    return;
  }

  void (async () => {
    const anonymousId = await ensureAnonymousId();
    identifiedDistinctId = userId;
    await sendToPosthog({
      event: '$identify',
      distinct_id: userId,
      properties: baseProperties({
        $anon_distinct_id: anonymousId,
        ...(props ?? {}),
      }),
    });
  })();
}
