import { RequestHandler } from 'express';
import envVars from '@src/config/environment';
import HttpException from '@src/errors/HttpException';
import { HTTPResponses, HTTPErrorString, HTTPErrorMessages } from '@src/interfaces/enums';

/**
 * Require super-password middleware.
 * - Header: x-super-secret-password
 * - Query:  super_secret_password
 *
 * Validates against envVars.superCachePassword or process.env.SUPER_CACHE_PASSWORD
 */
const requireSuperPasswordMiddleware: RequestHandler = (req, _res, next) => {
  // read from header or query
  const headerPassword = req.header('x-super-secret-password') as string;

  const expected = (envVars as any).superCachePassword || process.env.SUPER_CACHE_PASSWORD;

  if (!expected) {
    throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, {
      message:
        'No sufficient permissions to access this resource. Please provide the correct super password. (Not defined)',
    });
  }

  if (!headerPassword || headerPassword !== expected) {
    throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, {
      message: 'No sufficient permissions to access this resource. Please provide the correct super password.',
    });
  }

  return next();
};

export default requireSuperPasswordMiddleware;
