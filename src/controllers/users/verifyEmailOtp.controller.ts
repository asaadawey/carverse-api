import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import logger, { loggerUtils } from '@src/utils/logger';

//#region VerifyEmailOtp
export const verifyEmailOtpSchema: yup.SchemaOf<{ body: VerifyEmailOtpRequestBody }> = yup.object({
  body: yup.object({
    email: yup.string().email('Invalid email format').required('Email is required'),
    otp: yup.string().required('OTP is required'),
  }),
});

type VerifyEmailOtpRequestQuery = {};

type VerifyEmailOtpRequestBody = {
  email: string;
  otp: string;
};

export type VerifyEmailOtpResponse = {
  success: boolean;
  message: string;
  verified: boolean;
};

type VerifyEmailOtpRequestParams = {};

const verifyEmailOtp: RequestHandler<
  VerifyEmailOtpRequestQuery,
  VerifyEmailOtpResponse,
  VerifyEmailOtpRequestBody,
  VerifyEmailOtpRequestParams
> = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    logger.info('Email OTP verification initiated', { email, reqId: req.headers['req_id'] });

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
      loggerUtils.logAuthEvent('OTP verification failed - User not found', undefined, false, { email });
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'User not found',
      );
    }

    if (!user.isActive) {
      loggerUtils.logAuthEvent('OTP verification failed - User inactive', user.id, false, { email });
      throw new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.AccountInactive, {
        userId: user.id,
      });
    }

    // Verify OTP
    // In a real implementation, you would:
    // 1. Check OTP against stored value in database
    // 2. Verify OTP is not expired
    // 3. Mark OTP as used to prevent reuse

    // For demo purposes, we'll do basic validation
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      loggerUtils.logAuthEvent('OTP verification failed - Invalid OTP format', user.id, false, { email });
      throw new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'Invalid OTP format');
    }

    // TODO: Implement actual OTP verification logic here
    // Example:
    // const storedOtp = await otpService.getOTP(email);
    // if (!storedOtp || storedOtp.otp !== otp || storedOtp.isExpired()) {
    //   throw new HttpException(HTTPResponses.BusinessError, 'Invalid or expired OTP');
    // }
    // await otpService.markOtpAsUsed(email, otp);

    loggerUtils.logAuthEvent('OTP verified successfully', user.id, true, {
      email,
    });

    logger.info('Email OTP verified successfully', {
      userId: user.id,
      email,
      reqId: req.headers['req_id'],
    });

    createSuccessResponse(
      req,
      res,
      {
        success: true,
        message: 'OTP verified successfully',
        verified: true,
      },
      next,
    );
  } catch (error: any) {
    loggerUtils.logError(error as Error, 'Verify Email OTP Controller', {
      email: req.body.email,
      reqId: req.headers['req_id'],
    });
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default verifyEmailOtp;
