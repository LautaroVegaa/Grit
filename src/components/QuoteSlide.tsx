import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { Phrase } from '@/grit/phrases';
import { colors } from '@/theme/colors';

type QuoteSlideProps = {
  phrase: Phrase;
  onDoubleTapLike?: (phrase: Phrase) => void;
};

const DOUBLE_TAP_DELAY_MS = 250;

export default function QuoteSlide({ phrase, onDoubleTapLike }: QuoteSlideProps) {
  const { height, width } = useWindowDimensions();
  const lastTapRef = useRef(0);
  const heartScale = useRef(new Animated.Value(0.6)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const playHeartAnimation = useCallback(() => {
    heartScale.stopAnimation();
    heartOpacity.stopAnimation();
    heartScale.setValue(0.6);
    heartOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(heartOpacity, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 1.05,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 320,
          delay: 120,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [heartOpacity, heartScale]);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY_MS) {
      lastTapRef.current = 0;
      onDoubleTapLike?.(phrase);
      playHeartAnimation();
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTapLike, phrase, playHeartAnimation]);

  return (
    <Pressable style={[styles.container, { height, width }]} onPress={handlePress}>
      <Text style={styles.text}>{phrase.text}</Text>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heartOverlay,
          {
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
      >
        <Ionicons name="heart" size={96} color={colors.blue} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: 0.2,
    paddingHorizontal: 4,
    transform: [{ translateY: -20 }],
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
