import i18n from "@/src/i18n";
import type { AppLanguage } from "@/src/store/slices/settingsSlice";

// For development stability we only change the i18n language here.
// RTL layout direction can be applied manually or with a one-time native change
// to avoid infinite reload loops while Metro is running.
export async function applyLanguageAndDirection(language: AppLanguage) {
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }
}

