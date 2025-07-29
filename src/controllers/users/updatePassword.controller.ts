import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import { generateHashedString } from '@src/utils/encrypt';
import logger, { loggerUtils } from '@src/utils/logger';

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

    logger.info('Password update attempt initiated', { email, reqId: req.headers['req_id'] });

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
      loggerUtils.logAuthEvent('Password update failed - User not found', undefined, false, { email });
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'User not found',
      );
    }

    if (!user.isActive) {
      loggerUtils.logAuthEvent('Password update failed - User inactive', user.id, false, { email });
      throw new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.AccountInactive, {
        userId: user.id,
      });
    }

    // Verify OTP (In a real implementation, you would check against a stored OTP)
    // For now, we'll assume a simple verification mechanism
    // This should be replaced with actual OTP verification logic
    if (!otp || otp.length < 4) {
      loggerUtils.logAuthEvent('Password update failed - Invalid OTP', user.id, false, { email });
      throw new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'Invalid OTP');
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

    loggerUtils.logAuthEvent('Password updated successfully', user.id, true, {
      email,
    });

    logger.info('Password update completed successfully', {
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
    loggerUtils.logError(error as Error, 'Update Password Controller', {
      email: req.body.email,
      reqId: req.headers['req_id'],
    });
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default updatePassword;
