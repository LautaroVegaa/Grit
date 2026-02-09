import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import { computeIntroHeroMascotSize } from '@/components/onboarding/OnboardingMascot';
import { ONBOARDING_PROGRESS } from '@/constants/onboardingProgress';
import { OnboardingStackParamList } from '@/navigation/types';
import { GRIT } from '@/theme/gritTheme';

export type IntroScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingIntro'>;

const MASCOT_SOURCE = require('../../../assets/mascot/grit-mascot.png');
const HERO_TITLE = "Hey, I’m Grit.";
const HERO_SUBTITLE_LINES = [
  "Let’s build your focus system together.",
  "I’ll help you shape a routine that actually fits how you think.",
];

export function IntroScreen({ navigation }: IntroScreenProps) {
  const progress = ONBOARDING_PROGRESS.OnboardingIntro;
  const showProgressBar = false;
  const progressRatio = progress.total > 0 ? progress.current / progress.total : 0;
  const clampedProgress = Math.min(Math.max(progressRatio, 0), 1);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progressWidth = width * 0.88;
  const heroMascotSize = computeIntroHeroMascotSize(width);

  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotTranslateY = useRef(new Animated.Value(-160)).current;
  const mascotScale = useRef(new Animated.Value(0.78)).current;
  const mascotRotate = useRef(new Animated.Value(-6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(8)).current;
  const sub1Opacity = useRef(new Animated.Value(0)).current;
  const sub1TranslateY = useRef(new Animated.Value(8)).current;
  const sub2Opacity = useRef(new Animated.Value(0)).current;
  const sub2TranslateY = useRef(new Animated.Value(8)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    trackScreen('OnboardingIntro');
    capture('onboarding_started');
    capture('onboarding_step_viewed', { stepName: 'intro' });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const easing = Easing.out(Easing.quad);
    const dropEasing = Easing.out(Easing.cubic);
    const animateTo = (value: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
      });

    const runAnimation = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (!isMounted) {
        return;
      }

      if (reduceMotion) {
        mascotTranslateY.setValue(0);
        mascotScale.setValue(1);
        mascotRotate.setValue(0);
        titleTranslateY.setValue(0);
        sub1TranslateY.setValue(0);
        sub2TranslateY.setValue(0);
        ctaTranslateY.setValue(0);

        Animated.sequence([
          Animated.timing(mascotOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(40),
          Animated.timing(titleOpacity, { toValue: 1, duration: 180, easing, useNativeDriver: true }),
          Animated.delay(40),
          Animated.timing(sub1Opacity, { toValue: 1, duration: 180, easing, useNativeDriver: true }),
          Animated.delay(40),
          Animated.timing(sub2Opacity, { toValue: 1, duration: 180, easing, useNativeDriver: true }),
          Animated.delay(40),
          Animated.timing(ctaOpacity, { toValue: 1, duration: 180, easing, useNativeDriver: true }),
        ]).start();
        return;
      }

      const mascotEntry = Animated.sequence([
        Animated.parallel([
          Animated.timing(mascotOpacity, {
            toValue: 1,
            duration: 520,
            easing: dropEasing,
            useNativeDriver: true,
          }),
          Animated.timing(mascotTranslateY, {
            toValue: 14,
            duration: 520,
            easing: dropEasing,
            useNativeDriver: true,
          }),
          Animated.timing(mascotScale, {
            toValue: 1.04,
            duration: 520,
            easing: dropEasing,
            useNativeDriver: true,
          }),
          Animated.timing(mascotRotate, {
            toValue: 2,
            duration: 520,
            easing: dropEasing,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(mascotTranslateY, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(mascotScale, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(mascotRotate, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);

      const textSequence = Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          animateTo(titleOpacity, 1, 520),
          animateTo(titleTranslateY, 0, 520),
        ]),
        Animated.delay(120),
        Animated.parallel([
          animateTo(sub1Opacity, 1, 480),
          animateTo(sub1TranslateY, 0, 480),
        ]),
        Animated.delay(120),
        Animated.parallel([
          animateTo(sub2Opacity, 1, 480),
          animateTo(sub2TranslateY, 0, 480),
        ]),
        Animated.delay(120),
        Animated.parallel([
          animateTo(ctaOpacity, 1, 560),
          animateTo(ctaTranslateY, 0, 560),
        ]),
      ]);

      mascotEntry.start(({ finished }) => {
        if (!isMounted || !finished) {
          return;
        }
        textSequence.start();
      });
    };

    runAnimation();

    return () => {
      isMounted = false;
    };
  }, [
    mascotOpacity,
    mascotScale,
    mascotTranslateY,
    titleOpacity,
    titleTranslateY,
    sub1Opacity,
    sub1TranslateY,
    sub2Opacity,
    sub2TranslateY,
    ctaOpacity,
    ctaTranslateY,
  ]);

  const handleContinue = () => {
    capture('onboarding_step_completed', { stepName: 'intro' });
    navigation.navigate('OnboardingName');
  };

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
            {showProgressBar ? (
              <View style={[styles.progressTrack, { width: progressWidth }]}>
                <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.heroZone}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.mascotWrapper,
              {
                opacity: mascotOpacity,
                transform: [
                  { translateY: mascotTranslateY },
                  { scale: mascotScale },
                  {
                    rotate: mascotRotate.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image source={MASCOT_SOURCE} style={{ width: heroMascotSize, height: heroMascotSize }} resizeMode="contain" />
          </Animated.View>

          <Animated.View
            style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}
          >
            <Text style={styles.title}>{HERO_TITLE}</Text>
          </Animated.View>

          {HERO_SUBTITLE_LINES.map((line, index) => {
            const isFirst = index === 0;
            const opacity = isFirst ? sub1Opacity : sub2Opacity;
            const translateY = isFirst ? sub1TranslateY : sub2TranslateY;

            return (
              <Animated.View
                key={`${line}-${index}`}
                style={{ opacity, transform: [{ translateY }] }}
              >
                <Text style={[styles.subtitle, !isFirst && styles.subtitleSpacer]}>{line}</Text>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View
          style={[
            styles.ctaZone,
            { paddingBottom: insets.bottom + 16 },
            { opacity: ctaOpacity, transform: [{ translateY: ctaTranslateY }] },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryLabel}>Let's get started</Text>
          </Pressable>
        </Animated.View>
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
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  title: {
    color: GRIT.colors.text0,
    fontWeight: '700',
    fontSize: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
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
