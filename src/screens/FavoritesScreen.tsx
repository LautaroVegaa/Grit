import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
    FlatList,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { capture, screen } from '@/analytics/posthog';
import { QUOTES, Quote } from '@/data/quotes';
import { loadPreferences, saveBookmarked } from '@/storage/preferences';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

type FavoriteItem = Quote;

export default function FavoritesScreen() {
  const [bookmarkedQuotes, setBookmarkedQuotes] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const refreshFavorites = useCallback(async (shouldLogOpen = false) => {
    const preferences = await loadPreferences();
    const bookmarked = preferences.bookmarked ?? {};
    const nextFavorites = QUOTES.filter((quote) => bookmarked[quote.id]);
    setBookmarkedQuotes(bookmarked);
    setFavorites(nextFavorites);
    if (shouldLogOpen) {
      capture('favorites_opened', { count: nextFavorites.length });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      screen('Favorites');
      void refreshFavorites(true);
      return undefined;
    }, [refreshFavorites])
  );

  const handleToggleFavorite = useCallback((quoteId: string) => {
    Haptics.selectionAsync();
    setBookmarkedQuotes((prev) => {
      const next = { ...prev };
      const removing = Boolean(next[quoteId]);
      if (removing) {
        delete next[quoteId];
        capture('favorite_removed', { quoteId });
      } else {
        next[quoteId] = true;
      }
      const nextFavorites = QUOTES.filter((quote) => next[quote.id]);
      setFavorites(nextFavorites);
      void saveBookmarked(next);
      return next;
    });
  }, []);

  const handleShare = useCallback((quote: Quote) => {
    void (async () => {
      try {
        const result = await Share.share({
          message: `${quote.text}\n\nDaily Discipline — Grit`,
        });
        capture('favorite_shared', {
          quoteId: quote.id,
          source: 'favorites',
          shareResult: result.action,
          activityType: result.activityType,
        });
      } catch (error) {
        capture('favorite_shared', {
          quoteId: quote.id,
          source: 'favorites',
          error: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    })();
  }, []);

  const renderItem = useCallback(({ item }: { item: FavoriteItem }) => {
    const isSaved = Boolean(bookmarkedQuotes[item.id]);
    return (
      <View style={styles.card}>
        <Text style={styles.quoteText}>{item.text}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleFavorite(item.id)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.blue : colors.text}
            />
            <Text style={styles.actionLabel}>{isSaved ? 'Remove' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [bookmarkedQuotes, handleShare, handleToggleFavorite]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={52} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Save a quote with the bookmark icon.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: spacing(4),
    gap: spacing(3),
  },
  emptyList: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(6),
  },
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
    gap: spacing(3),
  },
  quoteText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingVertical: spacing(1),
  },
  actionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing(2),
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
