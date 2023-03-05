import envVars from 'config/environment';
import { encrypt } from 'utils/encrypt';

export const commonHeaders = (userId: number = 1, disableAuth = false) => ({
  [envVars.auth.apiKey]: encrypt(envVars.auth.apiValue),
  'content-type': 'application/json',
  accept: '*/*',
  userId,
  authorization: disableAuth ? '' : 'test',
  'accept-encoding': 'gzip, deflate, br',
  connection: 'keep-alive',
});
