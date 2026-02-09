import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GRIT } from '@/theme/gritTheme';
import { spacing } from '@/utils/spacing';

export type SelectableChipProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
  tone?: 'solid' | 'outline';
};

export function SelectableChip({ label, description, selected, onPress, icon, tone = 'outline' }: SelectableChipProps) {
  const chipStyle = [styles.chip, tone === 'solid' ? styles.chipSolid : styles.chipOutline];
  const selectedStyle = tone === 'solid' ? styles.selectedSolid : styles.selectedOutline;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[chipStyle, selected ? selectedStyle : null]}
    >
      <View style={styles.chipContent}>
        <View style={styles.textWrapper}>
          {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
          <View style={styles.textBlock}>
            <Text style={styles.chipLabel}>{label}</Text>
            {description ? <Text style={styles.chipDescription}>{description}</Text> : null}
          </View>
        </View>
        <View style={[styles.indicator, selected ? styles.indicatorSelected : styles.indicatorUnselected]}>
          {selected ? <Text style={styles.indicatorCheck}>✓</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 22,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.25),
  },
  chipOutline: {
    borderWidth: 1,
    borderColor: GRIT.colors.border0,
    backgroundColor: GRIT.colors.bg1,
  },
  chipSolid: {
    backgroundColor: GRIT.colors.bg1,
  },
  selectedOutline: {
    borderColor: GRIT.colors.blue,
    backgroundColor: 'rgba(47,107,255,0.12)',
  },
  selectedSolid: {
    backgroundColor: GRIT.colors.blue,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  chipLabel: {
    color: GRIT.colors.text0,
    fontSize: 15,
    fontWeight: '600',
  },
  chipDescription: {
    color: GRIT.colors.text2,
    fontSize: 13,
    marginTop: spacing(0.5),
  },
  indicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorUnselected: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  indicatorSelected: {
    backgroundColor: GRIT.colors.blue,
  },
  indicatorCheck: {
    color: '#080C15',
    fontSize: 16,
    fontWeight: '800',
  },
});
