import envVars from 'config/environment';

export const commonHeaders = (userId: number = 1) => ({
  [envVars.auth.apiKey]: envVars.auth.apiValue,
  'content-type': 'application/json',
  accept: '*/*',
  userId,
  authorization: 'test',
  'accept-encoding': 'gzip, deflate, br',
  connection: 'keep-alive',
});
