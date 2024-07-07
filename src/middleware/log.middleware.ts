import { RequestHandler } from 'express';
import { v4 as uuid4 } from 'uuid';
export const preLogmiddleware: RequestHandler<any, any, any, any> = (req, res, next) => {
  if (!req.headers["req_id"] && !res.headersSent)
    req.headers["req_id"] = `AG_${uuid4()}`

  console.log(
    `[PRE-LOG] [${req.method}] ${req.url} ${JSON.stringify({
      date: new Date().toLocaleTimeString(),
      body: req.body,
      req_id: req.headers["req_id"]
      // ip: req.ip,
    })} \n`,
  );

  next();
};
