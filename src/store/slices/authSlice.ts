import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession } from "@/src/types/auth";

export type AuthState = {
  session: AuthSession | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  session: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      state.session = action.payload;
      state.hydrated = true;
    },
    clearSession: (state) => {
      state.session = null;
    
      state.hydrated = true;
    },
    hydrateAuthSession: (state, action: PayloadAction<AuthSession | null>) => {
      state.session = action.payload;
      state.hydrated = true;
    },
    markAuthHydrated: (state) => {
      state.hydrated = true;
    },
  },
});

export const { setSession, clearSession, hydrateAuthSession, markAuthHydrated } =
  authSlice.actions;

export default authSlice.reducer;
