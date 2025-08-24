/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@src/errors/index';
import LocalizedHttpException from '@src/errors/LocalizedHttpException';
import { isLocalizedError, getLocalizedMessage, mapLegacyErrorToLocalized } from '@src/utils/localization';
import * as yup from 'yup';
import envVars from '@src/config/environment';
import { HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import { SupportedLanguages } from '@src/locales/index';

const errorMiddleware = (
  error: HttpException | LocalizedHttpException | any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let status: number = error.status || HTTPResponses.InternalServerError;
    let message: string;
    let additionalData = error.additionalData || error.additionalParameters || null;
    let originalError = error.message;
    const language = req.language || SupportedLanguages.EN;

    // Handle localized errors first
    if (isLocalizedError(error)) {
      message = error.localizedMessage;
      status = error.status;
      additionalData = error.additionalParameters || additionalData;
    }
    // Handle legacy HttpException errors by converting them to localized messages
    else if (error instanceof HttpException) {
      const messageKey = mapLegacyErrorToLocalized(error.message);
      message = getLocalizedMessage(req, messageKey);
      status = error.status;
      additionalData = error.additionalParameters || additionalData;
    }
    // Handle Prisma and other errors
    else {
      if (error instanceof Prisma.PrismaClientUnknownRequestError || (error.clientVersion && !error.code)) {
        //Prisma unknown errors custom handler
        let errorMessage = error.message || 'Database error occurred';
        if (errorMessage.includes('Unknown arg'))
          errorMessage = errorMessage.slice(errorMessage.indexOf('Unknown'), errorMessage.indexOf('Available')).trim();

        message = getLocalizedMessage(req, 'error.somethingWentWrong');
        additionalData = envVars.logVerbose === 'all' ? errorMessage : null;
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          message = getLocalizedMessage(req, 'error.duplicateData');
          additionalData = (additionalData || '') + error.message.slice(error.message.indexOf('Unique constraint'));
        } else if (error.code === 'P2025') {
          message = getLocalizedMessage(req, 'error.operationFailed');
          additionalData = (additionalData || '') + error.message.slice(error.message.indexOf('An operation failed'));
        } else {
          message = getLocalizedMessage(req, 'error.somethingWentWrong');
        }
      } else if (error instanceof yup.ValidationError) {
        message = getLocalizedMessage(req, 'error.validationError');
        status = HTTPResponses.ValidationError;
        additionalData = error.errors[0] || error.message || (error as any) || additionalData;
      } else if (error instanceof SyntaxError || error instanceof TypeError) {
        message = envVars.logVerbose === 'all' ? error.message : getLocalizedMessage(req, 'error.somethingWentWrong');
        additionalData = { ...additionalData, error };
      } else {
        // Fallback for any other error
        message = error.message || getLocalizedMessage(req, 'error.somethingWentWrong');
      }
    }
    console.log(`ERROR-BUILDER [${req.method}] ${req.path} ${status}, ${message}`);
    console.log({
      body: JSON.stringify(req.body),
      headers: req.headers,
      req_id: req.headers['req_id'],
      additionalData,
      originalError,
    });
    res
      .status(status)
      .json({
        message,
        status,
        req_id: req.headers['req_id'],
        ...(envVars.logVerbose === 'all' && additionalData ? { additionalData } : {}),
      })
      .end();
    next();
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
