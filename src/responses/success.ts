import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from 'src/interfaces/enums';

const createSuccessResponse = <T>(
  req: Request | any,
  res: Response<T>,
  body: T,
  next: NextFunction,
  status: HTTPResponses = HTTPResponses.Success,
) => {
  console.log(`[POST-LOG] SUCCESS [${status}] ${JSON.stringify({ body, req_id: req.headers["req_id"] })}\n`);
  if (!res.headersSent)
    res.setHeader("req_id", req.header('req_id') || "")
  res.status(status).json(body);
  next();
};

export default createSuccessResponse;
