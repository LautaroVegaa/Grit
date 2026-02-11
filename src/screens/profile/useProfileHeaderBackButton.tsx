import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/utils/spacing';

export function useProfileHeaderBackButton<RouteName extends keyof MainStackParamList>(
  navigation: NativeStackNavigationProp<MainStackParamList, RouteName>,
) {
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: undefined,
      headerLeft: () => (
        <TouchableOpacity
          style={styles.button}
          onPress={handleBack}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
          <Text style={styles.label}>Back</Text>
        </TouchableOpacity>
      ),
    });
  }, [handleBack, navigation]);
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    gap: spacing(0.5),
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
