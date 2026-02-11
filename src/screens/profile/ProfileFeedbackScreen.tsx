import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
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
import { appendFeedbackEntry } from '@/storage/profileStorage';
import { useProfileHeaderBackButton } from './useProfileHeaderBackButton';

type Props = NativeStackScreenProps<MainStackParamList, 'ProfileFeedback'>;

export default function ProfileFeedbackScreen({ navigation }: Props) {
  useProfileHeaderBackButton(navigation);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert('Share a thought', 'Tell us what you have in mind before sending.');
      return;
    }
    setSubmitting(true);
    try {
      await appendFeedbackEntry(trimmed);
      setMessage('');
      Alert.alert('Thanks!', 'We got your feedback.');
    } catch {
      Alert.alert('Unable to send', 'Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }, [message]);

  const canSubmit = message.trim().length > 0 && !submitting;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Feedback</Text>
          <Text style={styles.subtitle}>Help us improve GRIT. We read everything.</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your feedback here"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            editable={!submitting}
          />
        </View>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitLabel}>{submitting ? 'Sending…' : 'Send feedback'}</Text>
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
    minHeight: 160,
    borderRadius: 18,
    padding: spacing(3),
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    paddingVertical: spacing(2.5),
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
