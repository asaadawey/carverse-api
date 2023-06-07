//@ts-nocheck
import { RequestHandler } from 'express';
import { verify } from 'jsonwebtoken';
import { HttpException } from 'errors';
import envVars from 'config/environment';
import { Token, tokens } from 'interfaces/token.types';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import { createFailResponse } from 'responses';
import { decrypt } from 'utils/encrypt';

let declinedTokens = [];

const authMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  // If headers already sent then no need for auth
  if (res.headersSent) {
    next();
    return;
  }
  const auth = req.header(envVars.auth.authKey.toLowerCase());
  try {
    if (!auth)
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'Token header not exists');

    if (declinedTokens.includes(auth))
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token already expired token' + auth,
      );

    // For testing
    if ((envVars.mode === 'development' || envVars.mode === 'test') && envVars.auth.skipAuth === 'true') {
      req.userId = Number(req.headers['userid']);
      next();
      return;
    }

    const token = verify(auth, envVars.appSecret, { ignoreExpiration: true }) as Token;

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

    var timeNow = new Date().getTime();

    //Token is expired and the user didn't tick keepLoggedIn checkbox
    if (((token.exp * 1000) as unknown as number) < timeNow)
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token expired ' + JSON.stringify(token),
      );

    //Token have been allowed for another client
    if (decrypt(token.authorisedEncryptedClient || '') !== decrypt(req.header(envVars.allowedClient.key || '') || ''))
      throw new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Allowed Client is not right',
      );

    //Inject user id
    req.userId = token.id;

    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

export default authMiddleware;
