import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/src/i18n/translations/en.json";
import ur from "@/src/i18n/translations/ur.json";

const resources = {
  en: { translation: en },
  ur: { translation: ur },
} as const;

if (!i18next.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member
  i18next.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });
}

export default i18next;

