import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { capture } from '@/analytics/posthog';
import { useOnboarding } from '@/context/OnboardingContext';
import { RootStackParamList } from '@/navigation/types';
import { spacing } from '@/utils/spacing';

type ProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
  onFavoritesPress?: () => void;
};

type ListRow = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: string;
};

const palette = {
  appBg: '#0B0D10',
  surface: '#141820',
  elevated: '#1A1F2A',
  divider: 'rgba(255,255,255,0.08)',
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.62)',
  blue: '#2F80FF',
  bluePressed: '#2566CC',
};

const settingsRows: ListRow[] = [
  { key: 'name', label: 'Name', icon: 'person-outline', value: 'Lautaro' },
  { key: 'gender', label: 'Gender', icon: 'male-female-outline', value: 'Male' },
  { key: 'theme', label: 'Theme', icon: 'color-palette-outline', value: 'System' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  { key: 'widgets', label: 'Widgets', icon: 'grid-outline' },
  { key: 'customer-center', label: 'Customer center', icon: 'help-buoy-outline' },
  { key: 'favorites', label: 'My favorites', icon: 'heart-outline' },
  { key: 'feedback', label: 'Feedback', icon: 'chatbubble-ellipses-outline' },
];

const legalRows: ListRow[] = [
  { key: 'privacy', label: 'Privacy Policy', icon: 'shield-outline' },
  { key: 'terms', label: 'Terms of Use', icon: 'document-text-outline' },
];

function ProfileSheet({ visible, onClose, onFavoritesPress }: ProfileSheetProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { resetOnboarding, forceOnboarding, updateForceOnboarding } = useOnboarding();
  const [rendered, setRendered] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(1)).current;
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetHeight = height * 0.88;

  useEffect(() => {
    if (visible) {
      capture('profile_opened');
    }
  }, [visible]);

  const handleClose = useCallback(
    (method: 'backdrop' | 'close_button') => {
      capture('profile_closed', { method });
      onClose();
    },
    [onClose]
  );

  const handlePremiumPress = useCallback(() => {
    capture('paywall_open_requested', { source: 'profile_unlock_card' });
  }, []);

  const handleSettingsPress = useCallback(
    (key: string) => {
      capture('profile_setting_tapped', { itemKey: key });
      if (key === 'favorites') {
        capture('favorites_open_requested');
        handleClose('close_button');
        onFavoritesPress?.();
      }
    },
    [handleClose, onFavoritesPress]
  );

  const handleReplayOnboarding = useCallback(() => {
    capture('onboarding_replay_prompted_from_profile');
    Alert.alert('Replay onboarding?', 'This will reset your onboarding answers.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Replay',
        style: 'destructive',
        onPress: () => {
          capture('onboarding_replay_confirmed');
          void (async () => {
            await resetOnboarding();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
            handleClose('close_button');
          })();
        },
      },
    ]);
  }, [handleClose, navigation, resetOnboarding]);

  const handleForceToggle = useCallback(() => {
    if (!__DEV__) {
      return;
    }
    const next = !forceOnboarding;
    capture('onboarding_force_toggle_changed', { next });
    void updateForceOnboarding(next);
  }, [forceOnboarding, updateForceOnboarding]);

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
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRendered(false);
        }
      });
    }
  }, [backdropOpacity, rendered, translateY, visible]);

  if (!rendered) {
    return null;
  }

  const sheetTranslate = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sheetHeight + spacing(4)],
  });

  return (
    <Modal
      transparent
      animationType="none"
      visible={rendered}
      onRequestClose={() => handleClose('backdrop')}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => handleClose('backdrop')} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY: sheetTranslate }],
            },
          ]}>
          <SafeAreaView style={styles.sheetSafeArea} edges={['top']}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.content,
                { paddingBottom: insets.bottom + spacing(8) },
              ]}>
              {renderHeader(() => handleClose('close_button'))}
              {renderMascotBadge()}
              {renderPremiumCard(handlePremiumPress)}
              {renderStreakCard()}
              {renderSection('Settings', renderSettingsRows(handleSettingsPress, renderReplayRow(handleReplayOnboarding)))}
              {renderSection('Legal', renderLegalRows())}
              {__DEV__ ? renderSection('Developer', renderDeveloperRows(forceOnboarding, handleForceToggle)) : null}
              <Text style={styles.footerText}>v0.1.0 (dev)</Text>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default ProfileSheet;

function renderHeader(onClosePress: () => void) {
  return (
    <View style={styles.headerRow}>
      <TouchableOpacity style={styles.closeButton} onPress={onClosePress} activeOpacity={0.8}>
        <Ionicons name="close" size={22} color={palette.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function renderMascotBadge() {
  return (
    <View style={styles.mascotWrapper}>
      <View style={styles.mascotBadge}>
        <Text style={styles.mascotInitial}>G</Text>
      </View>
    </View>
  );
}

function renderPremiumCard(onUnlockPress: () => void) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.premiumCard}
      onPress={onUnlockPress}
    >
      <View style={styles.premiumTextWrapper}>
        <Text style={styles.premiumTitle}>Unlock everything</Text>
        <Text style={styles.premiumSubtitle}>All categories, themes, widgets & practice</Text>
      </View>
      <View style={styles.premiumBadge}>
        <Ionicons name="star" size={30} color={palette.textPrimary} />
      </View>
    </TouchableOpacity>
  );
}

function renderStreakCard() {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const highlightIndex = 2;

  return (
    <View style={styles.streakCard}>
      <View style={styles.streakNumberWrapper}>
        <Text style={styles.streakNumber}>1</Text>
        <Text style={styles.streakLabel}>day</Text>
      </View>
      <View style={styles.streakTracker}>
        {days.map((day, index) => {
          const isToday = index === highlightIndex;
          return (
            <View
              key={day}
              style={[styles.trackerDot, isToday && styles.trackerDotActive]}
            >
              {isToday ? (
                <Ionicons name="checkmark" size={16} color={palette.appBg} />
              ) : (
                <Text style={styles.trackerLabel}>{day}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function renderSection(title: string, content: ReactNode) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {content}
    </View>
  );
}

function renderSettingsRows(onRowPress: (key: string) => void, extraRows?: ReactNode) {
  return (
    <View style={styles.cardList}>
      {settingsRows.map((row, index) => (
        <View key={row.key}>
          <Pressable style={styles.listRow} onPress={() => onRowPress(row.key)}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Ionicons name={row.icon} size={18} color={palette.blue} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            <View style={styles.rowRight}>
              {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}
              <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
            </View>
          </Pressable>
          {index < settingsRows.length - 1 ? <View style={styles.rowDivider} /> : null}
        </View>
      ))}
      {extraRows}
    </View>
  );
}

function renderReplayRow(onReplay: () => void) {
  return (
    <>
      <View style={styles.rowDivider} />
      <Pressable style={styles.listRow} onPress={onReplay}>
        <View style={styles.rowLeft}>
          <View style={styles.rowIconCircle}>
            <Ionicons name="refresh-outline" size={18} color={palette.blue} />
          </View>
          <Text style={styles.rowLabel}>Replay onboarding</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
      </Pressable>
    </>
  );
}

function renderDeveloperRows(forceOnboarding: boolean, onToggle: () => void) {
  return (
    <View style={styles.cardList}>
      <Pressable style={styles.listRow} onPress={onToggle}>
        <View style={styles.rowLeft}>
          <View style={styles.rowIconCircle}>
            <Ionicons name="build-outline" size={18} color={palette.blue} />
          </View>
          <Text style={styles.rowLabel}>Force onboarding on next launch</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowValue}>{forceOnboarding ? 'On' : 'Off'}</Text>
          <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
        </View>
      </Pressable>
    </View>
  );
}

function renderLegalRows() {
  return (
    <View style={styles.cardList}>
      {legalRows.map((row, index) => (
        <View key={row.key}>
          <Pressable style={styles.listRow} onPress={() => console.log(`Pressed ${row.key}`)}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Ionicons name={row.icon} size={18} color={palette.blue} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
          </Pressable>
          {index < legalRows.length - 1 ? <View style={styles.rowDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetSafeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
    gap: spacing(4),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(1),
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: palette.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  mascotWrapper: {
    alignItems: 'center',
    marginTop: spacing(1),
  },
  mascotBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: palette.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotInitial: {
    color: palette.blue,
    fontSize: 32,
    fontWeight: '700',
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    padding: spacing(4),
    backgroundColor: palette.blue,
  },
  premiumTextWrapper: {
    flex: 1,
    marginRight: spacing(3),
    gap: spacing(1),
  },
  premiumTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  premiumSubtitle: {
    color: palette.textPrimary,
    opacity: 0.85,
    fontSize: 14,
  },
  premiumBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.bluePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.elevated,
    borderRadius: 22,
    padding: spacing(4),
    gap: spacing(4),
  },
  streakNumberWrapper: {
    alignItems: 'center',
    width: 64,
  },
  streakNumber: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  streakLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  streakTracker: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackerDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: palette.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  trackerDotActive: {
    backgroundColor: palette.blue,
    borderColor: palette.blue,
  },
  trackerLabel: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    gap: spacing(2),
  },
  sectionTitle: {
    color: palette.textSecondary,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardList: {
    backgroundColor: palette.elevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.divider,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  rowValue: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.divider,
    marginHorizontal: spacing(4),
  },
  footerText: {
    textAlign: 'center',
    color: palette.textSecondary,
    fontSize: 13,
    marginTop: spacing(2),
  },
});
