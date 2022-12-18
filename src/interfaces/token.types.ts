import envVars from 'config/environment';

export interface Token {
  id: number;
  name: string;
  timestamp: Date;
  exp?: Date;
}

export const tokens = {
  secret: envVars.appSecret,
  expiry: ['development', 'test'].includes(envVars.mode) ? '1y' : '1d',
  name: envVars.appName,
};
