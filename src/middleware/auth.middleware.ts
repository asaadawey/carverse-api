//@ts-nocheck
import { RequestHandler } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import { HttpException } from 'errors';
import envVars from 'config/environment';
import { tokens } from 'interfaces/token.types';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import { createFailResponse } from 'responses';
import { generateToken } from 'utils/token';
import { decrypt } from 'utils/encrypt';

const authMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  const auth = req.header(envVars.auth.authKey.toLowerCase());
  try {
    if (!auth)
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token exist but not active',
      );

    // For testing
    if ((envVars.mode === 'development' || envVars.mode === 'test') && envVars.auth.skipAuth === 'true') {
      req.userId = Number(req.headers['userid']);
      next();
      return;
    }

    const token = verify(auth, envVars.appSecret) as JwtPayload;

    //No token
    if (!token)
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'No token provided');

    //Token name is incorrect
    if (token.name !== tokens.name)
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token exist and active but not name doesnt match ' + tokens.name,
      );

    //No token id or user id
    if (!token.id)
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'No user id found');

    var dateNow = new Date();

    //Token is expired and the user didn't tick keepLoggedIn checkbox
    if ((token.exp as unknown as number) < dateNow.getTime() && !token.keepLoggedIn)
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token expired and keep logged in param is empty' + JSON.stringify(token),
      );

    //Token have been allowed for another client
    if (decrypt(token.authorisedEncryptedClient || '') !== decrypt(req.header(envVars.allowedClient.key || '') || ''))
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Allowed Client is not right',
      );

    if ((token.exp as unknown as number) < dateNow.getTime() && token.keepLoggedIn) {
      const updatedToken = generateToken({ ...(token as any) });
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
