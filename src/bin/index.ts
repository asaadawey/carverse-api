import http from 'http';

import envVars from '@src/config/environment';
import logger, { logStartup, logShutdown } from '@src/utils/logger';

import app from '../index';

import io from '@src/web-socket/index';

const server = http.createServer(app);

io.listen(server);

server.listen(envVars.port, () => {
  logStartup();
  logger.info(`🌐 Server listening on port ${envVars.port}`, {
    port: envVars.port,
    startTime: new Date().toISOString(),
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Server will shutdown', {
    error: {
      name: error.name,
      message: error.message,
    },
    stack: error.stack,
  });
  logShutdown('UNCAUGHT_EXCEPTION');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection - Server will shutdown', {
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : error,
    stack: error instanceof Error ? error.stack : undefined,
  });
  logShutdown('UNHANDLED_REJECTION');
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  logShutdown('SIGTERM');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  logShutdown('SIGINT');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
