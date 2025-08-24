import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import logger, { loggerUtils } from '@src/utils/logger';
import { sendOTPEmail } from '@src/services/emailService';
import { generateOtp } from '@src/services/otpService';
import { getLocalizedMessage } from '@src/utils/localization';

//#region SendEmailOtp
//@ts-ignore
export const sendEmailOtpSchema: yup.SchemaOf<{ body: SendEmailOtpRequestBody }> = yup.object({
  body: yup.object({
    email: yup.string().email('Invalid email format').required('Email is required'),
    type: yup.string().oneOf(['EMAIL_VERIFICATION', 'PASSWORD_RESET']).required('Type is required'),
  }),
});

type SendEmailOtpRequestQuery = {};

type SendEmailOtpRequestBody = {
  email: string;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
};

export type SendEmailOtpResponse = {
  success: boolean;
  message: string;
  otpSent: boolean;
};

type SendEmailOtpRequestParams = {};

const sendEmailOtp: RequestHandler<
  SendEmailOtpRequestParams,
  SendEmailOtpResponse,
  SendEmailOtpRequestBody,
  SendEmailOtpRequestQuery
> = async (req, res, next) => {
  try {
    const { email, type } = req.body;

    logger.info('Email OTP request initiated', { email, reqId: req.headers['req_id'] });

    // Find user by email
    const user = await req.prisma.users.findFirst({
      where: { AND: [{ Email: email }, { isActive: true }] },
      select: {
        id: true,
        Email: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      loggerUtils.logAuthEvent('OTP request failed - User not found', undefined, false, { email });
      throw new HttpException(
        HTTPResponses.BusinessError,
        getLocalizedMessage(req, 'error.emailNotVerified'),
        'User not found',
      );
    }

    if (user.isEmailVerified && type === 'EMAIL_VERIFICATION') {
      throw new HttpException(
        HTTPResponses.BusinessError,
        getLocalizedMessage(req, 'error.emailAlreadyVerified'),
        'Email already verified',
      );
    }

    if (!user.isEmailVerified && type === 'PASSWORD_RESET') {
      throw new HttpException(
        HTTPResponses.Unauthorised,
        getLocalizedMessage(req, 'error.unauthorized'),
        'User trying to update password and the email is not verified',
      );
    }

    // Generate OTP using OTP service
    const otpResult = await generateOtp(email, type, req.prisma);

    if (!otpResult.success) {
      loggerUtils.logAuthEvent('OTP generation failed', user.id, false, {
        email,
        error: otpResult.error,
      });
      throw new HttpException(
        HTTPResponses.InternalServerError,
        otpResult.error || getLocalizedMessage(req, 'error.somethingWentWrong'),
        otpResult.error || 'Failed to generate OTP',
      );
    }

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otpResult.otp!, type);

    if (!emailSent) {
      loggerUtils.logAuthEvent('OTP email sending failed', user.id, false, { email });

      // In development/test, we might still want to continue even if email fails
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logger.warn('Email sending failed but continuing in development mode', {
          email,
          otp: otpResult.otp,
        });
      } else {
        throw new HttpException(
          HTTPResponses.InternalServerError,
          HTTPErrorString.SomethingWentWrong,
          'Failed to send OTP email',
        );
      }
    }

    logger.info('Email OTP sent successfully', {
      userId: user.id,
      email,
      expiresAt: otpResult.expiresAt,
      reqId: req.headers['req_id'],
    });

    createSuccessResponse(
      req,
      res,
      {
        success: true,
        message: getLocalizedMessage(req, 'success.sent'),
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
