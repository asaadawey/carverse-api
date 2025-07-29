import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import chalk from 'chalk'; // Reverted to ES Module import
import envVars, { isDev, isTest } from '@src/config/environment';

// Environment helpers

const isProduction = envVars.mode === 'production';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(logColors);

// Custom format for console logging with colors and emojis
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;

    // Add emojis for different log levels
    const emoji =
      {
        error: '❌',
        warn: '⚠️ ',
        info: '📋',
        http: '🌐',
        debug: '🔍',
      }[level.replace(/\u001b\[[0-9;]*m/g, '')] || '📝';

    // Format additional metadata
    const metaString = Object.keys(args).length ? `\n${chalk.gray('Metadata:')} ${JSON.stringify(args, null, 2)}` : '';

    return `${emoji} ${chalk.gray(`[${timestamp}]`)} ${level}: ${message}${metaString}`;
  }),
);

// Format for file logging (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Create daily rotating file transport for different log levels
const createRotatingFileTransport = (level: string, filename: string) => {
  return new DailyRotateFile({
    level,
    filename: `logs/${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: fileFormat,
  });
};

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled except in test)
if (!isTest) {
  transports.push(
    new winston.transports.Console({
      level: isDev ? 'debug' : 'info',
      format: consoleFormat,
    }),
  );
}

// File transports (enabled in all environments except test)
if (!isTest) {
  // All logs
  transports.push(createRotatingFileTransport('debug', 'application'));

  // Error logs only
  transports.push(createRotatingFileTransport('error', 'error'));

  // HTTP logs only
  transports.push(createRotatingFileTransport('http', 'http'));

  // Info and above for production monitoring
  if (isProduction) {
    transports.push(createRotatingFileTransport('info', 'production'));
  }
}

// Create the logger instance
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: logLevels,
  format: fileFormat,
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: !isTest
    ? [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
        new winston.transports.Console({ format: consoleFormat }),
      ]
    : [],
  rejectionHandlers: !isTest
    ? [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
        new winston.transports.Console({ format: consoleFormat }),
      ]
    : [],
  exitOnError: false,
});

// Enhanced logger interface with additional methods
interface EnhancedLogger extends winston.Logger {
  request: (message: string, meta?: any) => void;
  response: (message: string, meta?: any) => void;
  database: (message: string, meta?: any) => void;
  auth: (message: string, meta?: any) => void;
  payment: (message: string, meta?: any) => void;
  websocket: (message: string, meta?: any) => void;
  performance: (message: string, meta?: any) => void;
  security: (message: string, meta?: any) => void;
}

// Extend logger with custom methods
const enhancedLogger = logger as EnhancedLogger;

// Add custom logging methods
enhancedLogger.request = (message: string, meta?: any) => {
  logger.http(`[REQUEST] ${message}`, meta);
};

enhancedLogger.response = (message: string, meta?: any) => {
  logger.http(`[RESPONSE] ${message}`, meta);
};

enhancedLogger.database = (message: string, meta?: any) => {
  logger.debug(`[DATABASE] ${message}`, meta);
};

enhancedLogger.auth = (message: string, meta?: any) => {
  logger.info(`[AUTH] ${message}`, meta);
};

enhancedLogger.payment = (message: string, meta?: any) => {
  logger.info(`[PAYMENT] ${message}`, meta);
};

enhancedLogger.websocket = (message: string, meta?: any) => {
  logger.debug(`[WEBSOCKET] ${message}`, meta);
};

enhancedLogger.performance = (message: string, meta?: any) => {
  logger.info(`[PERFORMANCE] ${message}`, meta);
};

enhancedLogger.security = (message: string, meta?: any) => {
  logger.warn(`[SECURITY] ${message}`, meta);
};

// Utility functions for common logging patterns
export const loggerUtils = {
  // Log API request start
  logRequestStart: (req: any) => {
    const { method, url, ip, headers } = req;
    const reqId = headers['req_id'] || 'unknown';

    enhancedLogger.request(`${method} ${url}`, {
      reqId,
      ip,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
  },

  // Log API request end
  logRequestEnd: (req: any, res: any, responseTime: number, responseData?: any) => {
    const { method, url } = req;
    const { statusCode } = res;
    const reqId = req.headers['req_id'] || 'unknown';

    const level = statusCode >= 400 ? 'error' : 'info';
    const message = `${method} ${url} - ${statusCode} (${responseTime}ms)`;

    enhancedLogger.log(level, `[RESPONSE] ${message}`, {
      reqId,
      statusCode,
      responseTime,
      response: responseData,
      timestamp: new Date().toISOString(),
    });
  },

  // Log database operations
  logDatabaseOperation: (operation: string, table: string, duration?: number, meta?: any) => {
    enhancedLogger.database(`${operation} on ${table}`, {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
      ...meta,
    });
  },

  // Log authentication events
  logAuthEvent: (event: string, userId?: number, success: boolean = true, meta?: any) => {
    const level = success ? 'info' : 'warn';
    enhancedLogger.log(level, `[AUTH] ${event}`, {
      event,
      userId,
      success,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log payment events
  logPaymentEvent: (event: string, amount?: number, currency?: string, meta?: any) => {
    enhancedLogger.payment(event, {
      event,
      amount,
      currency,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log errors with context
  logError: (error: Error, context?: string, meta?: any) => {
    enhancedLogger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
      },
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log performance metrics
  logPerformance: (operation: string, duration: number, meta?: any) => {
    const level = duration > 1000 ? 'warn' : 'info'; // Warn if operation takes more than 1 second
    enhancedLogger.log(level, `[PERFORMANCE] ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },

  // Log security events
  logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high', meta?: any) => {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    enhancedLogger.log(level, `[SECURITY] ${event}`, {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },
};

// Stream interface for morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    enhancedLogger.http(message.trim());
  },
};

// Application startup logger
export const logStartup = () => {
  enhancedLogger.info('🚀 Car Wash API Starting Up', {
    environment: envVars.mode,
    port: envVars.port,
    baseUrl: envVars.baseUrl,
    timestamp: new Date().toISOString(),
  });
};

// Application shutdown logger
export const logShutdown = (signal?: string) => {
  enhancedLogger.info(`🛑 Car Wash API Shutting Down ${signal ? `(${signal})` : ''}`, {
    signal,
    timestamp: new Date().toISOString(),
  });
};

// Export the enhanced logger as default
export default enhancedLogger;
