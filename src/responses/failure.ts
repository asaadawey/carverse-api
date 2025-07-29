import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from '@src/interfaces/enums';
import logger from '@src/utils/logger';

const createFailResponse = (
  req: Request | any,
  res: Response,
  error: any,
  next: NextFunction,
  status: HTTPResponses = HTTPResponses.InternalServerError,
  message = '',
  additionalPramater: any = null,
) => {
  // Log failure response with structured logging
  logger.error('Failure response sent', {
    status,
    method: req.method,
    url: req.url,
    error: error?.message || error,
    stack: error?.stack,
    additionalParameters: additionalPramater || error?.additionalPramater,
    requestId: req.headers['req_id'],
    ip: req.ip,
  });

  if (error) {
    if (message) error.message = message;
    error.status = error.status || status;
    next(error);
  } else {
    next();
  }
};

export default createFailResponse;
