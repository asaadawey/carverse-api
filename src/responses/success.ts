import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from 'src/interfaces/enums';

const createSuccessResponse = <T>(
  req: Request,
  res: Response<T>,
  body: T,
  next: NextFunction,
  status: HTTPResponses = HTTPResponses.Success,
) => {
  console.log(`[POST-LOG] SUCCESS [${status}] ${JSON.stringify(body)}`);
  res.status(status).json(body);
  next();
};

export default createSuccessResponse;
