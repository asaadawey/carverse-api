import { SupportedLanguages } from '@src/interfaces/localization.types';

// English translations (default/fallback)
export const en = {
  // HTTP Error Messages
  'error.badRequest': 'Bad request',
  'error.unauthorized': 'Unauthorized',
  'error.somethingWentWrong': 'Something went wrong',
  'error.invalidUsernameOrPassword': 'Invalid username or password',
  'error.noSufficientPermissions': 'No sufficient permissions',
  'error.accountInactive': 'Your account is still inactive/under processing',
  'error.emailNotVerified': 'Email not verified',
  'error.accountDeleted': 'Your account has been deleted as per your request/admin request',
  'error.duplicateData':
    'Cannot proceed with this operation as it seems to be duplicated. Please try again with other data',
  'error.operationFailed': 'Operation failed. Please try again',
  'error.validationError': 'Validation error',
  'error.notFound': 'Resource not found',
  'error.internalServerError': 'Internal server error',
  'error.emailAlreadyVerified': 'Email already verified',
  'error.invalidOtp': 'Invalid OTP',

  // Validation Messages
  'validation.required': 'This field is required',
  'validation.email': 'Please enter a valid email address',
  'validation.minLength': 'Must be at least {min} characters long',
  'validation.maxLength': 'Must be no more than {max} characters long',
  'validation.phoneNumber': 'Please enter a valid phone number',
  'validation.password': 'Password must contain at least 8 characters',

  // Business Logic Messages
  'order.timeout': 'Order has timed out',
  'order.cancelled': 'Order has been cancelled',
  'order.notFound': 'Order not found',
  'order.alreadyAccepted': 'Order has already been accepted',
  'order.cannotCancel': 'Cannot cancel this order',
  'order.paymentFailed': 'Payment failed',
  'order.providerNotAvailable': 'Provider is not available',

  // User Messages
  'user.notFound': 'User not found',
  'user.alreadyExists': 'User already exists',
  'user.passwordResetSent': 'Password reset email has been sent',
  'user.profileUpdated': 'Profile updated successfully',

  // Provider Messages
  'provider.notFound': 'Provider not found',
  'provider.serviceNotAvailable': 'Service not available in your area',
  'provider.outOfRange': 'Provider is out of service range',

  // Payment Messages
  'payment.failed': 'Payment failed',
  'payment.successful': 'Payment successful',
  'payment.methodNotSupported': 'Payment method not supported',
  'payment.invalidAmount': 'Invalid payment amount',

  // File Upload Messages
  'upload.failed': 'File upload failed',
  'upload.invalidFormat': 'Invalid file format',
  'upload.sizeTooLarge': 'File size too large',

  // General Success Messages
  'success.created': 'Created successfully',
  'success.updated': 'Updated successfully',
  'success.deleted': 'Deleted successfully',
  'success.sent': 'Sent successfully',
};

export type MessageKey = keyof typeof en;
