import { Request, Response, NextFunction } from 'express';
import logger, { loggerUtils } from '@src/utils/logger';

// Extended request interface to include enhanced logger
declare global {
  namespace Express {
    interface Request {
      logger: {
        info: (message: string, meta?: any) => void;
        error: (error: Error, context?: string, meta?: any) => void;
        warn: (message: string, meta?: any) => void;
        debug: (message: string, meta?: any) => void;
      };
    }
  }
}

/**
 * Middleware that injects an enhanced logger into the request object.
 * The logger automatically includes:
 * - Request body for POST/PUT/PATCH requests
 * - Request ID from headers
 * - Request method and URL
 */
export const loggerInjectorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['req_id'] as string) || 'unknown';
  const method = req.method;
  const url = req.url;

  // Common metadata that will be included in all logs
  const baseMetadata = {
    reqId,
    method,
    url,
    timestamp: new Date().toISOString(),
  };

  // For mutating HTTP methods, include the request body
  const shouldIncludeBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
  if (shouldIncludeBody && req.body) {
    baseMetadata['body'] = req.body;
  }

  // Create enhanced logger methods that automatically include base metadata
  req.logger = {
    info: (message: string, meta: any = {}) => {
      logger.info(message, { ...baseMetadata, ...meta });
    },

    error: (error: Error, context?: string, meta: any = {}) => {
      logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
        error: {
          name: error.name,
          message: error.message,
        },
        stack: error.stack,
        context,
        ...baseMetadata,
        ...meta,
      });
    },

    warn: (message: string, meta: any = {}) => {
      logger.warn(message, { ...baseMetadata, ...meta });
    },

    debug: (message: string, meta: any = {}) => {
      logger.debug(message, { ...baseMetadata, ...meta });
    },
  };

  next();
};

export default loggerInjectorMiddleware;
