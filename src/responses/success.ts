import { NextFunction, Request, Response } from 'express';

const createSuccessResponse = (req: Request, res: Response, body: any, next: NextFunction, status = 200) => {
  res.status(status).json(body);
  next();
};

export default createSuccessResponse;
