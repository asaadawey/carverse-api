import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import logger, { loggerUtils } from '@src/utils/logger';

//#region SendEmailOtp
export const sendEmailOtpSchema: yup.SchemaOf<{ body: SendEmailOtpRequestBody }> = yup.object({
  body: yup.object({
    email: yup.string().email('Invalid email format').required('Email is required'),
  }),
});

type SendEmailOtpRequestQuery = {};

type SendEmailOtpRequestBody = {
  email: string;
};

export type SendEmailOtpResponse = {
  success: boolean;
  message: string;
  otpSent: boolean;
};

type SendEmailOtpRequestParams = {};

const sendEmailOtp: RequestHandler<
  SendEmailOtpRequestQuery,
  SendEmailOtpResponse,
  SendEmailOtpRequestBody,
  SendEmailOtpRequestParams
> = async (req, res, next) => {
  try {
    const { email } = req.body;

    logger.info('Email OTP request initiated', { email, reqId: req.headers['req_id'] });

    // Find user by email
    const user = await req.prisma.users.findUnique({
      where: { Email: email },
      select: {
        id: true,
        Email: true,
        isActive: true,
      },
    });

    if (!user) {
      loggerUtils.logAuthEvent('OTP request failed - User not found', undefined, false, { email });
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'User not found',
      );
    }

    if (!user.isActive) {
      loggerUtils.logAuthEvent('OTP request failed - User inactive', user.id, false, { email });
      throw new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.AccountInactive, {
        userId: user.id,
      });
    }

    // Generate OTP (6-digit random number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real implementation, you would:
    // 1. Store the OTP in database with expiration time
    // 2. Send email with OTP using email service (SendGrid, AWS SES, etc.)
    // For now, we'll just log it (DO NOT DO THIS IN PRODUCTION)
    logger.info('OTP generated for password reset', {
      userId: user.id,
      email,
      otp, // Remove this in production
      reqId: req.headers['req_id'],
    });

    // TODO: Implement actual email sending logic here
    // Example:
    // await emailService.sendOTP({
    //   to: email,
    //   otp: otp,
    //   subject: 'Password Reset OTP'
    // });

    loggerUtils.logAuthEvent('OTP sent successfully', user.id, true, {
      email,
    });

    logger.info('Email OTP sent successfully', {
      userId: user.id,
      email,
      reqId: req.headers['req_id'],
    });

    createSuccessResponse(
      req,
      res,
      {
        success: true,
        message: 'OTP sent to your email address',
        otpSent: true,
      },
      next,
    );
  } catch (error: any) {
    loggerUtils.logError(error as Error, 'Send Email OTP Controller', {
      email: req.body.email,
      reqId: req.headers['req_id'],
    });
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default sendEmailOtp;
