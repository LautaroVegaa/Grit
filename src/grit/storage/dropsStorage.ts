import AsyncStorage from '@react-native-async-storage/async-storage';

import { LAST_COMMITTED_DROPS_KEY } from './keys';

export const loadLastCommittedDropsKey = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_COMMITTED_DROPS_KEY);
  } catch (error) {
    console.warn('Failed to load last committed drops key', error);
    return null;
  }
};

export const saveLastCommittedDropsKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_COMMITTED_DROPS_KEY, key);
  } catch (error) {
    console.warn('Failed to persist last committed drops key', error);
  }
};
