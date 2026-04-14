import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export type OfflineOperationType =
  | "orders/create"
  | "orders/update"
  | "orders/updateOrder"
  | "orders/delete"
  | "orders/addPayment"
  | "settings/updateProfile";

export type OfflineOperation<TPayload = unknown> = {
  id: string;
  type: OfflineOperationType;
  payload: TPayload;
  createdAt: number;
  tries: number;
  lastError?: string;
};

export type OfflineQueueState = {
  items: OfflineOperation[];
};

const initialState: OfflineQueueState = {
  items: [],
};

const offlineQueueSlice = createSlice({
  name: "offlineQueue",
  initialState,
  reducers: {
    enqueue: {
      reducer: (state, action: PayloadAction<OfflineOperation>) => {
        state.items.push(action.payload);
      },
      prepare: (op: Omit<OfflineOperation, "id" | "createdAt" | "tries">) => ({
        payload: {
          ...op,
          id: nanoid(),
          createdAt: Date.now(),
          tries: 0,
        } satisfies OfflineOperation,
      }),
    },
    markTryFailed: (
      state,
      action: PayloadAction<{ id: string; error: string }>
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      item.tries += 1;
      item.lastError = action.payload.error;
    },
    dequeue: (state, action: PayloadAction<{ id: string }>) => {
      state.items = state.items.filter((i) => i.id !== action.payload.id);
    },
    clearQueue: (state) => {
      state.items = [];
    },
    hydrateQueue: (state, action: PayloadAction<OfflineQueueState>) => {
      state.items = action.payload.items ?? [];
    },
  },
});

export const { enqueue, dequeue, clearQueue, markTryFailed, hydrateQueue } =
  offlineQueueSlice.actions;

export default offlineQueueSlice.reducer;
