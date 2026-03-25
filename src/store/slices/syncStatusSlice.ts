import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SyncStatusState = {
  lastSyncAt?: number;
  isSyncing: boolean;
};

const initialState: SyncStatusState = {
  isSyncing: false,
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
    hydrateSyncStatus: (_state, action: PayloadAction<SyncStatusState>) =>
      action.payload,
  },
});

export const { setSyncing, setLastSyncAt, hydrateSyncStatus } =
  syncStatusSlice.actions;

export default syncStatusSlice.reducer;

