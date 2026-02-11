import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { decideInitialRoute } from '@/grit/dailyGate/dailyGate';
import DropsScreen from '@/screens/DropsScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import HomeScreen from '@/screens/HomeScreen';
import MoodCheckinScreen from '@/screens/MoodCheckinScreen';
import PhraseDetailScreen from '@/screens/PhraseDetailScreen';
import StreakWelcomeScreen from '@/screens/StreakWelcomeScreen';
import ProfileFeedbackScreen from '@/screens/profile/ProfileFeedbackScreen';
import ProfileGenderScreen from '@/screens/profile/ProfileGenderScreen';
import ProfileNameScreen from '@/screens/profile/ProfileNameScreen';
import ProfileNotificationsScreen from '@/screens/profile/ProfileNotificationsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { colors } from '@/theme/colors';

import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DailyGate"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="DailyGate"
        component={DailyGateScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="MoodCheckin"
        component={MoodCheckinScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="StreakWelcome"
        component={StreakWelcomeScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Drops"
        component={DropsScreen}
        options={{
          headerShown: true,
          title: "Today's Drops",
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerShown: true,
          title: 'Saved',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <Stack.Screen
        name="PhraseDetail"
        component={PhraseDetailScreen}
        options={{
          headerShown: true,
          title: 'Phrase',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <Stack.Screen
        name="ProfileName"
        component={ProfileNameScreen}
        options={{
          headerShown: true,
          title: 'Name',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <Stack.Screen
        name="ProfileGender"
        component={ProfileGenderScreen}
        options={{
          headerShown: true,
          title: 'Gender',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <Stack.Screen
        name="ProfileNotifications"
        component={ProfileNotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <Stack.Screen
        name="ProfileFeedback"
        component={ProfileFeedbackScreen}
        options={{
          headerShown: true,
          title: 'Feedback',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </Stack.Navigator>
  );
}

type DailyGateProps = NativeStackScreenProps<MainStackParamList, 'DailyGate'>;

function DailyGateScreen({ navigation }: DailyGateProps) {
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const decision = await decideInitialRoute();
        if (!active) {
          return;
        }
        if (decision.route === 'Home') {
          navigation.replace('Home');
        } else {
          navigation.replace(decision.route, decision.params as never);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to resolve daily gate', error);
        }
        if (active) {
          navigation.replace('Home');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [navigation]);

  return (
    <View style={styles.gateLoading}>
      <ActivityIndicator color={colors.blue} />
      <Text style={styles.gateText}>Preparing your practice…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gateLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 12,
  },
  gateText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
