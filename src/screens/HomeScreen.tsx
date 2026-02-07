import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
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

import ProfileSheet from '@/components/ProfileSheet';
import QuoteSlide from '@/components/QuoteSlide';
import { QUOTES } from '@/data/quotes';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

type ActionButton = {
  key: 'share' | 'like' | 'bookmark';
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
};

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedQuotes, setLikedQuotes] = useState<Record<string, boolean>>({});
  const [bookmarkedQuotes, setBookmarkedQuotes] = useState<Record<string, boolean>>({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const activeQuote = QUOTES[activeIndex];
  const isActiveLiked = activeQuote ? Boolean(likedQuotes[activeQuote.id]) : false;
  const isActiveBookmarked = activeQuote ? Boolean(bookmarkedQuotes[activeQuote.id]) : false;

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const nextIndex = Math.round(offsetY / height);
      const clampedIndex = Math.max(0, Math.min(nextIndex, QUOTES.length - 1));
      setActiveIndex(clampedIndex);
    },
    [height]
  );

  const toggleLike = useCallback(() => {
    if (!activeQuote) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedQuotes((prev) => ({
      ...prev,
      [activeQuote.id]: !prev[activeQuote.id],
    }));
  }, [activeQuote]);

  const toggleBookmark = useCallback(() => {
    if (!activeQuote) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarkedQuotes((prev) => ({
      ...prev,
      [activeQuote.id]: !prev[activeQuote.id],
    }));
  }, [activeQuote]);

  const handleShare = useCallback(() => {
    if (!activeQuote) {
      return;
    }
    Haptics.selectionAsync();
    Share.share({
      message: `${activeQuote.text}\n\nDaily Discipline — Grit`,
    });
  }, [activeQuote]);

  const renderItem = useCallback(({ item }: { item: (typeof QUOTES)[number] }) => <QuoteSlide quote={item} />, []);

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
          data={QUOTES}
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

          <TouchableOpacity style={styles.topIconButton} activeOpacity={0.8}>
            <Ionicons name="help-circle-outline" size={22} color={colors.text} />
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

      <ProfileSheet visible={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
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
});
