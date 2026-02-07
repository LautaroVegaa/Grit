import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type ScreenContainerProps = {
  children: ReactNode;
};

export function ScreenContainer({ children }: ScreenContainerProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.inner, { paddingHorizontal: theme.spacing(5) }]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
  },
});
