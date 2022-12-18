import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from 'interfaces/enums';

const createSuccessResponse = (
  req: Request,
  res: Response,
  body: any,
  next: NextFunction,
  status: HTTPResponses = 200,
) => {
  res.status(status).json(body);
  next();
};

export default createSuccessResponse;
