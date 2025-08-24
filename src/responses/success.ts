import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from '@src/interfaces/enums';
import logger from '@src/utils/logger';

const createSuccessResponse = <T>(
  req: Request | any,
  res: Response<T>,
  data: T,
  next: NextFunction,
  status: HTTPResponses = HTTPResponses.Success,
) => {
  const requestId = req.headers['req_id'] || req.header('req_id') || '';

  // Log success response with appropriate level
  // logger.info('Success response sent', {
  //   ip: req.ip,
  //   status,
  //   requestId,
  //   route: req.route?.path,
  //   method: req.method,
  //   hasData: !!data,
  //   data,
  // });

  if (!res.headersSent) res.setHeader('req_id', requestId);

  res.status(status).json({ data, status, requestId } as any);
  next();
};

export default createSuccessResponse;
