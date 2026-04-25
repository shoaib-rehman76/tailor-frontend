import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { hydrateSettings, SettingsState } from "@/src/store/slices/settingsSlice";
import {
  hydrateAuthSession,
  markAuthHydrated,
} from "@/src/store/slices/authSlice";
import {
  hydrateQueue,
  OfflineQueueState,
  clearQueue,
} from "@/src/store/slices/offlineQueueSlice";
import {
  hydrateSyncStatus,
  resetSyncStatus,
  SyncStatusState,
} from "@/src/store/slices/syncStatusSlice";
import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import type { AuthSession } from "@/src/types/auth";
import { toScopedStorageKey } from "@/src/utils/storageScope";

function safeJsonParse<T>(value: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export const hydrateAllFromStorage = createAsyncThunk(
  "bootstrap/hydrateAllFromStorage",
  async (userIdOverride: string | undefined, { dispatch }) => {
    const [authRaw, settingsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.authSession),
      AsyncStorage.getItem(STORAGE_KEYS.settings),
    ]);

    let auth: AuthSession | undefined;
    if (!userIdOverride) {
      auth = safeJsonParse<AuthSession>(authRaw);
      if (auth) {
        dispatch(hydrateAuthSession(auth));
      } else {
        dispatch(markAuthHydrated());
      }
    }

    const settings = safeJsonParse<SettingsState>(settingsRaw);
    if (settings) dispatch(hydrateSettings(settings));

    const userId = userIdOverride ?? auth?.user.id;
    if (!userId) {
      dispatch(clearQueue());
      dispatch(resetSyncStatus());
      return;
    }

    const [queueRaw, syncRaw] = await Promise.all([
      AsyncStorage.getItem(toScopedStorageKey(STORAGE_KEYS.offlineQueue, userId)),
      AsyncStorage.getItem(toScopedStorageKey(STORAGE_KEYS.syncStatus, userId)),
    ]);

    const queue = safeJsonParse<OfflineQueueState>(queueRaw);
    if (queue) {
      dispatch(hydrateQueue(queue));
    } else {
      dispatch(clearQueue());
    }

    const syncStatus = safeJsonParse<SyncStatusState>(syncRaw);
    if (syncStatus) {
      dispatch(hydrateSyncStatus(syncStatus));
    } else {
      dispatch(resetSyncStatus());
    }
  }
);
