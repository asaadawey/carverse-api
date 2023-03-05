import envVars from 'config/environment';

export interface Token {
  id: number;
  name: string;
  customerId?: number;
  providerId?: number;
  keepLoggedIn?: boolean;
  timestamp: Date;
  exp?: Date | string;
}

export const tokens = {
  secret: envVars.appSecret,
  expiry: ['development', 'test'].includes(envVars.mode) ? '1y' : '1d',
  name: envVars.appName,
};
