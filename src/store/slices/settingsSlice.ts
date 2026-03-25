import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AppLanguage = "en" | "ur";
export type MeasurementUnit = "in" | "cm";

export type ShopProfile = {
  tailorName: string;
  shopName: string;
  contact: string;
  address: string;
  taxNumber?: string;
  gstNumber?: string;
};

export type SettingsState = {
  language: AppLanguage;
  unit: MeasurementUnit;
  profile: ShopProfile;
  notifications: {
    sms: boolean;
    push: boolean;
  };
};

const initialState: SettingsState = {
  language: "en",
  unit: "in",
  profile: {
    tailorName: "",
    shopName: "",
    contact: "",
    address: "",
  },
  notifications: { sms: false, push: false },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    hydrateSettings: (_state, action: PayloadAction<SettingsState>) => action.payload,
    setLanguage: (state, action: PayloadAction<AppLanguage>) => {
      state.language = action.payload;
    },
    setUnit: (state, action: PayloadAction<MeasurementUnit>) => {
      state.unit = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<ShopProfile>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setNotifications: (
      state,
      action: PayloadAction<{ sms?: boolean; push?: boolean }>
    ) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
  },
});

export const {
  hydrateSettings,
  setLanguage,
  setUnit,
  updateProfile,
  setNotifications,
} = settingsSlice.actions;

export default settingsSlice.reducer;

