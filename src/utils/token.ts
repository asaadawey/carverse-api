import { tokens, Token } from 'interfaces/token.types';
import { sign } from 'jsonwebtoken';

export const generateToken = (payload: Omit<Token, 'timestamp' | 'name' | 'exp'>): string => {
  const token = sign(
    {
      id: payload.id,
      customerId: payload.customerId,
      keepLoggedIn: payload.keepLoggedIn,
      providerId: payload.providerId,
      name: tokens.name,
      timestamp: new Date(),
      exp: tokens.expiry,
    } as Token,
    tokens.secret,
    { expiresIn: tokens.expiry },
  );

  return token;
};
