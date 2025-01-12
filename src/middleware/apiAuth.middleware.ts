import envVars from '@src/config/environment';
import { HttpException } from '@src/errors/index';
import { HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import { createFailResponse } from '@src/responses/index';

const apiAuthMiddleware = (gapiValue: string): boolean => {
  if (!gapiValue)
    throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, 'GAPI Key not found');
  //DEPRECATED
  // GAPI key should come from client encrypted
  // Decrypt the GAPI key and check if it's matching
  // var decryptedGapiKey = decrypt(gapi);

  if (gapiValue !== envVars.auth.apiValue) {
    throw new HttpException(
      HTTPResponses.Unauthorised,
      HTTPErrorString.UnauthorisedAPI,
      'GAPI Key found but doesnt match' + JSON.stringify({ received: gapiValue || '' }),
    );
  }
  return true;
};

export const apiAuthRoute = (req, res, next) => {
  try {
    apiAuthMiddleware(req.headers[envVars.auth.apiKey.toLowerCase()] as string);
    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next, HTTPResponses.Unauthorised);
  }
};

export default apiAuthMiddleware;
