import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  FlatListProps,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { capture, screen } from '@/analytics/posthog';
import { CategoriesSheet } from '@/components/CategoriesSheet';
import QuoteSlide from '@/components/QuoteSlide';
import { CATEGORIES, CATEGORY_LOOKUP } from '@/data/categories';
import { scheduleDailyDropsIfNeeded } from '@/grit/notifications/notificationsScheduler';
import { getFeedBatch, Phrase } from '@/grit/phrases';
import { MainStackParamList } from '@/navigation/types';
import { loadPreferences, saveBookmarked, saveLiked, saveSelectedCategories } from '@/storage/preferences';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

type ActionButton = {
  key: 'share' | 'like' | 'bookmark';
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
};

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

const FEED_BATCH_SIZE = 12;

export default function HomeScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedQuotes, setLikedQuotes] = useState<Record<string, boolean>>({});
  const [bookmarkedQuotes, setBookmarkedQuotes] = useState<Record<string, boolean>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [feedItems, setFeedItems] = useState<Phrase[]>([]);
  const [feedCursor, setFeedCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [isFeedUnavailable, setIsFeedUnavailable] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hasRefreshedOnFocus = useRef(false);
  const categorySignature = useMemo(() => {
    if (!selectedCategories.length) {
      return 'mix';
    }
    return selectedCategories.slice().sort().join('|');
  }, [selectedCategories]);

  const categorySignatureRef = useRef(categorySignature);
  useEffect(() => {
    categorySignatureRef.current = categorySignature;
  }, [categorySignature]);

  const phraseCategories = useMemo(() => {
    if (!selectedCategories.length) {
      return undefined;
    }
    const seen = new Set<Phrase['category']>();
    const next: Phrase['category'][] = [];
    selectedCategories.forEach((key) => {
      const match = CATEGORY_LOOKUP[key];
      if (match) {
        const category = match.label as Phrase['category'];
        if (!seen.has(category)) {
          seen.add(category);
          next.push(category);
        }
      }
    });
    return next.length ? next : undefined;
  }, [selectedCategories]);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const pendingResetRef = useRef(false);
  const feedLengthRef = useRef(0);

  useEffect(() => {
    cursorRef.current = feedCursor;
  }, [feedCursor]);

  const fetchFeedBatch = useCallback(
    async (options?: { reset?: boolean }) => {
      if (isFetchingRef.current) {
        if (options?.reset) {
          pendingResetRef.current = true;
        }
        return;
      }

      pendingResetRef.current = false;

      if (options?.reset) {
        seenIdsRef.current = new Set();
      }

      isFetchingRef.current = true;
      if (options?.reset) {
        setIsInitialLoading(true);
      }

      const requestSignature = categorySignatureRef.current;

      try {
        const response = await getFeedBatch({
          batchSize: FEED_BATCH_SIZE,
          cursor: options?.reset ? null : cursorRef.current,
          allowedCategories: phraseCategories,
          excludeIds: Array.from(seenIdsRef.current),
        });

        if (categorySignatureRef.current !== requestSignature) {
          return;
        }

        setFeedError(null);
        setIsFeedUnavailable(response.totalAvailable === 0);
        setFeedCursor(response.cursor);
        cursorRef.current = response.cursor;

        if (options?.reset) {
          setActiveIndex(0);
          setFeedItems(response.items);
          seenIdsRef.current = new Set(response.items.map((item) => item.id));
        } else {
          setFeedItems((prev) => [...prev, ...response.items]);
          response.items.forEach((item) => seenIdsRef.current.add(item.id));
        }
      } catch (error) {
        if (categorySignatureRef.current === requestSignature) {
          const message = error instanceof Error ? error.message : 'Unable to load feed.';
          setFeedError(message);
        }
      } finally {
        isFetchingRef.current = false;
        setIsInitialLoading(false);
        if (pendingResetRef.current) {
          pendingResetRef.current = false;
          void fetchFeedBatch({ reset: true });
        }
      }
    },
    [phraseCategories],
  );

  useEffect(() => {
    setFeedItems([]);
    setFeedCursor(null);
    cursorRef.current = null;
    setFeedError(null);
    setIsFeedUnavailable(false);
    setIsInitialLoading(true);
    setActiveIndex(0);
    seenIdsRef.current = new Set();
    void fetchFeedBatch({ reset: true });
  }, [categorySignature, fetchFeedBatch]);

  const activePhrase = feedItems[activeIndex];
  const isActiveLiked = activePhraseId ? Boolean(likedQuotes[activePhraseId]) : false;
  const isActiveBookmarked = activePhraseId ? Boolean(bookmarkedQuotes[activePhraseId]) : false;

  const hydratePreferences = useCallback(async () => {
    const preferences = await loadPreferences();
    setLikedQuotes(preferences.liked ?? {});
    setBookmarkedQuotes(preferences.bookmarked ?? {});
    setSelectedCategories(preferences.selectedCategories ?? []);
  }, []);

  useEffect(() => {
    screen('Home');
  }, []);

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  useEffect(() => {
    void scheduleDailyDropsIfNeeded();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasRefreshedOnFocus.current) {
        hasRefreshedOnFocus.current = true;
        return undefined;
      }
      void hydratePreferences();
      return undefined;
    }, [hydratePreferences])
  );

  useEffect(() => {
    if (!activePhrase) {
      return;
    }
    capture('quote_viewed', {
      quoteId: activePhrase.id,
      index: activeIndex,
      activeCategories: selectedCategories,
      selectionCount: selectedCategories.length,
    });
  }, [activeIndex, activePhrase, selectedCategories]);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (feedItems.length === 0) {
        return 0;
      }
      return Math.min(prev, feedItems.length - 1);
    });
  }, [feedItems.length]);

  useEffect(() => {
    feedLengthRef.current = feedItems.length;
  }, [feedItems.length]);

  useEffect(() => {
    const nextPhrase = feedItems[activeIndex];
    setActivePhraseId(nextPhrase ? nextPhrase.id : null);
  }, [activeIndex, feedItems]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 0,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef<NonNullable<FlatListProps<Phrase>['onViewableItemsChanged']>>(
    ({ viewableItems }) => {
      if (!viewableItems.length) {
        return;
      }
      const first = viewableItems[0];
      if (typeof first.index !== 'number') {
        return;
      }
      const maxIndex = Math.max(0, feedLengthRef.current - 1);
      const nextIndex = Math.max(0, Math.min(first.index, maxIndex));
      setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    },
  ).current;

  const toggleLike = useCallback(() => {
    if (!activePhrase || !activePhraseId) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedQuotes((prev) => {
      const nextValue = !prev[activePhraseId];
      capture('quote_liked_toggled', { quoteId: activePhraseId, liked: nextValue });
      const next = { ...prev };
      if (nextValue) {
        next[activePhraseId] = true;
      } else {
        delete next[activePhraseId];
      }
      void saveLiked(next);
      return next;
    });
  }, [activePhrase, activePhraseId]);

  const toggleBookmark = useCallback(() => {
    if (!activePhrase || !activePhraseId) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarkedQuotes((prev) => {
      const nextValue = !prev[activePhraseId];
      capture('quote_saved_toggled', { quoteId: activePhraseId, saved: nextValue });
      const next = { ...prev };
      if (nextValue) {
        next[activePhraseId] = true;
      } else {
        delete next[activePhraseId];
      }
      void saveBookmarked(next);
      return next;
    });
  }, [activePhrase, activePhraseId]);

  const handleShare = useCallback(() => {
    if (!activePhrase) {
      return;
    }
    Haptics.selectionAsync();
    void (async () => {
      try {
        const result = await Share.share({
          message: `${activePhrase.text}\n\nDaily Discipline — Grit`,
        });
        capture('quote_shared', {
          quoteId: activePhrase.id,
          source: 'home',
          shareResult: result.action,
          activityType: result.activityType,
        });
      } catch (error) {
        capture('quote_shared', {
          quoteId: activePhrase.id,
          source: 'home',
          error: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    })();
  }, [activePhrase]);

  const handleDoubleTapLike = useCallback((phrase: Phrase) => {
    setLikedQuotes((prev) => {
      if (prev[phrase.id]) {
        return prev;
      }
      capture('quote_liked_toggled', { quoteId: phrase.id, liked: true });
      const next = { ...prev, [phrase.id]: true };
      void saveLiked(next);
      return next;
    });
  }, []);

  const handleOpenProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleOpenDrops = useCallback(() => {
    capture('drops_open_requested', { source: 'home_top_bar' });
    navigation.navigate('Drops');
  }, [navigation]);

  const handleOpenCategories = useCallback(() => {
    capture('categories_opened');
    setIsCategoriesOpen(true);
  }, []);

  const handleCloseCategories = useCallback(() => {
    capture('categories_closed', { selectedCount: selectedCategories.length });
    setIsCategoriesOpen(false);
  }, [selectedCategories.length]);

  const handleToggleCategory = useCallback((key: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(key);
      const next = exists ? prev.filter((item) => item !== key) : [...prev, key];
      capture('categories_changed', { selected: next, count: next.length });
      void saveSelectedCategories(next);
      return next;
    });
  }, []);

  const handleClearCategories = useCallback(() => {
    setSelectedCategories((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      capture('categories_changed', { selected: [], count: 0 });
      void saveSelectedCategories([]);
      return [];
    });
  }, []);

  const handleRetryFeed = useCallback(() => {
    setFeedError(null);
    setIsFeedUnavailable(false);
    setIsInitialLoading(true);
    seenIdsRef.current = new Set();
    void fetchFeedBatch({ reset: true });
  }, [fetchFeedBatch]);

  const renderItem = useCallback(
    ({ item }: { item: Phrase }) => (
      <QuoteSlide phrase={item} onDoubleTapLike={handleDoubleTapLike} />
    ),
    [handleDoubleTapLike],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: height, offset: height * index, index }),
    [height]
  );

  const renderEmptyState = useCallback(() => {
    if (isInitialLoading) {
      return (
        <>
          <ActivityIndicator size="large" color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Loading feed…</Text>
          <Text style={styles.emptySubtitle}>Finding the best phrases.</Text>
        </>
      );
    }

    if (feedError) {
      return (
        <>
          <Ionicons name="alert-circle-outline" size={34} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Couldn’t load phrases</Text>
          <Text style={styles.emptySubtitle}>{feedError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetryFeed} activeOpacity={0.85}>
            <Text style={styles.retryLabel}>Try again</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (isFeedUnavailable) {
      return (
        <>
          <Ionicons name="alert-circle-outline" size={34} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No phrases in these categories</Text>
          <Text style={styles.emptySubtitle}>Try Mix or choose another set.</Text>
        </>
      );
    }

    return (
      <>
        <Ionicons name="alert-circle-outline" size={34} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Scroll to refresh</Text>
        <Text style={styles.emptySubtitle}>We’ll keep loading fresh drops.</Text>
      </>
    );
  }, [feedError, handleRetryFeed, isFeedUnavailable, isInitialLoading]);

  const actionButtons: ActionButton[] = [
    { key: 'share', icon: 'share-outline', onPress: handleShare },
    {
      key: 'like',
      icon: isActiveLiked ? 'heart' : 'heart-outline',
      onPress: toggleLike,
      active: isActiveLiked,
    },
    {
      key: 'bookmark',
      icon: isActiveBookmarked ? 'bookmark' : 'bookmark-outline',
      onPress: toggleBookmark,
      active: isActiveBookmarked,
    },
  ];

  useEffect(() => {
    if (isFeedUnavailable || !cursorRef.current) {
      return;
    }
    if (feedItems.length === 0) {
      return;
    }
    const remaining = feedItems.length - activeIndex - 1;
    if (remaining <= 4) {
      void fetchFeedBatch();
    }
  }, [activeIndex, feedItems.length, fetchFeedBatch, isFeedUnavailable]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <View style={styles.listWrapper}>
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={height}
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          bounces={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>{renderEmptyState()}</View>
          }
        />
      </View>

      <SafeAreaView style={styles.safeTopArea} pointerEvents="box-none">
        <View style={styles.topBarContent}>
          <TouchableOpacity
            style={styles.topIconButton}
            activeOpacity={0.8}
            onPress={handleOpenProfile}
          >
            <Ionicons name="person-outline" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.brandText}>GRIT</Text>

          <TouchableOpacity
            style={styles.topIconButton}
            activeOpacity={0.8}
            onPress={handleOpenDrops}
          >
            <Ionicons name="water-outline" size={22} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topIconButton}
            activeOpacity={0.8}
            onPress={handleOpenCategories}
          >
            <Ionicons name="funnel-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={[styles.actionPill, { bottom: insets.bottom + spacing(6) }]}>
        {actionButtons.map((button) => (
          <TouchableOpacity
            key={button.key}
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={button.onPress}
          >
            <Ionicons name={button.icon} size={26} color={button.active ? colors.blue : colors.text} />
          </TouchableOpacity>
        ))}
      </View>

      <CategoriesSheet
        visible={isCategoriesOpen}
        categories={CATEGORIES}
        selected={selectedCategories}
        onToggle={handleToggleCategory}
        onClear={handleClearCategories}
        onClose={handleCloseCategories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listWrapper: {
    flex: 1,
  },
  safeTopArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing(4),
  },
  topBarContent: {
    marginTop: spacing(2.5),
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing(3),
  },
  topIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  retryButton: {
    marginTop: spacing(1),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: 14,
    backgroundColor: colors.blue,
  },
  retryLabel: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 14,
  },
  brandText: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  actionPill: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(20,20,24,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
  },
  actionButton: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
    gap: spacing(2.5),
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
