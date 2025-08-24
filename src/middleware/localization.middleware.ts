import { Request, Response, NextFunction } from 'express';
import { SupportedLanguages, isLanguageSupported } from '@src/locales/index';

// Extend Request interface to include language
declare global {
  namespace Express {
    interface Request {
      language: SupportedLanguages;
    }
  }
}

/**
 * Middleware to detect and set language from request headers
 * Checks in order: lang header, accept-language header, defaults to English
 */
const localizationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let language: SupportedLanguages = SupportedLanguages.EN; // Default fallback

  // Method 1: Check 'lang' header (preferred method)
  const langHeader = req.headers.lang as string;
  if (langHeader && isLanguageSupported(langHeader)) {
    language = langHeader;
  }

  // Set the detected language on the request object
  req.language = language;

  // Set response header to indicate the language being used
  res.setHeader('Content-Language', language);

  next();
};

export default localizationMiddleware;
