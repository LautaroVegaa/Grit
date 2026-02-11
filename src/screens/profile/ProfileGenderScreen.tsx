import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';
import { ProfileGenderValue, getProfileGender, setProfileGender } from '@/storage/profileStorage';
import { emitProfileUpdated } from '@/utils/profileEvents';
import { useProfileHeaderBackButton } from './useProfileHeaderBackButton';

type Props = NativeStackScreenProps<MainStackParamList, 'ProfileGender'>;

type Option = {
  key: ProfileGenderValue;
  label: string;
};

const OPTIONS: Option[] = [
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'others', label: 'Other' },
  { key: 'prefer_not_say', label: 'Prefer not to say' },
];

export default function ProfileGenderScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<ProfileGenderValue | null>(null);
  const [saving, setSaving] = useState(false);

  useProfileHeaderBackButton(navigation);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const stored = await getProfileGender();
        if (mounted) {
          setSelected(stored);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to load gender', error);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = useCallback(
    async (value: ProfileGenderValue) => {
      if (saving) {
        return;
      }
      setSaving(true);
      try {
        await setProfileGender(value);
        emitProfileUpdated();
        navigation.goBack();
      } catch {
        Alert.alert('Unable to save', 'Please try again later.');
      } finally {
        setSaving(false);
      }
    },
    [navigation, saving],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Gender</Text>
        <Text style={styles.subtitle}>Choose the option that best matches you.</Text>
        <View style={styles.list}>
          {OPTIONS.map((option) => {
            const isActive = option.key === selected;
            return (
              <Pressable
                key={option.key}
                style={[styles.row, isActive && styles.rowActive]}
                onPress={() => handleSelect(option.key)}
              >
                <Text style={styles.rowLabel}>{option.label}</Text>
                {isActive ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.blue} />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    padding: spacing(4),
    gap: spacing(3),
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 20,
  },
  list: {
    marginTop: spacing(1),
    gap: spacing(1.5),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3),
    borderRadius: 18,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowActive: {
    borderColor: colors.blue,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
