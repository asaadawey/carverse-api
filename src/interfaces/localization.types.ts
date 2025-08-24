export enum SupportedLanguages {
  EN = 'en',
  AR = 'ar',
}

export interface LocalizedMessage {
  key: string;
  defaultMessage: string;
  placeholders?: Record<string, string | number>;
}

export interface LocalizationContext {
  language: SupportedLanguages;
  fallbackLanguage: SupportedLanguages;
}
