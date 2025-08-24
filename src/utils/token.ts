import { tokens, Token } from '@src/interfaces/token.types';
import jwt from 'jsonwebtoken';
import envVars from '@src/config/environment';

type SignToken = Omit<Token, 'previousExpiredTokens'> & { previousExpiredTokens: string };

export const generateToken = (payload: Omit<Token, 'timestamp' | 'name' | 'applicationVersion'>): string => {
  const tokenPayload = {
    id: payload.id,
    customerId: payload.customerId,
    keepLoggedIn: payload.keepLoggedIn,
    providerId: payload.providerId,
    name: tokens.name,
    timestamp: new Date(),
    userType: payload.userType,
    authorisedEncryptedClient: payload.authorisedEncryptedClient,
    applicationVersion: envVars.appServer.version,
    deviceFingerprint: payload.deviceFingerprint,
    userAgent: payload.userAgent,
  } as SignToken;

  // Use default expiry from tokens config and override only if payload.exp is provided and not empty
  const expiry = (payload.exp && payload.exp.toString().trim()) || tokens.expiry;

  //@ts-ignore
  const token = jwt.sign(tokenPayload, tokens.secret, { expiresIn: expiry as string });

  return token;
};
