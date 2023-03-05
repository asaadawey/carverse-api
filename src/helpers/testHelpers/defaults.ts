import envVars from 'config/environment';
import CryptoJS from 'crypto-js';

export const commonHeaders = (userId: number = 1, disableAuth = false) => ({
  [envVars.auth.apiKey]: CryptoJS.AES.encrypt(envVars.auth.apiValue, envVars.auth.apiSalt).toString(),
  'content-type': 'application/json',
  accept: '*/*',
  userId,
  authorization: disableAuth ? '' : 'test',
  'accept-encoding': 'gzip, deflate, br',
  connection: 'keep-alive',
});
