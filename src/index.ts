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

const app = express();



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ["http://localhost:5173", "https://localhost:5173", "https://carverse-web-7d8ac41a6885.herokuapp.com"],
  credentials: true, exposedHeaders: ["set-cookie"],
}))

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

app.use(routes);

app.use(errorMiddleware);


export default app;
