import { tokens, Token } from 'src/interfaces/token.types';
import { sign } from 'jsonwebtoken';
import envVars from 'src/config/environment';

type SignToken = Omit<Token, 'previousExpiredTokens'> & { previousExpiredTokens: string };

export const generateToken = (payload: Omit<Token, 'timestamp' | 'name' | 'applicationVersion'>): string => {
  const token = sign(
    {
      id: payload.id,
      customerId: payload.customerId,
      keepLoggedIn: payload.keepLoggedIn,
      providerId: payload.providerId,
      name: tokens.name,
      timestamp: new Date(),
      authorisedEncryptedClient: payload.authorisedEncryptedClient,
      applicationVersion: envVars.version
    } as SignToken,
    tokens.secret,
    { expiresIn: (payload.exp as string) || tokens.expiry },
  );

  return token;
};
