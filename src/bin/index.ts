import http from 'http';

import envVars from '@src/config/environment';
import logger, { logStartup, logShutdown } from '@src/utils/logger';
import prisma from '@src/helpers/databaseHelpers/client';
import { getEmailServiceStatus, verifyEmailConnection } from '@src/services/emailService';
import { performProductionSafetyCheck, validateSensitiveConfig } from '@src/utils/productionSafetyCheck';

import app from '../index';

import io from '@src/web-socket/index';

const server = http.createServer(app);

io.listen(server);

server.listen(envVars.port, async () => {
  logStartup();

  // Perform production safety checks
  if (envVars.mode === 'production') {
    const safetyCheck = performProductionSafetyCheck();
    const sensitiveConfigValid = validateSensitiveConfig();

    if (!safetyCheck.passed || !sensitiveConfigValid) {
      logger.error('🚨 Application failed production safety checks - review configuration before deployment');
      if (safetyCheck.errors.length > 0) {
        logger.error('Critical errors found:', { errors: safetyCheck.errors });
      }
    }
  }

  logger.info(`🌐 Server listening on port ${envVars.port}`, {
    port: envVars.port,
    environment: envVars.mode,
    startTime: new Date().toISOString(),
  });

  // Verify email service connection
  const emailStatus = getEmailServiceStatus();
  if (emailStatus.otp.configured && emailStatus.support.configured) {
    const connectionOk = await verifyEmailConnection();
    logger.info('📧 Email service status', {
      configuredOtp: emailStatus.otp.configured,
      readyOtp: emailStatus.otp.ready,
      configuredSupport: emailStatus.support.configured,
      readySupport: emailStatus.support.ready,
      connectionVerified: connectionOk,
    });
  } else {
    logger.warn('📧 Email service not configured - OTPs will be logged instead');
  }

  // Start OTP cleanup job
  // startOtpCleanupJob(prisma);
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
  // process.exit(1);
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
