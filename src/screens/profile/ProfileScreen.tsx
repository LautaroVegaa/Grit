import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import ProfileSheet from '@/components/ProfileSheet';
import { MainStackParamList } from '@/navigation/types';

const SHEET_CLOSE_DURATION_MS = 240;

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const [sheetVisible, setSheetVisible] = useState(true);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!sheetVisible) {
      closeTimeoutRef.current = setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, SHEET_CLOSE_DURATION_MS);
      return () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }
    return undefined;
  }, [navigation, sheetVisible]);

  useFocusEffect(
    useCallback(() => {
      const handleHardwareBack = () => {
        if (!sheetVisible) {
          return true;
        }
        setSheetVisible(false);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
      return () => {
        subscription.remove();
      };
    }, [sheetVisible])
  );

  const handleClose = useCallback(() => {
    setSheetVisible(false);
  }, []);

  return (
    <View style={styles.container}>
      <ProfileSheet visible={sheetVisible} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
