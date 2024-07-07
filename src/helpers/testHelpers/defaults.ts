import envVars from 'src/config/environment';
// import { encrypt } from 'src/utils/encrypt';

export const commonHeaders = (userId: number = 1, disableAuth = false, addtionalHeaders = {}) => {
  let extraObjectToPass = {};
  Object.keys(addtionalHeaders).forEach(key => {
    if (typeof addtionalHeaders[key] === 'object')
      extraObjectToPass[key] = JSON.stringify(addtionalHeaders[key])
    else
      extraObjectToPass[key] = addtionalHeaders[key]
  })
  return {
    [envVars.auth.apiKey]: envVars.auth.apiValue,
    'content-type': 'application/json',
    accept: '*/*',
    userId,
    authorization: disableAuth ? '' : 'test',
    'accept-encoding': 'gzip, deflate, br',
    connection: 'keep-alive',
    ...extraObjectToPass
  }
};
