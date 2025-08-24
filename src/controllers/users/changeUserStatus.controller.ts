import * as yup from 'yup';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { HTTPResponses } from '@src/interfaces/enums';
import { sendAccountActivationEmail } from '@src/services/emailService';
import sendNotification from '@src/utils/sendNotification';
import logger from '@src/utils/logger';

//#region ChangeUserStatus

type ChangeUserStatusParams = {
  userId: string;
};

type ChangeUserStatusRequestBody = {
  isActive: boolean;
  reason?: string;
};

type ChangeUserStatusResponse = {
  userId: number;
  isActive: boolean;
  message: string;
  updatedAt: Date;
};

type ChangeUserStatusQueryParams = {};

export const changeUserStatusSchema: yup.SchemaOf<{
  params: ChangeUserStatusParams;
  body: ChangeUserStatusRequestBody;
}> = yup.object({
  params: yup.object().shape({
    userId: yup.string().required('User ID is required'),
  }),
  body: yup.object().shape({
    isActive: yup.boolean().required('isActive status is required'),
    reason: yup.string().optional().max(500, 'Reason cannot exceed 500 characters'),
  }),
});

const changeUserStatus: RequestHandler<
  ChangeUserStatusParams,
  ChangeUserStatusResponse,
  ChangeUserStatusRequestBody,
  ChangeUserStatusQueryParams
> = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return createFailResponse(req, res, new Error('Admin not authenticated'), next);
    }

    // Validate user ID
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return createFailResponse(req, res, new Error('Invalid user ID'), next, HTTPResponses.ValidationError);
    }

    // Check if user exists
    const user = await req.prisma.users.findUnique({
      where: { id: userIdNum },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        Email: true,
        isActive: true,
        LastKnownNotificationToken: true,
        userTypes: {
          select: {
            TypeName: true,
          },
        },
      },
    });

    if (!user) {
      return createFailResponse(req, res, new Error('User not found'), next, HTTPResponses.NotFound);
    }

    // Prevent admin from deactivating themselves
    if (userIdNum === adminId) {
      return createFailResponse(
        req,
        res,
        new Error('Cannot change your own account status'),
        next,
        HTTPResponses.ValidationError,
      );
    }

    // Update user status
    const updatedUser = await req.prisma.users.update({
      where: { id: userIdNum },
      data: {
        isActive: isActive,
        ModifiedOn: new Date(),
      },
      select: {
        id: true,
        isActive: true,
        ModifiedOn: true,
      },
    });

    // Log the action
    if (req.logger) {
      req.logger.info('User status changed by admin', {
        adminId,
        targetUserId: userIdNum,
        previousStatus: user.isActive,
        newStatus: isActive,
        reason,
        timestamp: new Date().toISOString(),
      });
    }

    // If user is being activated (from inactive to active), send email and notification
    if (!user.isActive && isActive) {
      try {
        // Send account activation email
        const emailSent = await sendAccountActivationEmail(user.Email, user.FirstName, user.LastName);

        if (emailSent) {
          logger.info('Account activation email sent successfully', {
            userId: userIdNum,
            email: user.Email,
            adminId,
          });
        } else {
          logger.warn('Failed to send account activation email', {
            userId: userIdNum,
            email: user.Email,
            adminId,
          });
        }

        // Send push notification if user has a notification token
        if (user.LastKnownNotificationToken) {
          const notificationResult = await sendNotification({
            data: { userId: userIdNum, action: 'account_activated' },
            title: '🎉 Account Activated!',
            description: `Welcome back ${user.FirstName}! Your CarVerse account has been activated and you can now login to access all our services.`,
            expoToken: user.LastKnownNotificationToken,
          });

          if (notificationResult.result) {
            logger.info('Account activation notification sent successfully', {
              userId: userIdNum,
              notificationToken: user.LastKnownNotificationToken,
              adminId,
            });
          } else {
            logger.warn('Failed to send account activation notification', {
              userId: userIdNum,
              notificationToken: user.LastKnownNotificationToken,
              error: notificationResult.message,
              adminId,
            });
          }
        } else {
          logger.info('No notification token available for user', {
            userId: userIdNum,
            adminId,
          });
        }
      } catch (error: any) {
        logger.error('Error sending account activation notifications', {
          userId: userIdNum,
          error: error.message,
          adminId,
        });
        // Don't fail the status update if notifications fail
      }
    }

    const response: ChangeUserStatusResponse = {
      userId: updatedUser.id,
      isActive: updatedUser.isActive,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully${
        !user.isActive && isActive ? '. Account activation email and notification sent.' : ''
      }`,
      updatedAt: updatedUser.ModifiedOn,
    };

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    if (req.logger) {
      req.logger.error(error, 'Error changing user status', {
        userId: req.params.userId,
        adminId: req.user?.id,
      });
    }
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default changeUserStatus;
