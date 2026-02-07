import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Quote } from '@/data/quotes';
import { colors } from '@/theme/colors';

type QuoteSlideProps = {
  quote: Quote;
};

export default function QuoteSlide({ quote }: QuoteSlideProps) {
  const { height, width } = useWindowDimensions();

  return (
    <View style={[styles.container, { height, width }]}>
      <Text style={styles.text}>{quote.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: 0.2,
    paddingHorizontal: 4,
    transform: [{ translateY: -20 }],
  },
});
