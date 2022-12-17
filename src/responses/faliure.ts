import { NextFunction, Request, Response } from 'express';

const createFailResponse = (
  req: Request,
  res: Response,
  error: any,
  next: NextFunction,
  message = '',
  additionalPramater = null,
  status = 409,
) => {
  console.error(
    `POST-LOG [${status}] [RESPONSE-FUNC] [${req.method}] ${req.url} ${JSON.stringify(error)} ${
      additionalPramater || error?.additionalPramater || ''
    }`,
  );

  if (error) {
    if (message) error.message = message;
    next(error);
  } else {
    next();
  }
};

export default createFailResponse;
