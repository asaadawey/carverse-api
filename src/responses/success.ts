import { NextFunction, Request, Response } from 'express';
import { HTTPResponses } from 'interfaces/enums';

const createSuccessResponse = (
  req: Request,
  res: Response,
  body: any,
  next: NextFunction,
  status: HTTPResponses = HTTPResponses.Success,
) => {
  console.log(`[POST-LOG] SUCCESS [${status}] ${JSON.stringify(body)}`);
  if (req.updatedToken) {
    try {
      res.set('updated-token', req.updatedToken);
      req.updatedToken = '';
    } catch (e) {
      console.log({ e });
    }
  }
  res.status(status).json(body);
  next();
};

export default createSuccessResponse;
