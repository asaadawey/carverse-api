/* eslint-disable no-console */
import express from 'express';
import errorMiddleware from '@src/middleware/error.middleware';

import { apiAuthRoute } from '@src/middleware/apiAuth.middleware';
import routes from '@src/routes/index';

import cors from 'cors';

import { preLogmiddleware } from '@src/middleware/log.middleware';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import envVars, { isTest } from '@src/config/environment';

import os from 'os';
import { doubleCsrfProtection, getCsrfRoute } from './middleware/csrf.middleware';

import mobileCookieInjector from './middleware/mobileCookieInjector.middleware';

import prismaInjectorMiddleware from './middleware/prismaInjector.middleware';
import { apiPrefix } from './constants/links';
import { createClient } from 'redis';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import corsOptions from './utils/cors';
// import Redis from 'ioredis';

const app = express();

app.use(cors(corsOptions));

if (!isTest) {
  const redisClient = createClient({
    url: `redis://${envVars.redis.username}:${envVars.redis.password}@${envVars.redis.host}:${envVars.redis.port}`,
  });

  await redisClient.connect();
  // const pubClient = new Redis({
  //   port: envVars.redis.port,
  //   host: envVars.redis.host,
  //   username: envVars.redis.username,
  //   password: envVars.redis.password,

  // });

  // // Handle connection success
  // pubClient.on('connect', () => {
  //   console.log('Connected to Redis successfully.');
  // });

  // // Handle errors
  // pubClient.on('error', (err) => {
  //   console.error('Redis connection error:', err);
  // });
  // pubClient.on('message', (channel, message) => {
  //   console.log(`Received message from Redis channel ${channel}: ${message}`);
  // });
  const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Redis store configuration
    store: new RedisStore({
      sendCommand: (...args: any): any => redisClient.sendCommand(args),
    }),
    message: {
      error: true,
    },
  });
  app.use(limiter);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(cookieParser(envVars.appSecret));

app.use(preLogmiddleware);

// API Auth middleware
app.use(apiAuthRoute);

app.get('/health', ({}, res) => {
  console.log('Health');

  res.json({
    status: 200,
    message: 'OK',
    hostname: os.hostname(),
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

// app.use('/icons', [express.static(path.join(process.cwd(), 'public', 'icons'))]);

app.use(prismaInjectorMiddleware);

app.use(apiPrefix, routes);

app.use(errorMiddleware);

export default app;
