//@ts-nocheck
import { verify } from 'jsonwebtoken';
import { HttpException } from 'src/errors';
import envVars from 'src/config/environment';
import { Token, tokens } from 'src/interfaces/token.types';
import { HTTPErrorString, HTTPResponses } from 'src/interfaces/enums';
import { decrypt } from 'src/utils/encrypt';

let declinedTokens = [];

const authMiddleware = async (auth: string, allowedClient: string): number /**User id */ => {
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
  return Number(token.id);
};

export default authMiddleware;
