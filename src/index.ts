/* eslint-disable no-console */
import express from 'express';
import errorMiddleware from '@src/middleware/error.middleware';

import { apiAuthRoute } from '@src/middleware/apiAuth.middleware';
import routes from '@src/routes/index';

import cors from 'cors';

import { preLogMiddleware, postLogMiddleware, errorLogMiddleware } from '@src/middleware/log.middleware.enhanced';
import loggerInjectorMiddleware from '@src/middleware/loggerInjector.middleware';
import localizationMiddleware from '@src/middleware/localization.middleware';
import { securityHeaders, rateLimitHeaders, apiVersionHeaders } from '@src/middleware/security.middleware';
import logger, { logStartup, logShutdown } from '@src/utils/logger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import envVars, { isTest } from '@src/config/environment';

import os from 'os';
import { doubleCsrfProtection, getCsrfRoute } from './middleware/csrf.middleware';

import mobileCookieInjector from './middleware/mobileCookieInjector.middleware';

import prismaInjectorMiddleware from './middleware/prismaInjector.middleware';
import { apiPrefix } from './constants/links';
import { getRedisClient, closeRedisConnections, checkRedisHealth } from '@src/utils/redis';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import corsOptions from './utils/cors';
import { setupSwagger } from './config/swagger';
import path from 'path';

const app = express();

app.use(cors(corsOptions));

if (!isTest) {
  // Initialize Redis client and rate limiting
  (async () => {
    try {
      const redisClient = await getRedisClient();

      if (redisClient) {
        const limiter = rateLimit({
          windowMs: 2 * 60 * 1000, // 2 minutes
          max: 100, // Limit each IP to 100 requests per window
          standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
          legacyHeaders: false, // Disable the `X-RateLimit-*` headers
          // Redis store configuration
          store: new RedisStore({
            sendCommand: (...args: any): any => redisClient.sendCommand(args),
          }),
          message: {
            error: true,
            message: 'Too many requests from this IP, please try again later.',
          },
        });
        app.use(limiter);
        console.log('[APP] Rate limiting with Redis initialized');
      } else {
        console.log('[APP] Rate limiting disabled - Redis not available');
      }
    } catch (error: any) {
      console.error('[APP] Failed to initialize Redis rate limiting:', error.message);
    }
  })();
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject enhanced logger into request object
app.use(loggerInjectorMiddleware);

app.use(helmet());
app.use(cookieParser(envVars.appSecret));

// Security middleware - must be early in the middleware stack
app.use(securityHeaders);
app.use(rateLimitHeaders);
app.use(apiVersionHeaders);

// Enhanced logging middleware
app.use(preLogMiddleware);

// API Auth middleware
app.use(apiAuthRoute);

app.get('/health', async ({}, res) => {
  logger.info('Health check endpoint accessed');

  const redisHealth = await checkRedisHealth();

  res.json({
    status: 200,
    message: 'OK',
    hostname: os.hostname(),
    redis: redisHealth,
    ...envVars.appServer,
  });
});

// Csrf
app.use(mobileCookieInjector);

if (!isTest) app.use(doubleCsrfProtection);

app.get('/cvapi-csrf', getCsrfRoute);

// // Inject websocket
// app.use(({ }, res, next) => {
//   //@ts-ignore
//   res.io = io;
//   next();
// });

app.use('/icons', [express.static(path.join(process.cwd(), 'public', 'icons'))]);

app.use(prismaInjectorMiddleware);

// Add localization middleware early in the chain
app.use(localizationMiddleware);

// Setup Swagger documentation
if (!isTest) {
  setupSwagger(app);

  // Serve swagger.json file directly
  /**
   * @swagger
   * /swagger.json:
   *   get:
   *     summary: Get OpenAPI specification
   *     description: Download the complete OpenAPI 3.0 specification as JSON
   *     tags: [System]
   *     responses:
   *       200:
   *         description: OpenAPI specification
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               description: Complete OpenAPI 3.0 specification
   */
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile('swagger.json', { root: './public' });
  });
}

app.use(apiPrefix, routes);

// Post-log middleware to capture response details
app.use(postLogMiddleware);

// Enhanced error logging
app.use(errorLogMiddleware);

app.use(errorMiddleware);

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await closeRedisConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await closeRedisConnections();
  process.exit(0);
});

export default app;
