import { RequestHandler } from 'express';

export const preLogmiddleware: RequestHandler<any, any, any, any> = (req, res, next) => {
  console.log(`PRE-LOG [${req.method}] ${req.url}`);
  console.log({
    body: req.body,
    headers: req.headers,
    ip: req.ip,
  });
  next();
};
