import { RequestHandler } from 'express';
import { decode, JwtPayload, verify } from 'jsonwebtoken';
import { HttpException } from 'errors';
import envVars from 'config/environment';
import { tokens } from 'interfaces/token.types';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import { createFailResponse } from 'responses';
import { generateToken } from 'utils/token';

const authMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  const auth = req.header(envVars.auth.authKey.toLowerCase());
  try {
    if (!auth)
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token exist but not active',
      );

    if ((envVars.mode === 'development' || envVars.mode === 'test') && envVars.auth.skipAuth) {
      req.userId = Number(req.headers['userid']);
      next();
      return;
    }

    const token = verify(auth, envVars.appSecret) as JwtPayload;

    if (!token)
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'No token provided');

    if (token.name !== tokens.name)
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token exist and active but not name doesnt match ' + tokens.name,
      );

    if (!token.id)
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'No user id found');

    var decodedToken = decode(auth, { complete: true }) as any;
    var dateNow = new Date();

    if (decodedToken.exp < dateNow.getTime() && !decodedToken.keepLoggedIn)
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token expired and keep logged in param is empty' + JSON.stringify(decodedToken),
      );

    if (decodedToken.exp < dateNow.getTime() && decodedToken.keepLoggedIn) {
      const updatedToken = generateToken({ ...decodedToken });
      req.updatedToken = updatedToken;
    }

    //Inject user id
    req.userId = token.id;

    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

export default authMiddleware;
