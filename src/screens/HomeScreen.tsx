import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { sampleQuote } from '@/data/quotes';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function HomeScreen() {
  const theme = useAppTheme();

  return (
    <ScreenContainer>
      <View style={[styles.content, { gap: theme.spacing(2) }]}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Daily Discipline</Text>
        <Text style={[styles.quote, { color: theme.colors.textPrimary }]}>{sampleQuote.text}</Text>
        <Text style={[styles.author, { color: theme.colors.textSecondary }]}>{sampleQuote.author}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  quote: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  author: {
    fontSize: 16,
  },
});
