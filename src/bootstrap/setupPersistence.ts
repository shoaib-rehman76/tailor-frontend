import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Store } from "@reduxjs/toolkit";
import type { RootState } from "@/src/store/store";
import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import { toScopedStorageKey } from "@/src/utils/storageScope";

export function setupPersistence(store: Store) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const persist = async (state: RootState) => {
    const userId = state.auth.session?.user.id;
    const writes = [
      AsyncStorage.setItem(
        STORAGE_KEYS.authSession,
        JSON.stringify(state.auth.session)
      ),
      AsyncStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(state.settings)
      ),
    ];

    if (userId) {
      writes.push(
        AsyncStorage.setItem(
          toScopedStorageKey(STORAGE_KEYS.offlineQueue, userId),
          JSON.stringify(state.offlineQueue)
        ),
        AsyncStorage.setItem(
          toScopedStorageKey(STORAGE_KEYS.syncStatus, userId),
          JSON.stringify(state.syncStatus)
        )
      );
    }

    await Promise.all(writes);
  };

  return store.subscribe(() => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      void persist(store.getState() as RootState);
    }, 250);
  });
}
