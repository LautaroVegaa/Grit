import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { RootNavigationContainer } from '@/navigation/RootNavigationContainer';

export default function RootLayout() {
  return (
    <RootNavigationContainer>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </RootNavigationContainer>
  );
}
