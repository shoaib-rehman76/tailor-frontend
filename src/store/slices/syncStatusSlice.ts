import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SyncStatusState = {
  lastSyncAt?: number;
  isSyncing: boolean;
  syncRequestNonce: number;
  lastError?: string;
};

const initialState: SyncStatusState = {
  isSyncing: false,
  syncRequestNonce: 0,
};

const syncStatusSlice = createSlice({
  name: "syncStatus",
  initialState,
  reducers: {
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSyncAt: (state, action: PayloadAction<number | undefined>) => {
      state.lastSyncAt = action.payload;
    },
    requestSync: (state) => {
      state.syncRequestNonce += 1;
    },
    setSyncError: (state, action: PayloadAction<string | undefined>) => {
      state.lastError = action.payload;
    },
    resetSyncStatus: () => initialState,
    hydrateSyncStatus: (_state, action: PayloadAction<SyncStatusState>) =>
      action.payload,
  },
});

export const {
  setSyncing,
  setLastSyncAt,
  requestSync,
  setSyncError,
  resetSyncStatus,
  hydrateSyncStatus,
} = syncStatusSlice.actions;

export default syncStatusSlice.reducer;
