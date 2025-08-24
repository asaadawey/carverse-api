import { en, MessageKey } from './en';
import { ar } from './ar';
import { SupportedLanguages } from '@src/interfaces/localization.types';

// Centralized translations registry
const translations = {
  [SupportedLanguages.EN]: en,
  [SupportedLanguages.AR]: ar,
};

/**
 * Get translated message by key and language
 * @param key Message key from translations
 * @param language Target language
 * @param placeholders Optional placeholders for interpolation
 * @returns Translated message
 */
export function getMessage(
  key: MessageKey,
  language: SupportedLanguages = SupportedLanguages.EN,
  placeholders?: Record<string, string | number>,
): string {
  // Get translation for the requested language, fallback to English
  const translation = translations[language]?.[key] || translations[SupportedLanguages.EN][key];

  if (!translation) {
    console.warn(`Translation missing for key: ${key} in language: ${language}`);
    return key; // Return key as fallback
  }

  // Replace placeholders if provided
  if (placeholders) {
    return Object.entries(placeholders).reduce(
      (message, [placeholder, value]) => message.replace(`{${placeholder}}`, String(value)),
      translation,
    );
  }

  return translation;
}

/**
 * Get all available languages
 */
export function getSupportedLanguages(): SupportedLanguages[] {
  return Object.values(SupportedLanguages);
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is SupportedLanguages {
  return Object.values(SupportedLanguages).includes(language as SupportedLanguages);
}

export { SupportedLanguages } from '@src/interfaces/localization.types';
export type { MessageKey };
export { en, ar };
