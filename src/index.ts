/* eslint-disable no-console */
import express from 'express';
import errorMiddleware from 'src/middleware/error.middleware';

import apiAuthMiddleware from 'src/middleware/apiAuth.middleware';
import routes from 'src/routes/index';

import io from 'src/web-socket/index';

import path from 'path';

import { preLogmiddleware } from 'src/middleware/log.middleware';
import helmet from 'helmet';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

import envVars from 'src/config/environment';
import { createFailResponse } from 'src/responses';
import { HTTPResponses } from 'src/interfaces/enums';

import os from 'os';

const app = express();

const csrfProtection = csrf({ cookie: true })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(cookieParser())
app.use(csrfProtection);

app.get('/health', ({ }, res) => {
  console.log("Health")
  return res.json({ status: 200, message: "OK", hostname: os.hostname(), version: process.env['HEROKU_RELEASE_VERSION'] })
})

// API Auth middleware
app.use((req, res, next) => {
  try {
    apiAuthMiddleware(req.headers[envVars.auth.apiKey.toLowerCase()] as string);
    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next, HTTPResponses.Unauthorised);
  }
});

// Inject websocket
app.use(({ }, res, next) => {
  //@ts-ignore
  res.io = io;
  next();
});

app.use(preLogmiddleware);

app.use('/icons', [express.static(path.join(process.cwd(), 'public', 'icons'))]);

app.use(routes);

app.use(errorMiddleware);


export default app;
