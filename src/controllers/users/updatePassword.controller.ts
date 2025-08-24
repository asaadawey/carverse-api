import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import { generateHashedString } from '@src/utils/encrypt';
import logger, { loggerUtils } from '@src/utils/logger';
import { verifyOtp } from '@src/services/otpService';
import { getLocalizedMessage } from '@src/utils/localization';

//#region UpdatePassword
export const updatePasswordSchema: yup.SchemaOf<{ body: UpdatePasswordRequestBody }> = yup.object({
  body: yup.object({
    email: yup.string().email('Invalid email format').required('Email is required'),
    newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
    otp: yup.string().required('OTP is required'),
  }),
});

type UpdatePasswordRequestQuery = {};

type UpdatePasswordRequestBody = {
  email: string;
  newPassword: string;
  otp: string;
};

export type UpdatePasswordResponse = {
  success: boolean;
  message: string;
};

type UpdatePasswordRequestParams = {};

const updatePassword: RequestHandler<
  UpdatePasswordRequestQuery,
  UpdatePasswordResponse,
  UpdatePasswordRequestBody,
  UpdatePasswordRequestParams
> = async (req, res, next) => {
  try {
    const { email, newPassword, otp } = req.body;

    req.logger.info('Password update attempt initiated', { email, reqId: req.headers['req_id'] });

    const isOtpVerified = await verifyOtp(email, otp, 'PASSWORD_RESET', req.prisma, true);

    if (!isOtpVerified.success)
      throw new HttpException(HTTPResponses.BusinessError, getLocalizedMessage(req, 'error.invalidOtp'), 'Invalid OTP');

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
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'User not found',
      );
    }

    if (!user.isActive) {
      throw new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.AccountInactive, {
        userId: user.id,
      });
    }

    // Hash the new password
    const hashedPassword = await generateHashedString(newPassword);

    // Update user password
    await req.prisma.users.update({
      where: { id: user.id },
      data: {
        Password: hashedPassword,
        ModifiedOn: new Date(),
      },
    });

    req.logger.info('Password update completed successfully', {
      userId: user.id,
      email,
      reqId: req.headers['req_id'],
    });

    createSuccessResponse(
      req,
      res,
      {
        success: true,
        message: 'Password updated successfully',
      },
      next,
    );
  } catch (error: any) {
    req.logger.error(error as Error, 'Update Password Controller', {
      email: req.body.email,
    });
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default updatePassword;
