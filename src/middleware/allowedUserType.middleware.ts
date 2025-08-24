import { Request, RequestHandler } from 'express';
import { HTTPErrorString, HTTPResponses, UserTypes } from '@src/interfaces/enums';
import { createFailResponse } from '@src/responses/index';
import { HttpException } from '@src/errors/index';

export const getUserType = (req: Request): UserTypes | undefined => {
  console.log('User Type:', req.user);
  return req.user.userType as UserTypes;
};

export default (allowed: UserTypes[]): RequestHandler =>
  (req, res, next) => {
    try {
      const result = allowed.some((allowed) => allowed === getUserType(req));
      if (!result)
        throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, 'Not allowed user type');

      next();
    } catch (error: any) {
      createFailResponse(req, res, error, next, HTTPResponses.Unauthorised);
    }
  };
