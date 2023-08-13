/* eslint-disable no-console */
import express from 'express';
import errorMiddleware from 'src/middleware/error.middleware';

import apiAuthMiddleware from 'src/middleware/apiAuth.middleware';
import routes from 'src/routes/index';

import io from 'src/web-socket/index';

import path from 'path';

import { preLogmiddleware } from 'src/middleware/log.middleware';
import helmet from 'helmet';

import envVars from 'src/config/environment';
import { createFailResponse } from 'src/responses';
import { HTTPResponses } from 'src/interfaces/enums';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());

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
app.use(({}, res, next) => {
  //@ts-ignore
  res.io = io;
  next();
});

app.use(preLogmiddleware);

app.use('/icons', [express.static(path.join(process.cwd(), 'public', 'icons'))]);

app.use(routes);

app.use(errorMiddleware);

export default app;
