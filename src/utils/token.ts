import { tokens, Token } from 'interfaces/token.types';
import { sign } from 'jsonwebtoken';

type SignToken = Omit<Token, 'previousExpiredTokens'> & { previousExpiredTokens: string };

export const generateToken = (payload: Omit<Token, 'timestamp' | 'name'>): string => {
  const token = sign(
    {
      id: payload.id,
      customerId: payload.customerId,
      keepLoggedIn: payload.keepLoggedIn,
      providerId: payload.providerId,
      name: tokens.name,
      timestamp: new Date(),
      authorisedEncryptedClient: payload.authorisedEncryptedClient,
    } as SignToken,
    tokens.secret,
    { expiresIn: (payload.exp as string) || tokens.expiry },
  );

  return token;
};
