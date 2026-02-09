import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GRIT, typography } from '@/theme/gritTheme';

export type OptionCardProps = {
  title: string;
  subtitle?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  type?: 'radio' | 'check';
};

export function OptionCard({ title, subtitle, emoji, selected, onPress, type = 'radio' }: OptionCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={[styles.cardBody, selected ? styles.cardSelected : styles.cardUnselected]}>
        {selected ? <View pointerEvents="none" style={styles.cardGlow} /> : null}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
            <Text style={[typography.optionTitle, styles.titleText]}>{title}</Text>
          </View>
          {subtitle ? <Text style={typography.optionSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={[styles.indicator, selected ? styles.indicatorSelected : styles.indicatorUnselected]}>
          {selected ? <Text style={styles.check}>✓</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
  },
  cardBody: {
    position: 'relative',
    minHeight: 72,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: GRIT.colors.bg1,
    borderWidth: 1.5,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: 'rgba(47,107,255,0.85)',
    borderWidth: 1.5,
  },
  cardUnselected: {
    borderColor: GRIT.colors.border0,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    backgroundColor: 'rgba(47,107,255,0.12)',
  },
  textBlock: {
    flex: 1,
    gap: 6,
    paddingRight: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  emoji: {
    fontSize: 20,
  },
  titleText: {
    flexShrink: 1,
    flexGrow: 1,
  },
  indicator: {
    marginLeft: 'auto',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorUnselected: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  indicatorSelected: {
    backgroundColor: GRIT.colors.blue,
  },
  check: {
    color: GRIT.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
