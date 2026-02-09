import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
    clearOnboardingData,
    DEFAULT_ONBOARDING_DATA,
    getForceOnboarding,
    loadOnboardingData,
    OnboardingData,
    setForceOnboarding,
    setOnboardingValue,
} from '@/storage/onboarding';

export type OnboardingContextValue = {
  data: OnboardingData;
  loading: boolean;
  setValue: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => Promise<void>;
  refresh: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  forceOnboarding: boolean;
  updateForceOnboarding: (value: boolean) => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [loading, setLoading] = useState(true);
  const [forceOnboarding, setForceState] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stored, force] = await Promise.all([loadOnboardingData(), getForceOnboarding()]);
      setData(stored);
      setForceState(force);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setValue = useCallback<OnboardingContextValue['setValue']>(async (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    await setOnboardingValue(key, value);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await clearOnboardingData();
    setData({ ...DEFAULT_ONBOARDING_DATA });
  }, []);

  const updateForceOnboarding = useCallback(async (value: boolean) => {
    setForceState(value);
    await setForceOnboarding(value);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      data,
      loading,
      setValue,
      refresh: load,
      resetOnboarding,
      forceOnboarding,
      updateForceOnboarding,
    }),
    [data, forceOnboarding, load, loading, resetOnboarding, setValue, updateForceOnboarding]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
