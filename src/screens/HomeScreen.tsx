import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
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
import ProfileSheet from '@/components/ProfileSheet';
import QuoteSlide from '@/components/QuoteSlide';
import { CATEGORIES, DEFAULT_CATEGORY_KEY } from '@/data/categories';
import { QUOTES, Quote } from '@/data/quotes';
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

export default function HomeScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedQuotes, setLikedQuotes] = useState<Record<string, boolean>>({});
  const [bookmarkedQuotes, setBookmarkedQuotes] = useState<Record<string, boolean>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hasRefreshedOnFocus = useRef(false);

  const filteredQuotes = useMemo(() => {
    if (selectedCategories.length === 0) {
      return QUOTES;
    }
    const selectedSet = new Set(selectedCategories);
    return QUOTES.filter((quote) => {
      const categories = quote.categories?.length ? quote.categories : [DEFAULT_CATEGORY_KEY];
      return categories.some((category) => selectedSet.has(category));
    });
  }, [selectedCategories]);

  const activeQuote = filteredQuotes[activeIndex];
  const isActiveLiked = activeQuote ? Boolean(likedQuotes[activeQuote.id]) : false;
  const isActiveBookmarked = activeQuote ? Boolean(bookmarkedQuotes[activeQuote.id]) : false;

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
    const quote = filteredQuotes[activeIndex];
    if (!quote) {
      return;
    }
    capture('quote_viewed', {
      quoteId: quote.id,
      index: activeIndex,
      activeCategories: selectedCategories,
      selectionCount: selectedCategories.length,
    });
  }, [activeIndex, filteredQuotes, selectedCategories]);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (filteredQuotes.length === 0) {
        return 0;
      }
      return Math.min(prev, filteredQuotes.length - 1);
    });
  }, [filteredQuotes.length]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const nextIndex = Math.round(offsetY / height);
      const clampedIndex = Math.max(0, Math.min(nextIndex, filteredQuotes.length - 1));
      setActiveIndex(clampedIndex);
    },
    [filteredQuotes.length, height]
  );

  const toggleLike = useCallback(() => {
    if (!activeQuote) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedQuotes((prev) => {
      const nextValue = !prev[activeQuote.id];
      capture('quote_liked_toggled', { quoteId: activeQuote.id, liked: nextValue });
      const next = { ...prev };
      if (nextValue) {
        next[activeQuote.id] = true;
      } else {
        delete next[activeQuote.id];
      }
      void saveLiked(next);
      return next;
    });
  }, [activeQuote]);

  const toggleBookmark = useCallback(() => {
    if (!activeQuote) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarkedQuotes((prev) => {
      const nextValue = !prev[activeQuote.id];
      capture('quote_saved_toggled', { quoteId: activeQuote.id, saved: nextValue });
      const next = { ...prev };
      if (nextValue) {
        next[activeQuote.id] = true;
      } else {
        delete next[activeQuote.id];
      }
      void saveBookmarked(next);
      return next;
    });
  }, [activeQuote]);

  const handleShare = useCallback(() => {
    if (!activeQuote) {
      return;
    }
    Haptics.selectionAsync();
    void (async () => {
      try {
        const result = await Share.share({
          message: `${activeQuote.text}\n\nDaily Discipline — Grit`,
        });
        capture('quote_shared', {
          quoteId: activeQuote.id,
          source: 'home',
          shareResult: result.action,
          activityType: result.activityType,
        });
      } catch (error) {
        capture('quote_shared', {
          quoteId: activeQuote.id,
          source: 'home',
          error: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    })();
  }, [activeQuote]);

  const handleFavoritesNavigation = useCallback(() => {
    navigation.navigate('Favorites');
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

  const renderItem = useCallback(({ item }: { item: Quote }) => <QuoteSlide quote={item} />, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: height, offset: height * index, index }),
    [height]
  );

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <View style={styles.listWrapper}>
        <FlatList
          data={filteredQuotes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={height}
          snapToAlignment="start"
          onMomentumScrollEnd={handleMomentumEnd}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          bounces={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={34} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No quotes in these categories</Text>
              <Text style={styles.emptySubtitle}>Try Mix or choose another set.</Text>
            </View>
          }
        />
      </View>

      <SafeAreaView style={styles.safeTopArea} pointerEvents="box-none">
        <View style={styles.topBarContent}>
          <TouchableOpacity
            style={styles.topIconButton}
            activeOpacity={0.8}
            onPress={() => setIsProfileOpen(true)}
          >
            <Ionicons name="person-outline" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.brandText}>GRIT</Text>

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

      <ProfileSheet
        visible={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onFavoritesPress={handleFavoritesNavigation}
      />

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
