import type { Store } from "@reduxjs/toolkit";
import { store } from "@/src/store/store";
import type { RootState } from "@/src/store/store";

function readUserId(state: RootState) {
  return state.auth.session?.user.id;
}

export function getCurrentUserId(targetStore: Store = store) {
  return readUserId(targetStore.getState() as RootState);
}

export function toScopedStorageKey(baseKey: string, userId?: string | null) {
  return userId ? `${baseKey}:${userId}` : baseKey;
}
