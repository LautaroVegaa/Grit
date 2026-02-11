import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { capture, screen as trackScreen } from '@/analytics/posthog';
import {
  DayPart,
  SelectionResult,
  commitDailyPhrases,
  getDailyPhrases,
} from '@/grit/phrases';
import { loadLastCommittedDropsKey, saveLastCommittedDropsKey } from '@/grit/storage/dropsStorage';
import { loadRemindersPerDay } from '@/grit/storage/notificationsStorage';
import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

const DEFAULT_ITEMS_PER_DAY = 6;

const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

type Props = NativeStackScreenProps<MainStackParamList, 'Drops'>;

const determineDayPart = (date: Date): DayPart => {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) {
    return 'morning';
  }
  if (hours >= 12 && hours < 18) {
    return 'afternoon';
  }
  return 'night';
};

const buildCommitKey = (result: SelectionResult, itemsPerDay: number): string =>
  `${result.dateISO}|${result.dayPart}|${itemsPerDay}`;

const capitalize = (value: string): string =>
  value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

export default function DropsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<SelectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [itemsPerDay, setItemsPerDay] = useState(DEFAULT_ITEMS_PER_DAY);
  const [committedKey, setCommittedKey] = useState<string | null>(null);

  const currentCommitKey = useMemo(
    () => (result ? buildCommitKey(result, itemsPerDay) : null),
    [itemsPerDay, result],
  );

  const loadDrops = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = Boolean(options?.silent);
      setErrorMessage(null);
      if (isSilent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const reminders = await loadRemindersPerDay();
        const count = reminders ?? DEFAULT_ITEMS_PER_DAY;
        setItemsPerDay(count);
        const dayPart = determineDayPart(new Date());
        const selection = await getDailyPhrases(dayPart, count);
        setResult(selection);

        const key = buildCommitKey(selection, count);
        const storedKey = await loadLastCommittedDropsKey();
        setCommittedKey(storedKey);
        if (storedKey !== key) {
          await commitDailyPhrases(selection);
          await saveLastCommittedDropsKey(key);
          setCommittedKey(key);
          capture('drops_committed', {
            dayPart: selection.dayPart,
            items: selection.items.length,
            skippedDueToHistory: selection.skippedDueToHistory,
          });
        }

        capture('drops_loaded', {
          dayPart: selection.dayPart,
          items: selection.items.length,
          fallbackUsed: selection.fallbackUsed,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        capture('drops_load_error', { message });
        setErrorMessage('No drops available right now.');
      } finally {
        if (isSilent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    trackScreen('Drops');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDrops();
    }, [loadDrops]),
  );

  const handleRefresh = useCallback(() => {
    void loadDrops({ silent: true });
  }, [loadDrops]);

  const handlePhrasePress = useCallback(
    (phraseId: string) => {
      navigation.navigate('PhraseDetail', { phraseId });
    },
    [navigation],
  );

  const renderContent = () => {
    if (loading && !result) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.text} />
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No drops available right now.</Text>
          <Text style={styles.emptySubtitle}>Pull to refresh to try again.</Text>
        </View>
      );
    }

    if (!result) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Still warming up.</Text>
          <Text style={styles.emptySubtitle}>Pull to refresh to get today&apos;s drops.</Text>
        </View>
      );
    }

    return (
      <View style={styles.listWrapper}>
        {result.fallbackUsed ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              We reused a few phrases to keep momentum while your history resets.
            </Text>
          </View>
        ) : null}

        {result.items.map((item, index) => (
          <TouchableOpacity
            key={item.phrase.id}
            style={styles.phraseCard}
            activeOpacity={0.85}
            onPress={() => handlePhrasePress(item.phrase.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.indexLabel}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{item.phrase.category}</Text>
              </View>
            </View>
            <Text style={styles.phraseText}>{item.phrase.text}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{capitalize(item.phrase.tone)}</Text>
              <Text style={styles.metaText}>Intensity {item.phrase.intensity}</Text>
              {item.reason !== 'weighted_selection' ? (
                <Text style={styles.metaReason}>{item.reason.replace('_', ' ')}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.footerMeta}>
          <Text style={styles.metaSummary}>
            Skipped repeats: {result.skippedDueToHistory}
          </Text>
          <Text style={styles.metaSummary}>
            Commit status: {currentCommitKey && committedKey === currentCommitKey ? 'saved' : 'pending'}
          </Text>
        </View>
      </View>
    );
  };

  const headerSubtitle = result
    ? `${DAY_PART_LABEL[result.dayPart]} • ${result.items.length} drops`
    : 'Pull to refresh to load your drops';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today&apos;s Drops</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
          <Text style={styles.helperText}>
            Target reminders per day: {itemsPerDay}
          </Text>
        </View>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(8),
  },
  header: {
    paddingTop: spacing(2),
    paddingBottom: spacing(3),
    gap: spacing(1),
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  listWrapper: {
    gap: spacing(3),
  },
  phraseCard: {
    backgroundColor: colors.bgSoft,
    borderRadius: 18,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(2),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indexLabel: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.5),
  },
  categoryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  phraseText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  metaReason: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  notice: {
    backgroundColor: colors.mascotHaloBg,
    borderColor: colors.mascotHaloBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing(2),
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  footerMeta: {
    paddingBottom: spacing(6),
    gap: spacing(0.5),
  },
  metaSummary: {
    color: colors.textMuted,
    fontSize: 13,
  },
  loadingState: {
    paddingVertical: spacing(8),
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing(8),
    alignItems: 'center',
    gap: spacing(1),
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
