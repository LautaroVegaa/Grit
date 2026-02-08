import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { capture, initAnalytics } from '@/analytics/posthog';
import HomeScreen from '@/screens/HomeScreen';

export default function App() {
  useEffect(() => {
    initAnalytics();
    capture('app_opened');
  }, []);

  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}