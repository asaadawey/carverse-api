/* eslint-disable no-console */
import express from 'express';
import errorMiddleware from 'src/middleware/error.middleware';

import { apiAuthRoute } from 'src/middleware/apiAuth.middleware';
import routes from 'src/routes/index';

import io from 'src/web-socket/index';

import path from 'path';

import { preLogmiddleware } from 'src/middleware/log.middleware';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import envVars, { isTest } from 'src/config/environment';

import os from 'os';
import { doubleCsrfProtection, getCsrfRoute } from './middleware/csrf.middleware';
import mobileCookieInjector from './middleware/mobileCookieInjector.middleware';

const app = express();



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(cookieParser(envVars.appSecret))

app.use(preLogmiddleware);

app.get('/health', ({ }, res) => {
  console.log("Health")
  return res.json({ status: 200, message: "OK", hostname: os.hostname(), version: process.env['HEROKU_RELEASE_VERSION'] })
})

// Csrf
app.use(mobileCookieInjector);

if (!isTest)
  app.use(doubleCsrfProtection);

app.get('/cvapi-csrf', getCsrfRoute);


// API Auth middleware
app.use(apiAuthRoute);

// Inject websocket
app.use(({ }, res, next) => {
  //@ts-ignore
  res.io = io;
  next();
});


app.use('/icons', [express.static(path.join(process.cwd(), 'public', 'icons'))]);

app.use(routes);

app.use(errorMiddleware);


export default app;
