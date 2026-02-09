import { ReactNode, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Progress as OnboardingProgress } from '@/constants/onboardingProgress';
import { ONBOARDING_SECTION_LABELS } from '@/constants/onboardingProgress';
import { GRIT, typography } from '@/theme/gritTheme';

import { OnboardingMascot } from './OnboardingMascot';

export type OnboardingShellProps = {
  progress?: OnboardingProgress;
  title: string;
  children: ReactNode;
  primaryCta?: { label: string; onPress: () => void; disabled?: boolean };
  secondaryCta?: { label: string; onPress: () => void };
  showSkip?: boolean;
  onSkip?: () => void;
  scroll?: boolean;
  mascotSize?: number;
  mascotHero?: boolean;
  hideFooter?: boolean;
};

const DEFAULT_SCROLL = true;
const HEADER_MASCOT_TO_TITLE_PULL = 16;

export function OnboardingShell({
  progress,
  title,
  children,
  primaryCta,
  secondaryCta,
  showSkip,
  onSkip,
  scroll = DEFAULT_SCROLL,
  mascotSize = 72,
  mascotHero = false,
  hideFooter = false,
}: OnboardingShellProps) {
  const ratio = progress && progress.total > 0 ? Math.min(Math.max(progress.current / progress.total, 0), 1) : null;

  const sectionalFill = useMemo(() => {
    if (!progress?.section) {
      return null;
    }
    return ONBOARDING_SECTION_LABELS.map((_, index) => {
      if (index < progress.section.index) {
        return 1;
      }
      if (index > progress.section.index) {
        return 0;
      }
      if (progress.section.total === 0) {
        return 0;
      }
      return Math.min(Math.max(progress.section.current / progress.section.total, 0), 1);
    });
  }, [progress?.section?.index, progress?.section?.current, progress?.section?.total]);

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <OnboardingMascot
        size={mascotSize}
        hero={mascotHero}
        style={mascotHero ? styles.mascotHero : styles.mascot}
      />
      <View style={[styles.header, styles.headerTightSpacing]}>
        <Text style={typography.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, styles.nonScrollContent]}>
      <OnboardingMascot
        size={mascotSize}
        hero={mascotHero}
        style={mascotHero ? styles.mascotHero : styles.mascot}
      />
      <View style={[styles.header, styles.headerTightSpacing]}>
        <Text style={typography.title}>{title}</Text>
      </View>
      <View style={[styles.body, styles.nonScrollBody]}>{children}</View>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafe} edges={['top']}>
        <View style={styles.progressRow}>
          <View style={styles.progressSide} />
          <View style={styles.progressCenter}>
            {sectionalFill ? (
              <View style={styles.sectionalRow}>
                {sectionalFill.map((value, index) => (
                  <View key={ONBOARDING_SECTION_LABELS[index]} style={styles.sectionBlock}>
                    <View style={styles.sectionTrack}>
                      <View style={[styles.sectionFill, { width: `${value * 100}%` }]} />
                    </View>
                    <Text
                      style={[
                        styles.sectionLabel,
                        index === progress?.section.index ? styles.sectionLabelActive : null,
                      ]}
                      numberOfLines={1}
                    >
                      {ONBOARDING_SECTION_LABELS[index]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : ratio !== null ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
              </View>
            ) : (
              <View style={styles.progressPlaceholder} />
            )}
          </View>
          <View style={[styles.progressSide, styles.skipContainer]}>
            {showSkip ? (
              <Pressable hitSlop={8} onPress={onSkip}>
                <Text style={styles.skip}>Skip</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
      {content}
      {hideFooter ? (
        <SafeAreaView style={styles.bottomSafe} edges={['bottom']} />
      ) : (
        <SafeAreaView style={styles.bottomSafe} edges={['bottom']}>
          <View style={styles.footer}>
            {primaryCta ? (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !primaryCta.disabled ? styles.primaryPressed : null,
                  primaryCta.disabled ? styles.primaryDisabled : null,
                ]}
                onPress={primaryCta.onPress}
                disabled={primaryCta.disabled}
              >
                <Text style={typography.button}>{primaryCta.label}</Text>
              </Pressable>
            ) : null}
            {secondaryCta ? (
              <Pressable style={styles.secondaryButton} onPress={secondaryCta.onPress}>
                <Text style={styles.secondaryLabel}>{secondaryCta.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GRIT.colors.bg0,
  },
  topSafe: {
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: GRIT.colors.bg0,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCenter: {
    flex: 1,
    alignItems: 'center',
  },
  progressSide: {
    width: 52,
  },
  skipContainer: {
    alignItems: 'flex-end',
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: GRIT.colors.blue,
  },
  sectionalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  sectionBlock: {
    flex: 1,
    gap: 6,
  },
  sectionTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sectionFill: {
    height: '100%',
    backgroundColor: GRIT.colors.blue,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.42)',
    textTransform: 'uppercase',
  },
  sectionLabelActive: {
    color: GRIT.colors.text0,
  },
  progressPlaceholder: {
    height: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    width: '100%',
  },
  skip: {
    color: GRIT.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 80,
    gap: 24,
  },
  nonScrollContent: {
    flex: 1,
  },
  nonScrollBody: {
    flexGrow: 1,
  },
  mascot: {
    marginBottom: 8,
  },
  mascotHero: {
    marginBottom: 8,
  },
  header: {
    gap: 12,
  },
  headerTightSpacing: {
    marginTop: -HEADER_MASCOT_TO_TITLE_PULL,
  },
  body: {
    gap: 18,
    marginTop: -8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
    backgroundColor: GRIT.colors.bg0,
  },
  bottomSafe: {
    backgroundColor: GRIT.colors.bg0,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: GRIT.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: {
    backgroundColor: GRIT.colors.blue2,
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: GRIT.colors.text0,
  },
});
