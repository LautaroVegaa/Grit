import { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GRIT } from '@/theme/gritTheme';

const MASCOT_SOURCE = Image.resolveAssetSource(require('../../../assets/mascot/grit-mascot.png'));

type PremiumOnboardingShellProps = {
  mascotSizeVariant?: 'hero' | 'standard';
  progress: number;
  title: string;
  subtitle: string;
  subtitleLines?: string[];
  children?: ReactNode;
  primaryCtaLabel: string;
  onPrimaryCta: () => void;
  titleAlign?: 'center' | 'left';
};

export function PremiumOnboardingShell({
  mascotSizeVariant = 'standard',
  progress,
  title,
  subtitle,
  subtitleLines,
  primaryCtaLabel,
  onPrimaryCta,
  titleAlign = 'center',
}: PremiumOnboardingShellProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const heroMascotSize =
    mascotSizeVariant === 'hero' ? Math.min(260, width * 0.55) : width * 0.35;
  const computedSubtitleLines = subtitleLines ?? [subtitle];
  const progressWidth = width * 0.88;

  return (
    <View style={styles.root}>
      <View style={styles.background} pointerEvents="none">
        <View style={styles.heroLayerOne} />
        <View style={styles.heroLayerTwo} />
        <View style={styles.heroLayerThree} />
      </View>

      <View style={styles.content}>
        <View style={[styles.topBarWrapper, { paddingTop: insets.top }]}>
          <View style={styles.topBar}>
            <View style={[styles.progressTrack, { width: progressWidth }]}>
              <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.heroZone}>
          <Image
            source={MASCOT_SOURCE}
            style={{ width: heroMascotSize, height: heroMascotSize, marginBottom: 20, marginTop: 12 }}
            resizeMode="contain"
          />
          <Text style={[styles.title, { textAlign: titleAlign }]}>{title}</Text>
          {computedSubtitleLines.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              style={[styles.subtitle, index > 0 && styles.subtitleSpacer]}
            >
              {line}
            </Text>
          ))}
        </View>

        <View style={[styles.ctaZone, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
            onPress={onPrimaryCta}
          >
            <Text style={styles.primaryLabel}>{primaryCtaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#02050B',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroLayerOne: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#02050B',
  },
  heroLayerTwo: {
    position: 'absolute',
    width: '160%',
    height: '160%',
    top: -140,
    left: '-30%',
    backgroundColor: '#071127',
    opacity: 0.7,
    transform: [{ rotate: '8deg' }],
  },
  heroLayerThree: {
    position: 'absolute',
    width: '170%',
    height: '150%',
    bottom: -100,
    right: '-40%',
    backgroundColor: '#040914',
    opacity: 0.8,
    transform: [{ rotate: '-6deg' }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  topBarWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  topBar: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: GRIT.colors.blue,
  },
  heroZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: GRIT.colors.text0,
    fontWeight: '700',
    fontSize: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: GRIT.colors.text1,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  subtitleSpacer: {
    marginTop: 8,
  },
  ctaZone: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#050708',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 32,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: GRIT.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: {
    backgroundColor: GRIT.colors.blue2,
  },
  primaryLabel: {
    color: GRIT.colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});