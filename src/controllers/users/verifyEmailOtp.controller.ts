import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import logger, { loggerUtils } from '@src/utils/logger';
import { verifyOtp } from '@src/services/otpService';
import { getLocalizedMessage } from '@src/utils/localization';

//#region VerifyEmailOtp
//@ts-ignore
export const verifyEmailOtpSchema: yup.SchemaOf<{ body: VerifyEmailOtpRequestBody }> = yup.object({
  body: yup.object({
    email: yup.string().email('Invalid email format').required('Email is required'),
    otp: yup.string().min(6).required('OTP is required'),
    type: yup.string().oneOf(['EMAIL_VERIFICATION', 'PASSWORD_RESET']).required('Type is required'),
  }),
});

type VerifyEmailOtpRequestQuery = {};

type VerifyEmailOtpRequestBody = {
  email: string;
  otp: string;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
};

export type VerifyEmailOtpResponse = {
  success: boolean;
  message: string;
  verified: boolean;
};

type VerifyEmailOtpRequestParams = {};

const verifyEmailOtp: RequestHandler<
  VerifyEmailOtpRequestParams,
  VerifyEmailOtpResponse,
  VerifyEmailOtpRequestBody,
  VerifyEmailOtpRequestQuery
> = async (req, res, next) => {
  try {
    const { email, otp, type } = req.body;

    logger.info('Email OTP verification initiated', { email, reqId: req.headers['req_id'] });

    // Find user by email
    const user = await req.prisma.users.findUnique({
      where: { Email: email },
      select: {
        id: true,
        Email: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new HttpException(
        HTTPResponses.BusinessError,
        getLocalizedMessage(req, 'error.emailNotVerified'),
        'User not found',
      );
    }

    if (user.isEmailVerified && type === 'EMAIL_VERIFICATION') {
      loggerUtils.logAuthEvent('OTP verification failed - User Email Already Verified', user.id, false, { user });
      throw new HttpException(
        HTTPResponses.BusinessError,
        getLocalizedMessage(req, 'error.emailAlreadyVerified'),
        'Email already verified',
      );
    }

    // Verify OTP using OTP service
    const verificationResult = await verifyOtp(email, otp, type, req.prisma, type === 'EMAIL_VERIFICATION');

    if (!verificationResult.success) {
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorString.BadRequest,
        verificationResult.error || 'OTP verification failed',
      );
    }

    if (type === 'EMAIL_VERIFICATION')
      await req.prisma.users.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
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
