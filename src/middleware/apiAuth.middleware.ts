import { RequestHandler } from 'express';
import envVars from 'config/environment';
import { createFailResponse } from 'responses';
import { HttpException } from 'errors';

const apiAuthMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  try {
    const gapi = req.header(envVars.auth.apiKey.toLowerCase());
    if (gapi !== envVars.auth.apiValue) {
      throw new HttpException(401, 'Unauthorised');
    }
    next();
  } catch (err) {
    createFailResponse(req, res, err, next);
  }
};

export default apiAuthMiddleware;
