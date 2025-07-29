import { RequestHandler, Request, Response, NextFunction } from 'express';
import { v4 as uuid4 } from 'uuid';
import logger, { loggerUtils } from '@src/utils/logger';

// Performance tracking interface with response data
interface RequestWithTiming extends Request {
  startTime?: number;
  reqId?: string;
  responseData?: any;
}

// Enhanced response interface to capture response data
interface ResponseWithData extends Response {
  responseData?: any;
}

/**
 * Pre-log middleware - Enhanced version with comprehensive request logging
 * Tracks request start time and assigns unique request ID
 */
export const preLogMiddleware: RequestHandler = (
  req: RequestWithTiming,
  res: ResponseWithData,
  next: NextFunction,
): void => {
  // Generate unique request ID if not exists
  if (!req.headers['req_id'] && !res.headersSent) {
    req.headers['req_id'] = `CW_${uuid4()}`;
  }

  // Store request ID for easy access
  req.reqId = req.headers['req_id'] as string;

  // Track request start time for performance monitoring
  req.startTime = Date.now();

  // Override res.json to capture response data
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    res.responseData = body;
    return originalJson(body);
  };

  // Override res.send to capture response data for non-JSON responses
  const originalSend = res.send.bind(res);
  res.send = function (body: any) {
    if (!res.responseData) {
      try {
        // Try to parse as JSON if it's a string
        res.responseData = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        // If not JSON, store as is but truncate if too long
        res.responseData = typeof body === 'string' && body.length > 1000 ? `${body.substring(0, 1000)}...` : body;
      }
    }
    return originalSend(body);
  };

  // Log request start with enhanced details
  loggerUtils.logRequestStart(req);

  // Log sensitive security events
  if (req.path.includes('login') || req.path.includes('auth')) {
    loggerUtils.logSecurityEvent('Authentication attempt', 'medium', {
      reqId: req.reqId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
  }

  next();
};

/**
 * Post-log middleware - Enhanced version with response logging and performance tracking
 * Should be added after route handlers to capture response data
 */
export const postLogMiddleware: RequestHandler = (
  req: RequestWithTiming,
  res: ResponseWithData,
  next: NextFunction,
): void => {
  // Calculate response time
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;

  // Get response data (captured by intercepted res.json/res.send)
  const responseData = res.responseData;

  // Log response with performance metrics and response data
  loggerUtils.logRequestEnd(req, res, responseTime, responseData);

  // Log slow requests as performance warnings
  if (responseTime > 1000) {
    loggerUtils.logPerformance('Slow request detected', responseTime, {
      reqId: req.reqId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
    });
  }

  // Log security events for failed authentication
  if (res.statusCode === 401 || res.statusCode === 403) {
    loggerUtils.logSecurityEvent('Authentication/Authorization failure', 'high', {
      reqId: req.reqId,
      statusCode: res.statusCode,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });
  }

  // Log server errors
  if (res.statusCode >= 500) {
    logger.error('Server error occurred', {
      reqId: req.reqId,
      statusCode: res.statusCode,
      method: req.method,
      url: req.url,
      ip: req.ip,
      responseTime,
    });
  }

  next();
};

/**
 * Error logging middleware - Enhanced error logging with context
 */
export const errorLogMiddleware = (
  error: Error,
  req: RequestWithTiming,
  res: ResponseWithData,
  next: NextFunction,
): void => {
  // Log the error with full context
  loggerUtils.logError(error, 'Request Handler', {
    reqId: req.reqId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  next(error);
};

/**
 * Database operation logging middleware
 */
export const createDatabaseLogMiddleware = (operation: string, table: string) => {
  return (req: RequestWithTiming, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Override res.json to capture when response is sent
    const originalJson = res.json;
    res.json = function (body) {
      const duration = Date.now() - start;
      loggerUtils.logDatabaseOperation(operation, table, duration, {
        reqId: req.reqId,
        success: res.statusCode < 400,
      });
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Authentication logging middleware
 */
export const authLogMiddleware: RequestHandler = (req: RequestWithTiming, res: Response, next: NextFunction): void => {
  const originalJson = res.json;
  res.json = function (body) {
    // Log authentication success/failure
    const success = res.statusCode === 200;
    const userId = body?.data?.userInfo?.id || req.body?.userId;

    loggerUtils.logAuthEvent(success ? 'Login successful' : 'Login failed', userId, success, {
      reqId: req.reqId,
      email: req.body?.email,
      statusCode: res.statusCode,
    });

    return originalJson.call(this, body);
  };

  next();
};

/**
 * Payment logging middleware
 */
export const paymentLogMiddleware: RequestHandler = (
  req: RequestWithTiming,
  res: Response,
  next: NextFunction,
): void => {
  const originalJson = res.json;
  res.json = function (body) {
    // Log payment events
    if (req.body?.orderAmount) {
      loggerUtils.logPaymentEvent(
        'Payment processed',
        req.body.orderAmount,
        'USD', // Assuming USD, you can make this dynamic
        {
          reqId: req.reqId,
          paymentMethod: req.body.paymentMethodName,
          orderId: body?.data?.id,
          success: res.statusCode === 200,
        },
      );
    }

    return originalJson.call(this, body);
  };

  next();
};

/**
 * Legacy support - keep the old name for backward compatibility
 */
export const preLogmiddleware = preLogMiddleware;

// Export logger for direct use in other parts of the application
export { logger };

export default {
  preLogMiddleware,
  postLogMiddleware,
  errorLogMiddleware,
  authLogMiddleware,
  paymentLogMiddleware,
  createDatabaseLogMiddleware,
  // Legacy
  preLogmiddleware,
};
