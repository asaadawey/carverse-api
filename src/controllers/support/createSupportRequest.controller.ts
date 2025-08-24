import * as yup from 'yup';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { sendSupportRequestEmail } from '@src/services/emailService';
import logger from '@src/utils/logger';

//#region CreateSupportRequest

type CreateSupportRequestLinkQuery = {};

type CreateSupportRequestRequestBody = {
  relatedOrderId?: number;
  issueDescription: string;
  contactUserByRegisteredMobile: boolean;
  sendEmail: boolean;
};

type CreateSupportRequestResponse = {
  supportId: string;
  message: string;
  emailSent?: boolean;
};

type CreateSupportRequestQueryParams = {};

export const createSupportRequestSchema: yup.SchemaOf<{
  body: CreateSupportRequestRequestBody;
}> = yup.object({
  body: yup.object().shape({
    relatedOrderId: yup.number().optional().positive().integer(),
    issueDescription: yup.string().required().min(10, 'Issue description must be at least 10 characters'),
    contactUserByRegisteredMobile: yup.boolean().required(),
    sendEmail: yup.boolean().required(),
  }),
});

const createSupportRequest: RequestHandler<
  CreateSupportRequestLinkQuery,
  CreateSupportRequestResponse,
  CreateSupportRequestRequestBody,
  CreateSupportRequestQueryParams
> = async (req, res, next) => {
  try {
    const { relatedOrderId, issueDescription, contactUserByRegisteredMobile, sendEmail } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return createFailResponse(req, res, new Error('User not authenticated'), next);
    }

    // Get user details for email
    const user = await req.prisma.users.findUnique({
      where: { id: userId },
      select: {
        Email: true,
        FirstName: true,
        LastName: true,
      },
    });

    if (!user) {
      return createFailResponse(req, res, new Error('User not found'), next);
    }

    // Validate related order if provided
    if (relatedOrderId) {
      const order = await req.prisma.orders.findFirst({
        where: {
          id: relatedOrderId,
          customer: {
            UserID: userId,
          },
        },
      });

      if (!order) {
        return createFailResponse(req, res, new Error('Order not found or does not belong to user'), next);
      }
    }

    // Create support request
    const supportRequest = await req.prisma.supportRequests.create({
      data: {
        userId,
        relatedOrderId,
        issueDescription,
        contactUserByRegisteredMobile,
        sendEmail,
      },
    });

    const response: CreateSupportRequestResponse = {
      supportId: supportRequest.id,
      message: 'Support request created successfully',
    };

    // Send email if requested
    if (sendEmail) {
      try {
        const emailSent = await sendSupportRequestEmail(user.Email, supportRequest.id, issueDescription);

        response.emailSent = emailSent;

        if (emailSent) {
          logger.info('Support request confirmation email sent', {
            supportId: supportRequest.id,
            userEmail: user.Email,
            userId,
          });
        }
      } catch (emailError) {
        logger.error('Failed to send support request email', {
          supportId: supportRequest.id,
          userEmail: user.Email,
          userId,
          error: emailError,
        });
        // Don't fail the request if email fails
        response.emailSent = false;
      }
    }

    logger.info('Support request created', {
      supportId: supportRequest.id,
      userId,
      relatedOrderId,
      contactUserByRegisteredMobile,
      sendEmail,
    });

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    logger.error('Failed to create support request', {
      error: error.message,
      userId: req.user?.id,
      body: req.body,
    });
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default createSupportRequest;
