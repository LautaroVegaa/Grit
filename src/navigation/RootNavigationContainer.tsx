import { ThemeProvider } from '@react-navigation/native';
import { PropsWithChildren } from 'react';

import { navigationTheme } from '@/theme';

export function RootNavigationContainer({ children }: PropsWithChildren) {
  return <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>;
}
