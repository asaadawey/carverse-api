/* eslint-disable no-console */
import express from 'express';
import errorMiddleware from 'src/middleware/error.middleware';

import { apiAuthRoute } from 'src/middleware/apiAuth.middleware';
import routes from 'src/routes/index';

import cors from 'cors';

import { preLogmiddleware } from 'src/middleware/log.middleware';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import envVars, { isTest } from 'src/config/environment';

import os from 'os';
import { doubleCsrfProtection, getCsrfRoute } from './middleware/csrf.middleware';

import mobileCookieInjector from './middleware/mobileCookieInjector.middleware';

import prismaInjectorMiddleware from './middleware/prismaInjector.middleware';

import { apiPrefix } from './constants/links';

import { createClient } from 'redis';
import RedisStore from 'rate-limit-redis';
import rateLimit from 'express-rate-limit';

async function getApp(): Promise<any> {
  const app = express();

  if (!isTest) {
    const redisClient = createClient({
      url: 'redis://:38pXBAY7Pr7S0U642UxbYSZJkac4VxAy@redis-12880.c90.us-east-1-3.ec2.redns.redis-cloud.com:12880'
    });

    await redisClient.connect();

    // Create and use the rate limiter
    const limiter = rateLimit({
      // Rate limiter configuration
      windowMs: 4 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers

      // Redis store configuration
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      }),
      message: {
        error: true
      }
    })
    app.use(limiter)
  }

  app.use(cors({
    origin:
      [
        "http://localhost:5173",
        "https://localhost:5173",
        "https://web.carverse.me",
        "https://api.carverse.me",
      ],
    credentials: true, exposedHeaders: ["set-cookie"],
  }))

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(helmet());
  app.use(cookieParser(envVars.appSecret))

  app.use(preLogmiddleware);

  // API Auth middleware
  app.use(apiAuthRoute);

  app.get('/health', ({ }, res) => {
    console.log("Health")

    return res.json({
      status: 200, message: "OK", hostname: os.hostname(),
      ...envVars.appServer
    })
  })

  // Csrf
  app.use(mobileCookieInjector);

  if (!isTest)
    app.use(doubleCsrfProtection);

  app.get('/cvapi-csrf', getCsrfRoute);

  // // Inject websocket
  // app.use(({ }, res, next) => {
  //   //@ts-ignore
  //   res.io = io;
  //   next();
  // });


  // app.use('/icons', [express.static(path.join(process.cwd(), 'public', 'icons'))]);

  app.use(prismaInjectorMiddleware)

  app.use(apiPrefix, routes);

  app.use(errorMiddleware);

  return app;
}



export default getApp;
