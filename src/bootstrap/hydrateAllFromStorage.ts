import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { hydrateSettings, SettingsState } from "@/src/store/slices/settingsSlice";
import {
  hydrateQueue,
  OfflineQueueState,
} from "@/src/store/slices/offlineQueueSlice";
import {
  hydrateSyncStatus,
  SyncStatusState,
} from "@/src/store/slices/syncStatusSlice";
import { STORAGE_KEYS } from "@/src/constants/storageKeys";

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
  async (_, { dispatch }) => {
    const [settingsRaw, queueRaw, syncRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.settings),
      AsyncStorage.getItem(STORAGE_KEYS.offlineQueue),
      AsyncStorage.getItem(STORAGE_KEYS.syncStatus),
    ]);

    const settings = safeJsonParse<SettingsState>(settingsRaw);
    if (settings) dispatch(hydrateSettings(settings));

    const queue = safeJsonParse<OfflineQueueState>(queueRaw);
    if (queue) dispatch(hydrateQueue(queue));

    const syncStatus = safeJsonParse<SyncStatusState>(syncRaw);
    if (syncStatus) dispatch(hydrateSyncStatus(syncStatus));
  }
);

