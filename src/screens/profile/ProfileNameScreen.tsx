import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';
import { getProfileName, setProfileName } from '@/storage/profileStorage';
import { emitProfileUpdated } from '@/utils/profileEvents';
import { useProfileHeaderBackButton } from './useProfileHeaderBackButton';

type Props = NativeStackScreenProps<MainStackParamList, 'ProfileName'>;

export default function ProfileNameScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [initialName, setInitialName] = useState('');
  const [saving, setSaving] = useState(false);

  useProfileHeaderBackButton(navigation);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const stored = await getProfileName();
        if (!mounted) {
          return;
        }
        setName(stored ?? '');
        setInitialName(stored ?? '');
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to load profile name', error);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Add a name', 'Please enter a name to continue.');
      return;
    }
    setSaving(true);
    try {
      await setProfileName(trimmed);
      emitProfileUpdated();
      navigation.goBack();
    } catch {
      Alert.alert('Something went wrong', 'Unable to save your name right now.');
    } finally {
      setSaving(false);
    }
  }, [name, navigation]);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && trimmedName !== initialName.trim() && !saving;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Display name</Text>
          <Text style={styles.subtitle}>This appears inside drops and notifications.</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Add your name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!saving}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveLabel}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
    padding: spacing(4),
    justifyContent: 'space-between',
  },
  content: {
    gap: spacing(2.5),
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
  input: {
    backgroundColor: colors.bgSoft,
    borderRadius: 16,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    paddingVertical: spacing(2.5),
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveLabel: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
