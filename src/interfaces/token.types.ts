import envVars from '@src/config/environment';

export interface Token {
  id: number;
  name: string;
  customerId?: number;
  providerId?: number;
  keepLoggedIn?: boolean;
  authorisedEncryptedClient: string;
  previousExpiredTokens?: string[];
  timestamp: Date;
  userType: string;
  applicationVersion: string;
  exp?: Date | string;
  deviceFingerprint?: string; // Device-specific identifier
  userAgent?: string; // User agent for additional device identification
}

export const tokens = {
  secret: envVars.appSecret,
  expiry: ['development', 'test'].includes(envVars.mode) && envVars.auth.skipAuth ? '1y' : '1d',
  name: envVars.appName,
};
