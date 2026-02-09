import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuoteCategory } from '@/data/categories';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

type CategoriesSheetProps = {
  visible: boolean;
  categories: QuoteCategory[];
  selected: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export function CategoriesSheet({
  visible,
  categories,
  selected,
  onToggle,
  onClear,
  onClose,
}: CategoriesSheetProps) {
  const [rendered, setRendered] = useState(visible);
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!rendered) {
      return;
    }

    if (visible) {
      translateY.setValue(1);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRendered(false);
        }
      });
    }
  }, [backdropOpacity, rendered, translateY, visible]);

  const selectedLookup = useMemo(() => {
    return selected.reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
  }, [selected]);

  if (!rendered) {
    return null;
  }

  const sheetTranslate = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 520],
  });

  return (
    <Modal
      transparent
      animationType="none"
      visible={rendered}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + spacing(5),
              transform: [{ translateY: sheetTranslate }],
            },
          ]}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.headerRow}>
              <View style={{ width: 36 }} />
              <Text style={styles.headerTitle}>Categories</Text>
              <TouchableOpacity style={styles.headerButton} onPress={onClose} activeOpacity={0.85}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={[styles.mixRow, selected.length === 0 && styles.mixRowActive]}
                onPress={onClear}
                activeOpacity={0.85}
              >
                <View style={styles.mixIconCircle}>
                  <Ionicons name="shuffle-outline" size={18} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mixTitle}>Mix</Text>
                  <Text style={styles.mixSubtitle}>Blend all categories</Text>
                </View>
                {selected.length === 0 ? (
                  <Ionicons name="checkmark" size={18} color={colors.blue} />
                ) : null}
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.categoriesGrid}>
                {categories.map((category) => {
                  const isSelected = Boolean(selectedLookup[category.key]);
                  return (
                    <TouchableOpacity
                      key={category.key}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => onToggle(category.key)}
                      activeOpacity={0.85}
                    >
                      {category.emoji ? (
                        <Text style={styles.chipEmoji}>{category.emoji}</Text>
                      ) : null}
                      <Text style={styles.chipLabel}>{category.label}</Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color={colors.text} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.9}>
              <Text style={styles.doneLabel}>Done</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0F131C',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing(4),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: spacing(4),
    gap: spacing(4),
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSoft,
    borderRadius: 20,
    padding: spacing(3),
    gap: spacing(3),
  },
  mixRowActive: {
    borderWidth: 1,
    borderColor: colors.blue,
  },
  mixIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1F2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  mixSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: 999,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: spacing(1.5),
  },
  chipActive: {
    borderColor: colors.blue,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: spacing(2),
    backgroundColor: colors.blue,
    borderRadius: 18,
    paddingVertical: spacing(3),
    alignItems: 'center',
  },
  doneLabel: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 16,
  },
});
