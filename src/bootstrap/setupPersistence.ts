import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Store } from "@reduxjs/toolkit";
import type { RootState } from "@/src/store/store";
import { STORAGE_KEYS } from "@/src/constants/storageKeys";

export function setupPersistence(store: Store) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const persist = async (state: RootState) => {
    await Promise.all([
      AsyncStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(state.settings)
      ),
      AsyncStorage.setItem(
        STORAGE_KEYS.offlineQueue,
        JSON.stringify(state.offlineQueue)
      ),
      AsyncStorage.setItem(
        STORAGE_KEYS.syncStatus,
        JSON.stringify(state.syncStatus)
      ),
    ]);
  };

  return store.subscribe(() => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      void persist(store.getState() as RootState);
    }, 250);
  });
}

