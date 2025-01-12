import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from '@src/interfaces/enums';

const createSuccessResponse = <T>(
  req: Request | any,
  res: Response<T>,
  data: T,
  next: NextFunction,
  status: HTTPResponses = HTTPResponses.Success,
) => {
  const requestId = req.headers['req_id'] || req.header('req_id') || '';
  console.log(`[POST-LOG] SUCCESS [IP : ${req.ip}] [${status}] ${JSON.stringify({ data, requestId })}\n`);
  if (!res.headersSent) res.setHeader('req_id', requestId);

  res.status(status).json({ data, status, requestId } as any);
  next();
};

export default createSuccessResponse;
