import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useEffect, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolvePostStreakRoute } from '@/grit/dailyGate/dailyGate';
import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { GRIT } from '@/theme/gritTheme';
import { getDateFromLocalISO, getLocalDateISO } from '@/utils/localTime';
import { spacing } from '@/utils/spacing';
import mascotAsset from '../../assets/mascot/grit-mascot.png';

const mascotSource = mascotAsset as ImageSourcePropType;

type Props = NativeStackScreenProps<MainStackParamList, 'StreakWelcome'>;

type WeekDayState = {
  label: string;
  completed: boolean;
  isToday: boolean;
};

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const buildWeekState = (
  todayISO: string,
  lastCompletedISO: string | null,
  streakCount: number,
): WeekDayState[] => {
  const todayDate = getDateFromLocalISO(todayISO);
  const startOfWeek = new Date(todayDate);
  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());

  const completedSet = new Set<string>();
  if (lastCompletedISO) {
    const cursor = getDateFromLocalISO(lastCompletedISO);
    for (let index = 0; index < streakCount; index += 1) {
      completedSet.add(getLocalDateISO(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return WEEKDAY_LABELS.map((label, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    const iso = getLocalDateISO(day);
    return {
      label,
      completed: completedSet.has(iso),
      isToday: iso === todayISO,
    };
  });
};

export default function StreakWelcomeScreen({ navigation, route }: Props) {
  const { todayISO, streakCount, lastCompletedDateISO, greeting } = route.params;
  const subtitle = `Day ${streakCount} of your journey`;
  const week = buildWeekState(todayISO, lastCompletedDateISO, streakCount);
  const [isContinuing, setIsContinuing] = useState(false);
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mascotAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnim, mascotAnim]);

  const mascotAnimatedStyle = {
    opacity: mascotAnim,
    transform: [
      {
        scale: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
      },
      {
        translateY: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
      },
    ],
  };

  const cardAnimatedStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
      },
    ],
  };

  const handleContinue = async () => {
    if (isContinuing) {
      return;
    }
    setIsContinuing(true);
    try {
      const nextRoute = await resolvePostStreakRoute(todayISO);
      if (nextRoute === 'MoodCheckin') {
        navigation.replace('MoodCheckin', { todayISO });
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to advance daily gate after streak', error);
      }
      navigation.replace('Home');
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.mascotWrapper, mascotAnimatedStyle]}>
            <Image source={mascotSource} style={styles.mascot} resizeMode="contain" />
          </Animated.View>
          <View style={styles.textBlock}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <View style={styles.cardBody}>
              <View style={styles.streakBlock}>
                <Text style={styles.streakValue}>{streakCount}</Text>
                <Text style={styles.streakUnit}>days</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.weekSection}>
                {week.map((day) => (
                  <View key={day.label} style={styles.weekDay}>
                    <View
                      style={[
                        styles.weekDot,
                        day.completed ? styles.weekDotCompleted : null,
                        day.isToday ? styles.weekDotToday : null,
                      ]}
                    >
                      {day.completed ? (
                        <AnimatedCheckmark isToday={day.isToday} />
                      ) : null}
                    </View>
                    <Text style={[styles.weekLabel, day.isToday ? styles.weekLabelToday : null]}>{day.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isContinuing ? styles.primaryButtonPressed : null,
            isContinuing ? styles.primaryButtonDisabled : null,
          ]}
          onPress={handleContinue}
          disabled={isContinuing}
        >
          {isContinuing ? (
            <ActivityIndicator color={GRIT.colors.text0} />
          ) : (
            <Text style={styles.primaryLabel}>Continue</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type AnimatedCheckmarkProps = {
  isToday: boolean;
};

const AnimatedCheckmark = memo(({ isToday }: AnimatedCheckmarkProps) => {
  const scale = useRef(new Animated.Value(isToday ? 0.85 : 1)).current;
  const opacity = useRef(new Animated.Value(isToday ? 0 : 1)).current;

  useEffect(() => {
    if (isToday) {
      scale.setValue(0.85);
      opacity.setValue(0);
      if (__DEV__) {
        console.log('[StreakWelcome] animate selected day');
      }
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.08,
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, {
          toValue: 1,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(1);
      opacity.setValue(1);
    }
  }, [isToday, opacity, scale]);

  return (
    <Animated.Text
      style={[
        styles.weekCheck,
        isToday ? styles.weekCheckToday : null,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      ✓
    </Animated.Text>
  );
});

AnimatedCheckmark.displayName = 'AnimatedCheckmark';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing(4),
    paddingTop: spacing(4),
    paddingBottom: spacing(5),
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    gap: spacing(4),
  },
  mascotWrapper: {
    paddingVertical: spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: 170,
    height: 170,
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(1),
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    width: '100%',
    borderRadius: 36,
    backgroundColor: colors.bgSoft,
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(4),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakBlock: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  streakValue: {
    fontSize: 68,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 72,
  },
  streakUnit: {
    fontSize: 18,
    color: colors.textMuted,
    marginTop: -8,
    letterSpacing: 0.5,
  },
  cardDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing(3),
  },
  weekSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  weekDay: {
    alignItems: 'center',
    gap: spacing(1),
    flex: 1,
  },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotCompleted: {
    borderColor: colors.blue,
    backgroundColor: 'rgba(39,122,255,0.12)',
  },
  weekDotToday: {
    borderColor: colors.text,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: colors.text,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  weekCheck: {
    color: GRIT.colors.blue,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  weekCheckToday: {
    textShadowColor: GRIT.colors.blue,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  weekLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  weekLabelToday: {
    color: colors.text,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    height: 64,
    borderRadius: 22,
    backgroundColor: GRIT.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryLabel: {
    color: GRIT.colors.text0,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
