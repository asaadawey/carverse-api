import envVars from 'config/environment';

export interface Token {
  id: number;
  name: string;
  timestamp: Date;
  exp?: Date;
}

export const tokens = {
  secret: envVars.appSecret,
  expiry: '1y',
  name: envVars.appName,
};
