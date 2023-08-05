import { RequestHandler } from 'express';

export const preLogmiddleware: RequestHandler<any, any, any, any> = (req, res, next) => {
  console.log(
    `[PRE-LOG] [${req.method}] ${req.url} ${JSON.stringify({
      date: new Date().toLocaleTimeString(),
      body: req.body,
      // headers: req.headers,
      // ip: req.ip,
    })}`,
  );

  next();
};
