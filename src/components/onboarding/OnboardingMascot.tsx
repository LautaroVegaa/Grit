import { Image, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

const MASCOT_SOURCE = require('../../../assets/mascot/grit-mascot.png');
const BASE_SIZE = 72;
const BASE_MARGIN_BOTTOM = 8;
const HERO_MIN_SIZE = 150;
const HERO_MAX_SIZE = 210;
const HERO_WIDTH_RATIO = 0.36;
const INTRO_HERO_MAX_SIZE = 260;
const INTRO_HERO_WIDTH_RATIO = 0.55;

export function computeHeroMascotSize(screenWidth: number) {
  return Math.round(Math.max(HERO_MIN_SIZE, Math.min(HERO_MAX_SIZE, screenWidth * HERO_WIDTH_RATIO)));
}

export function computeIntroHeroMascotSize(screenWidth: number) {
  return Math.round(Math.min(INTRO_HERO_MAX_SIZE, screenWidth * INTRO_HERO_WIDTH_RATIO));
}

export type OnboardingMascotProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  hero?: boolean;
};

export function OnboardingMascot({ size = 72, style, hero = false }: OnboardingMascotProps) {
  const { width } = useWindowDimensions();
  const heroSize = computeHeroMascotSize(width);
  const resolvedSize = hero ? heroSize : size;
  const marginBottom = hero ? BASE_MARGIN_BOTTOM - (resolvedSize - BASE_SIZE) : BASE_MARGIN_BOTTOM;

  return (
    <View style={[styles.container, { marginBottom }, style]}>
      <Image source={MASCOT_SOURCE} resizeMode="contain" style={{ width: resolvedSize, height: resolvedSize }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
