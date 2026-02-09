import { ReactNode, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

import { OnboardingMascot } from './OnboardingMascot';

export type OnboardingLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  showMascot?: boolean;
  footer?: ReactNode;
  progress?: number;
};

export function OnboardingLayout({
  title,
  subtitle,
  children,
  primaryLabel,
  primaryDisabled,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  showMascot = true,
  footer,
  progress,
}: OnboardingLayoutProps) {
  const clampedProgress = useMemo(() => {
    if (typeof progress !== 'number') {
      return undefined;
    }
    return Math.min(Math.max(progress, 0), 1);
  }, [progress]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {typeof clampedProgress === 'number' ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
          </View>
        ) : null}
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showMascot ? <OnboardingMascot /> : null}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.actions}>
          {primaryLabel ? (
            <TouchableOpacity
              style={[styles.primaryButton, primaryDisabled && styles.buttonDisabled]}
              activeOpacity={0.85}
              disabled={primaryDisabled}
              onPress={onPrimaryPress}
            >
              <Text style={styles.primaryLabel}>{primaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {secondaryLabel ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={onSecondaryPress}
            >
              <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {footer}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeTop: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(6),
    backgroundColor: colors.bg,
  },
  safeBottom: {
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: spacing(6),
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(14),
    gap: spacing(4),
  },
  header: {
    gap: spacing(2),
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 26,
  },
  body: {
    gap: spacing(3),
  },
  actions: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(2),
    paddingBottom: spacing(4),
    gap: spacing(2),
    backgroundColor: colors.bg,
  },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  primaryLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  secondaryButton: {
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: '#060606',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: '#1B1B1B',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.blue,
  },
});
