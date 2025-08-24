import { Request } from 'express';
import { getMessage, MessageKey, SupportedLanguages } from '@src/locales/index';
import LocalizedHttpException from '@src/errors/LocalizedHttpException';
import { HTTPResponses } from '@src/interfaces/enums';

/**
 * Get localized message for a request
 */
export function getLocalizedMessage(
  req: Request,
  messageKey: MessageKey,
  placeholders?: Record<string, string | number>,
): string {
  const language = req.language || SupportedLanguages.EN;
  return getMessage(messageKey, language, placeholders);
}

/**
 * Create a localized HTTP exception
 */
export function createLocalizedError(
  req: Request,
  status: HTTPResponses,
  messageKey: MessageKey,
  placeholders?: Record<string, string | number>,
  additionalParameters?: any,
): LocalizedHttpException {
  const language = req.language || SupportedLanguages.EN;
  return new LocalizedHttpException(status, messageKey, language, placeholders, additionalParameters);
}

/**
 * Throw a localized HTTP exception
 */
export function throwLocalizedError(
  req: Request,
  status: HTTPResponses,
  messageKey: MessageKey,
  placeholders?: Record<string, string | number>,
  additionalParameters?: any,
): never {
  throw createLocalizedError(req, status, messageKey, placeholders, additionalParameters);
}

/**
 * Check if an error is a localized exception
 */
export function isLocalizedError(error: any): error is LocalizedHttpException {
  return error instanceof LocalizedHttpException;
}

/**
 * Helper function to migrate from old enum-based errors to localized errors
 */
export function mapLegacyErrorToLocalized(legacyMessage: string): MessageKey {
  const errorMap: Record<string, MessageKey> = {
    'Bad request': 'error.badRequest',
    Unauthorised: 'error.unauthorized',
    Unauthorized: 'error.unauthorized',
    'Something went wrong': 'error.somethingWentWrong',
    'Invalid username or password': 'error.invalidUsernameOrPassword',
    'No sufficient permission': 'error.noSufficientPermissions',
    'Your account is still inactive/under processing': 'error.accountInactive',
    'Email not verified': 'error.emailNotVerified',
    'Your account has been deleted as per your request/admin request': 'error.accountDeleted',
  };

  return errorMap[legacyMessage] || 'error.somethingWentWrong';
}

/**
 * Create a success response with localized message
 */
export function createLocalizedSuccessResponse(
  req: Request,
  messageKey: MessageKey,
  data?: any,
  placeholders?: Record<string, string | number>,
) {
  return {
    success: true,
    message: getLocalizedMessage(req, messageKey, placeholders),
    data,
  };
}
