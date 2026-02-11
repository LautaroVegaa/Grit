import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { capture, initAnalytics } from '@/analytics/posthog';
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';
import { handlePhraseNotificationNavigation, onNavigationReady } from '@/grit/notifications/notificationRouting';
import { rescheduleDropsIfTimezoneChanged } from '@/grit/notifications/notificationsScheduler';
import { MainNavigator } from '@/navigation/MainNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { navigationRef } from '@/navigation/navigationRef';
import { RootStackParamList } from '@/navigation/types';
import { updateStreakOnAppOpen } from '@/storage/streakStorage';
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
    void updateStreakOnAppOpen();
  }, []);

  useEffect(() => {
    const checkTimezone = () => {
      void rescheduleDropsIfTimezoneChanged();
    };

    checkTimezone();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkTimezone();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handlePhraseNotificationNavigation(response.notification.request.content.data);
      },
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handlePhraseNotificationNavigation(response.notification.request.content.data);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <NavigationContainer
            ref={navigationRef}
            theme={navigationTheme}
            onReady={onNavigationReady}
          >
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