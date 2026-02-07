import { DarkTheme, Theme } from '@react-navigation/native';

import { spacing } from '@/utils/spacing';

const palette = {
  background: '#050505',
  surface: '#111111',
  textPrimary: '#F5F7FA',
  textSecondary: '#9BA3AF',
  accent: '#3B82F6',
  muted: '#1F2230',
  border: '#1E2530',
};

export const appTheme = {
  colors: {
    background: palette.background,
    surface: palette.surface,
    textPrimary: palette.textPrimary,
    textSecondary: palette.textSecondary,
    accent: palette.accent,
    muted: palette.muted,
    border: palette.border,
  },
  spacing,
  typography: {
    heading: 28,
    body: 16,
    caption: 13,
  },
} as const;

export type AppTheme = typeof appTheme;

export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.accent,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.border,
    notification: palette.accent,
  },
};
