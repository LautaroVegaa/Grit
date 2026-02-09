import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { capture, initAnalytics } from '@/analytics/posthog';
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';
import { MainNavigator } from '@/navigation/MainNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgSoft,
    text: colors.text,
    border: colors.border,
  },
};

function LoadingScreen() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={colors.blue} />
      <Text style={styles.loadingText}>Preparing GRIT…</Text>
    </View>
  );
}

function RootNavigator() {
  const { data, loading, forceOnboarding } = useOnboarding();
  const shouldForce = __DEV__ && forceOnboarding;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {loading ? (
        <Stack.Screen name="Loading" component={LoadingScreen} />
      ) : shouldForce || !data.completed ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    initAnalytics();
    capture('app_opened');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </OnboardingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});