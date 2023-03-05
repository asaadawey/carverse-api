import { RequestHandler } from 'express';
import envVars from 'config/environment';
import { createFailResponse } from 'responses';
import { HttpException } from 'errors';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import { decrypt } from 'utils/encrypt';

const apiAuthMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  try {
    const gapi = req.header(envVars.auth.apiKey.toLowerCase());
    if (!gapi)
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, 'GAPI Key not found');
    // GAPI key should come from client encrypted
    // Decrypt the GAPI key and check if it's matching
    var decryptedGapiKey = decrypt(gapi);

    if (decryptedGapiKey !== envVars.auth.apiValue) {
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedAPI,
        'GAPI Key found but doesnt match',
      );
    }
    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

export default apiAuthMiddleware;
