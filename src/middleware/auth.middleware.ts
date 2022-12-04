import { RequestHandler } from 'express';
import { decode, JwtPayload, verify } from 'jsonwebtoken';
import { APP_SECRET } from '../constants';
import { HttpException } from 'errors/HttpException';
import { tokens } from 'interfaces/token.types';

const authMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  const auth = req.headers.authorization;
  try {
    if (auth) {
      const token = verify(auth, APP_SECRET) as JwtPayload;

      if (token) {
        if (token.name === tokens.name) {
          var decodedToken = decode(auth, { complete: true }) as any;
          var dateNow = new Date();

          if (decodedToken.exp < dateNow.getTime()) throw new HttpException(401, 'Not authorised');
          next();
        } else throw new HttpException(401, 'Not authorised');
      } else throw new HttpException(401, 'Not authorised');
    } else throw new HttpException(401, 'Not authorised');
  } catch (error: any) {
    next(error);
  }
};

export default authMiddleware;
