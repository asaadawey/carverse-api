import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from 'interfaces/enums';

const createFailResponse = (
  req: Request,
  res: Response,
  error: any,
  next: NextFunction,
  status: HTTPResponses = HTTPResponses.InternalServerError,
  message = '',
  additionalPramater: any = null,
) => {
  console.error(
    `POST-LOG [${status}] [RESPONSE-FUNC] [${req.method}] ${req.url} ${JSON.stringify(error)} ${
      additionalPramater || error?.additionalPramater || ''
    }`,
  );

  if (error) {
    if (message) error.message = message;
    error.status = error.status || status;
    next(error);
  } else {
    next();
  }
};

export default createFailResponse;
