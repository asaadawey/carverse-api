//@ts-nocheck
import { verify } from 'jsonwebtoken';
import { HttpException } from 'src/errors';
import envVars, { isDev, isTest } from 'src/config/environment';
import { Token, tokens } from 'src/interfaces/token.types';
import { HTTPErrorString, HTTPResponses } from 'src/interfaces/enums';
import { decrypt } from 'src/utils/encrypt';
import { RequestHandler } from 'express';
import { createFailResponse } from 'src/responses';

let declinedTokens = [];

const authMiddleware = async (auth: string, allowedClient: string): Token /**User id */ => {
  if (!auth)
    throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'Token header not exists');

  if (declinedTokens.includes(auth))
    throw new HttpException(
      HTTPResponses.Unauthorised,
      HTTPErrorString.UnauthorisedToken,
      'Token already expired token' + auth,
    );

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
      const additionalUserParams = JSON.parse(req.headers["extrauser"] || "{}");
      req.user = { id: Number(req.headers['userid']), ...additionalUserParams }
    } else {
      req.user = await authMiddleware(
        req.headers[envVars.auth.authKey] as string,
        req.headers[envVars.allowedClient.key] as string,
      );

      // req.providerId = Number(req.headers['providerId']) || -1;
    }

    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next, HTTPResponses.Unauthorised, error.message, error.additionalPramater, HTTPResponses.Unauthorised);
  }
}

export default authMiddleware;
