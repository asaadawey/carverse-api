import { RequestHandler } from 'express';
import { decode, JwtPayload, verify } from 'jsonwebtoken';
import { HttpException } from 'errors';
import envVars from 'config/environment';
import { tokens } from 'interfaces/token.types';

const authMiddleware: RequestHandler<any, any, any, any> = async (req, res, next) => {
  const auth = req.headers.authorization;
  try {
    if (auth) {
      if ((envVars.mode === 'development' || envVars.mode === 'test') && envVars.auth.skipAuth) {
        req.userId = Number(req.headers['userid']);
        next();
        return;
      }
      const token = verify(auth, envVars.appSecret) as JwtPayload;

      if (token) {
        if (token.name === tokens.name) {
          var decodedToken = decode(auth, { complete: true }) as any;
          var dateNow = new Date();

          if (decodedToken.exp < dateNow.getTime()) throw new HttpException(401, 'Not authorised', 'Token expired');
          //Inject user id
          req.userId = token.id;
          next();
        } else
          throw new HttpException(
            401,
            'Not authorised',
            'Token exist and active but not name doesnt match ' + tokens.name,
          );
      } else throw new HttpException(401, 'Not authorised', 'Token exist but not active');
    } else throw new HttpException(401, 'Not authorised', 'No token provided');
  } catch (error: any) {
    next(error);
  }
};

export default authMiddleware;
