import { RequestHandler } from 'express';
import envVars from 'config/environment';
import { createFailResponse } from 'responses';
import { HttpException } from 'errors';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';

const apiAuthMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  try {
    const gapi = req.header(envVars.auth.apiKey.toLowerCase());
    if (gapi !== envVars.auth.apiValue) {
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, 'GAPI Key not found');
    }
    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

export default apiAuthMiddleware;
