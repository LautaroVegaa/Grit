import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { capture } from '@/analytics/posthog';
import { getPhraseById } from '@/grit/phrases';
import {
  loadLikedPhraseIds,
  loadSavedPhraseIds,
  toggleLikedPhraseId,
  toggleSavedPhraseId,
} from '@/grit/storage/phraseActionsStorage';
import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

type Props = NativeStackScreenProps<MainStackParamList, 'PhraseDetail'>;

type ActionConfig = {
  key: 'like' | 'save' | 'share';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
};

export default function PhraseDetailScreen({ route }: Props) {
  const { phraseId } = route.params;
  const phrase = getPhraseById(phraseId);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const [likedIds, savedIds] = await Promise.all([
        loadLikedPhraseIds(),
        loadSavedPhraseIds(),
      ]);
      setLiked(likedIds.includes(phraseId));
      setSaved(savedIds.includes(phraseId));
    })();
  }, [phraseId]);

  const handleLikeToggle = () => {
    void (async () => {
      const next = await toggleLikedPhraseId(phraseId);
      setLiked(next);
      capture('phrase_like_toggled', { phraseId, liked: next });
    })();
  };

  const handleSaveToggle = () => {
    void (async () => {
      const next = await toggleSavedPhraseId(phraseId);
      setSaved(next);
      capture('phrase_save_toggled', { phraseId, saved: next });
    })();
  };

  const handleShare = () => {
    if (!phrase) {
      return;
    }
    void Share.share({ message: `${phrase.text}\n\n— GRIT` });
    capture('phrase_shared', { phraseId });
  };

  if (!phrase) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Phrase not found</Text>
          <Text style={styles.emptySubtitle}>It might have been removed or renamed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const actions: ActionConfig[] = [
    {
      key: 'like',
      icon: liked ? 'heart' : 'heart-outline',
      label: liked ? 'Liked' : 'Like',
      onPress: handleLikeToggle,
      active: liked,
    },
    {
      key: 'save',
      icon: saved ? 'bookmark' : 'bookmark-outline',
      label: saved ? 'Saved' : 'Save',
      onPress: handleSaveToggle,
      active: saved,
    },
    {
      key: 'share',
      icon: 'share-outline',
      label: 'Share',
      onPress: handleShare,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.categoryLabel}>{phrase.category}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.phraseText}>{phrase.text}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{phrase.tone.toUpperCase()}</Text>
          <Text style={styles.metaText}>Intensity {phrase.intensity}</Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionButton, action.active && styles.actionButtonActive]}
            activeOpacity={0.85}
            onPress={action.onPress}
          >
            <Ionicons
              name={action.icon}
              size={22}
              color={action.active ? colors.blue : colors.text}
            />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing(4),
    gap: spacing(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    color: colors.textMuted,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing(3),
  },
  phraseText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing(2),
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.bgSoft,
  },
  actionButtonActive: {
    borderColor: colors.blue,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
