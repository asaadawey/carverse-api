import { RequestHandler } from 'express';
import { v4 as uuid4 } from 'uuid';
import logger, { loggerUtils } from '@src/utils/logger';

// Legacy middleware with enhanced logging
export const preLogmiddleware: RequestHandler<any, any, any, any> = (req, res, next) => {
  if (!req.headers['req_id'] && !res.headersSent) {
    req.headers['req_id'] = `CW_${uuid4()}`;
  }

  // Use the new logger instead of console.log
  loggerUtils.logRequestStart(req);

  next();
};

// Re-export for backward compatibility
export default { preLogmiddleware };
