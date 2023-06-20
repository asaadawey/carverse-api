import envVars from 'config/environment';
import { HttpException } from 'errors';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';

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

export default apiAuthMiddleware;
