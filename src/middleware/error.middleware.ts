/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from 'errors';
import * as yup from 'yup';
import envVars from 'config/environment';

const errorMiddleware = (error: HttpException | any, req: Request, res: Response, next: NextFunction) => {
  try {
    let status: number = error.status || 500;
    let message: string = error.message || 'Something went wrong';
    let additionalData = '';

    if (error instanceof Prisma.PrismaClientUnknownRequestError || (error.clientVersion && !error.code)) {
      //Prisma unknown errors custom handler
      if (message.includes('Unknown arg'))
        message = message.slice(message.indexOf('Unknown'), message.indexOf('Available')).trim();

      // console.error(error.message);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') message = message.slice(message.indexOf('Unique constraint'));
      else if (error.code === 'P2025') message = message.slice(message.indexOf('An operation failed'));
    } else if (error instanceof yup.ValidationError) {
      message = 'Bad request';
      status = 400;
      additionalData = error.message;
    }
    console.log(`ERROR-BUILDER [${req.method}] ${req.path} ${status}, ${message}`);
    console.log({
      body: req.body,
      headers: req.headers,
    });
    res
      .status(status)
      .json({ message, status, ...(envVars.mode === 'development' && additionalData ? { data: additionalData } : {}) });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
