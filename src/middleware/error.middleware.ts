/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import envVars from '@src/config/environment';
import { HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';

const errorMiddleware = (error: HttpException | any, req: Request, res: Response, next: NextFunction) => {
  try {
    let status: number = error.status || HTTPResponses.InternalServerError;
    let message: string = error.message || HTTPErrorString.SomethingWentWrong;
    let additionalData = error.additionalData;
    let originalError = error.message;

    if (error instanceof Prisma.PrismaClientUnknownRequestError || (error.clientVersion && !error.code)) {
      //Prisma unknown errors custom handler
      if (message.includes('Unknown arg'))
        message = message.slice(message.indexOf('Unknown'), message.indexOf('Available')).trim();

      // console.error(error.message);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const newMessage = "Cannot proceed with this operation as it's seems to be duplicated. Please try again with other data"
      if (error.code === 'P2002') additionalData = (additionalData || "") + message.slice(message.indexOf('Unique constraint'));
      else if (error.code === 'P2025') additionalData = (additionalData || "") + message.slice(message.indexOf('An operation failed'));
      message = newMessage;
    } else if (error instanceof yup.ValidationError) {
      message = 'Bad request';
      status = 400;
      additionalData = error.errors[0] || error.message || (error as any) || additionalData;
    } else if (error instanceof SyntaxError || error instanceof TypeError) {
      message = envVars.logVerbose === "all" ? message : HTTPErrorString.SomethingWentWrong;
      additionalData = { ...additionalData, error }
    }
    console.log(`ERROR-BUILDER [${req.method}] ${req.path} ${status}, ${message}`);
    console.log({
      body: JSON.stringify(req.body),
      headers: req.headers,
      req_id: req.headers["req_id"],
      additionalData,
      originalError
    });
    res
      .status(status)
      .json({
        message,
        status,
        req_id: req.headers["req_id"],
        ...(envVars.logVerbose === 'all' && additionalData ? { additionalData } : {}),
      })
      .end();
    next();
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
