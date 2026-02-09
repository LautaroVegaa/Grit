import { StyleSheet } from 'react-native';

export const GRIT = {
  colors: {
    bg0: '#0B0D10',
    bg1: '#10141A',
    bg2: '#141A22',
    border0: 'rgba(255,255,255,0.06)',
    border1: 'rgba(255,255,255,0.10)',
    text0: 'rgba(255,255,255,0.92)',
    text1: 'rgba(255,255,255,0.70)',
    text2: 'rgba(255,255,255,0.45)',
    blue: '#2F6BFF',
    blue2: '#1F4FE0',
    white: '#FFFFFF',
    danger: '#FF4D4D',
  },
  radii: {
    r12: 12,
    r16: 16,
    r20: 20,
    r24: 24,
  },
  spacing: {
    s8: 8,
    s12: 12,
    s16: 16,
    s20: 20,
    s24: 24,
    s32: 32,
  },
  typeSizes: {
    h1: 34,
    h2: 28,
    body: 16,
    small: 13,
  },
} as const;

export const typography = StyleSheet.create({
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: GRIT.colors.text0,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: GRIT.colors.text1,
    lineHeight: 22,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: GRIT.colors.text0,
  },
  optionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: GRIT.colors.text1,
  },
  button: {
    fontSize: 17,
    fontWeight: '700',
    color: GRIT.colors.white,
  },
});
