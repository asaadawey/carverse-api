import { Request } from 'express';
import { createHash } from 'crypto';

/**
 * Generate a device fingerprint based on request headers
 * This combines multiple device-specific headers to create a unique identifier
 */
export const generateDeviceFingerprint = (req: Request): string => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const xRequestedWith = req.headers['x-requested-with'] || '';

  // Client can send additional device info in custom headers
  const deviceId = req.headers['x-device-id'] || '';
  const devicePlatform = req.headers['x-device-platform'] || '';
  const deviceVersion = req.headers['x-device-version'] || '';
  const appVersion = req.headers['x-app-version'] || '';

  // Combine all available device information
  const deviceInfo = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    xRequestedWith,
    deviceId,
    devicePlatform,
    deviceVersion,
    appVersion,
  ].join('|');

  // Create a hash of the device information
  return createHash('sha256').update(deviceInfo).digest('hex');
};

/**
 * Extract user agent from request
 */
export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || '';
};
