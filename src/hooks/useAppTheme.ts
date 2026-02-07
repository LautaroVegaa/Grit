import { useMemo } from 'react';

import { appTheme } from '@/theme';

export function useAppTheme() {
  return useMemo(() => appTheme, []);
}
