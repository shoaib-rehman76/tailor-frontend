import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "@/src/store/slices/settingsSlice";
import offlineQueueReducer from "@/src/store/slices/offlineQueueSlice";
import syncStatusReducer from "@/src/store/slices/syncStatusSlice";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    offlineQueue: offlineQueueReducer,
    syncStatus: syncStatusReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

