import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';

import { GRIT, typography } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';
import { MAX_REMINDER_COUNT, MIN_REMINDER_COUNT } from '@/utils/reminderWindow';

export type ReminderWindowScreenContentProps = {
  count: number;
  minCount?: number;
  maxCount?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  startTimeLabel: string;
  endTimeLabel: string;
  onPressStart: () => void;
  onPressEnd: () => void;
  helperLine: string;
  frequencyCaption?: string;
  disabled?: boolean;
  previewMessages?: [string, string];
  toggle?: { value: boolean; onChange: (value: boolean) => void; label?: string };
  action?: { label: string; onPress: () => void; disabled?: boolean };
  title?: string;
  subtitle?: string;
};

export function ReminderWindowScreenContent({
  count,
  minCount = MIN_REMINDER_COUNT,
  maxCount = MAX_REMINDER_COUNT,
  onIncrement,
  onDecrement,
  startTimeLabel,
  endTimeLabel,
  onPressStart,
  onPressEnd,
  helperLine,
  frequencyCaption = 'You can change this anytime. Most athletes start with 6x.',
  disabled,
  previewMessages = [
    'Today is full of possibilities. Embrace them with open arms.',
    'You are capable of achieving great things. Trust yourself.',
  ],
  toggle,
  action,
  title,
  subtitle,
}: ReminderWindowScreenContentProps) {
  const cardOneProgress = useRef(new Animated.Value(0)).current;
  const cardTwoProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) {
        return;
      }
      if (reduceMotion) {
        cardOneProgress.setValue(1);
        cardTwoProgress.setValue(1);
        return;
      }
      cardOneProgress.setValue(0);
      cardTwoProgress.setValue(0);
      Animated.sequence([
        Animated.timing(cardOneProgress, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(180),
        Animated.timing(cardTwoProgress, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      mounted = false;
    };
  }, [cardOneProgress, cardTwoProgress]);

  const canDecrement = count <= minCount;
  const canIncrement = count >= maxCount;
  const interactionDisabled = Boolean(disabled);
  const stepsLabel = useMemo(() => `${count}x`, [count]);

  return (
    <View style={styles.body}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      {toggle ? (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{toggle.label ?? 'Notifications'}</Text>
          <Switch
            value={toggle.value}
            onValueChange={toggle.onChange}
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: GRIT.colors.blue }}
            thumbColor={toggle.value ? GRIT.colors.bg0 : GRIT.colors.bg2}
          />
        </View>
      ) : null}

      <View style={styles.previewStack}>
        <Animated.View
          style={[
            styles.previewCard,
            styles.previewCardSecondary,
            {
              opacity: cardOneProgress,
              transform: [
                {
                  translateY: cardOneProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-14, 0],
                  }),
                },
                {
                  scale: cardOneProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
                { translateY: 10 },
              ],
            },
          ]}
        >
          <View style={styles.previewBadge} />
          <View style={styles.previewTextBlock}>
            <Text style={styles.previewTime}>now</Text>
            <Text style={styles.previewBody}>{previewMessages[0]}</Text>
          </View>
        </Animated.View>
        <Animated.View
          style={[
            styles.previewCard,
            styles.previewCardPrimary,
            {
              opacity: cardTwoProgress,
              transform: [
                {
                  translateY: cardTwoProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-14, 0],
                  }),
                },
                {
                  scale: cardTwoProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
                { translateY: -30 },
              ],
            },
          ]}
        >
          <View style={styles.previewBadge} />
          <View style={styles.previewTextBlock}>
            <Text style={styles.previewTime}>now</Text>
            <Text style={styles.previewBody}>{previewMessages[1] ?? previewMessages[0]}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>How many</Text>
        <View style={styles.countRow}>
          <Pressable
            onPress={onDecrement}
            disabled={canDecrement || interactionDisabled}
            style={[styles.circleButton, (canDecrement || interactionDisabled) && styles.circleButtonDisabled]}
            hitSlop={8}
          >
            <Text style={styles.circleButtonLabel}>-</Text>
          </Pressable>
          <Text style={styles.countValue}>{stepsLabel}</Text>
          <Pressable
            onPress={onIncrement}
            disabled={canIncrement || interactionDisabled}
            style={[styles.circleButton, (canIncrement || interactionDisabled) && styles.circleButtonDisabled]}
            hitSlop={8}
          >
            <Text style={styles.circleButtonLabel}>+</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.frequencyCaption}>{frequencyCaption}</Text>

      <View style={styles.timeCard}>
        <Text style={styles.cardLabel}>Start at</Text>
        <Pressable
          style={styles.timePill}
          onPress={onPressStart}
          disabled={interactionDisabled}
          hitSlop={4}
        >
          <Text style={styles.timeValue}>{startTimeLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.timeCard}>
        <Text style={styles.cardLabel}>End at</Text>
        <Pressable
          style={styles.timePill}
          onPress={onPressEnd}
          disabled={interactionDisabled}
          hitSlop={4}
        >
          <Text style={styles.timeValue}>{endTimeLabel}</Text>
        </Pressable>
      </View>

      <Text style={styles.helper}>{helperLine}</Text>

      {action ? (
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !action.disabled ? styles.primaryPressed : null,
            action.disabled ? styles.primaryDisabled : null,
          ]}
          onPress={action.onPress}
          disabled={action.disabled}
        >
          <Text style={typography.button}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing(2.5),
  },
  header: {
    gap: spacing(1),
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    color: GRIT.colors.text2,
    fontSize: 15,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: GRIT.colors.text0,
    fontSize: 16,
    fontWeight: '600',
  },
  previewStack: {
    gap: spacing(2),
  },
  previewCard: {
    flexDirection: 'row',
    gap: spacing(2),
    borderRadius: 20,
    padding: spacing(2.5),
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    backgroundColor: GRIT.colors.bg1,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  previewCardSecondary: {
    opacity: 0.6,
    transform: [{ translateY: 10 }],
  },
  previewCardPrimary: {
    marginTop: -30,
  },
  previewBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GRIT.colors.blue,
  },
  previewTextBlock: {
    flex: 1,
    gap: spacing(0.5),
  },
  previewTime: {
    color: GRIT.colors.text2,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewBody: {
    color: GRIT.colors.text0,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginTop: spacing(0.5),
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    backgroundColor: GRIT.colors.bg1,
    padding: spacing(2.5),
    gap: spacing(2),
  },
  frequencyCaption: {
    fontSize: 13,
    color: GRIT.colors.text2,
    marginTop: spacing(1),
  },
  cardLabel: {
    color: GRIT.colors.text2,
    fontSize: 14,
    fontWeight: '600',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonDisabled: {
    opacity: 0.3,
  },
  circleButtonLabel: {
    color: GRIT.colors.text0,
    fontSize: 24,
    fontWeight: '600',
  },
  countValue: {
    color: GRIT.colors.text0,
    fontSize: 32,
    fontWeight: '800',
  },
  timeCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    backgroundColor: GRIT.colors.bg1,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePill: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timeValue: {
    color: GRIT.colors.text0,
    fontSize: 18,
    fontWeight: '700',
  },
  helper: {
    textAlign: 'center',
    color: GRIT.colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: GRIT.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing(2),
  },
  primaryPressed: {
    backgroundColor: GRIT.colors.blue2,
  },
  primaryDisabled: {
    opacity: 0.5,
  },
});
