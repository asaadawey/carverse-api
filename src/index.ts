/* eslint-disable no-console */
import express from 'express';
import errorMiddleware from 'middleware/error.middleware';

import apiAuthMiddleware from 'middleware/apiAuth.middleware';
import routes from 'routes/index';

import io from 'web-socket/index';

import path from 'path';

import { preLogmiddleware } from 'middleware/log.middleware';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(apiAuthMiddleware);

// Inject websocket
app.use((req, res, next) => {
  //@ts-ignore
  res.io = io;
  next();
});

app.use(preLogmiddleware);

app.use(routes);

app.use('/icons', [express.static(path.join(process.cwd(), 'public', 'icons'))]);

app.use(errorMiddleware);

export default app;
