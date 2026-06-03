/**
 * i18n bootstrap. Russian is the source locale; Uzbek (Latin) is the secondary.
 * The initial language follows the device locale when supported, else falls back
 * to Russian. `changeLanguage` is re-exported through the store for the Settings
 * screen.
 */

import { getLocales } from 'expo-localization';
import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { ru } from './locales/ru';
import { uz } from './locales/uz';

export const SUPPORTED_LANGUAGES = ['ru', 'uz'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: AppLanguage = 'ru';

const resources: Resource = {
  ru: { translation: ru },
  uz: { translation: uz },
};

function isSupported(code: string | null | undefined): code is AppLanguage {
  return code != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

/** Best-effort device language, constrained to what we ship. */
export function detectDeviceLanguage(): AppLanguage {
  const deviceCode = getLocales()[0]?.languageCode;
  return isSupported(deviceCode) ? deviceCode : FALLBACK_LANGUAGE;
}

let initialized = false;

/** Initializes i18next once. `initialLanguage` typically comes from storage. */
export function initI18n(initialLanguage?: AppLanguage): typeof i18n {
  if (initialized) {
    if (initialLanguage && i18n.language !== initialLanguage) {
      void i18n.changeLanguage(initialLanguage);
    }
    return i18n;
  }
  initialized = true;

  void i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage ?? detectDeviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false }, // RN has no XSS surface; React escapes anyway
    returnNull: false,
  });

  return i18n;
}

export { default as i18n } from 'i18next';
