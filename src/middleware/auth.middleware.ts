import jwt from 'jsonwebtoken';
import { HttpException } from '@src/errors/index';
import envVars, { isDev, isTest } from '@src/config/environment';
import { Token, tokens } from '@src/interfaces/token.types';
import { HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import { decrypt } from '@src/utils/encrypt';
import { RequestHandler } from 'express';
import { createFailResponse } from '@src/responses/index';

const authMiddleware = (auth: string, allowedClient: string): Token /**User id */ => {
  if (!auth)
    throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'Token header not exists');

  const token = jwt.verify(auth, envVars.appSecret, { ignoreExpiration: true }) as Token;

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

  // Check version of token (This is used to verify that the logged in user has generated token from latest application version)
  if (token.applicationVersion !== envVars.appServer.version)
    throw new HttpException(
      HTTPResponses.Unauthorised,
      HTTPErrorString.UnauthorisedToken,
      'Token exist and active but not version doesnt match ' + JSON.stringify({ appVersion: envVars.appServer.version, token: token.applicationVersion }),
    );

  //No token id or user id
  if (!token.id)
    throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'No user id found');

  var timeNow = new Date().getTime();

  //Token is expired and the user didn't tick keepLoggedIn checkbox
  //@ts-ignore
  if (((token.exp * 1000) as unknown as number) < timeNow)
    throw new HttpException(
      HTTPResponses.Unauthorised,
      HTTPErrorString.UnauthorisedToken,
      'Token expired ' + JSON.stringify(token),
    );

  //Token have been allowed for another client
  if (
    token.authorisedEncryptedClient &&
    allowedClient &&
    decrypt(token.authorisedEncryptedClient || '') !== decrypt(allowedClient || '')
  )
    throw new HttpException(
      HTTPResponses.Unauthorised,
      HTTPErrorString.UnauthorisedToken,
      'Allowed Client is not right',
    );

  //Inject user id
  return token
};

export const authRoute: RequestHandler = async (req, res, next) => {
  try {
    if (res.headersSent) {
      next();
      return;
    }
    // For testing
    if ((isDev || isTest) && envVars.auth.skipAuth) {
      //Explicit for userType
      const additionalUserParams = JSON.parse(req.headers["extrauser"] as string || "{}");
      req.user = { id: Number(req.headers['userid']), ...additionalUserParams }
    } else {
      req.user = authMiddleware(
        req.headers[envVars.auth.authKey] as string,
        req.headers[envVars.allowedClient.key] as string,
      );

      // req.providerId = Number(req.headers['providerId']) || -1;
    }

    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next, HTTPResponses.Unauthorised, error.message, error.additionalPramater);
  }
}

export default authMiddleware;
