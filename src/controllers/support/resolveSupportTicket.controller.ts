import * as yup from 'yup';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { HTTPResponses } from '@src/interfaces/enums';

//#region ResolveSupportTicket

type ResolveSupportTicketParams = {
  ticketId: string;
};

type ResolveSupportTicketRequestBody = {
  resolutionNotes?: string;
  status: 'RESOLVED' | 'CLOSED';
};

type ResolveSupportTicketResponse = {
  ticketId: string;
  status: string;
  resolvedAt: Date;
  message: string;
  resolutionNotes?: string;
};

type ResolveSupportTicketQueryParams = {};

export const resolveSupportTicketSchema = yup.object({
  params: yup.object().shape({
    ticketId: yup.string().required('Ticket ID is required'),
  }),
  body: yup.object().shape({
    status: yup.string().oneOf(['RESOLVED', 'CLOSED'], 'Status must be either RESOLVED or CLOSED').required(),
    resolutionNotes: yup.string().optional().max(1000, 'Resolution notes cannot exceed 1000 characters'),
  }),
});

const resolveSupportTicket: RequestHandler<
  ResolveSupportTicketParams,
  ResolveSupportTicketResponse,
  ResolveSupportTicketRequestBody,
  ResolveSupportTicketQueryParams
> = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status, resolutionNotes } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return createFailResponse(req, res, new Error('Admin not authenticated'), next);
    }

    // Check if support ticket exists and is not already resolved
    const existingTicket = await req.prisma.supportRequests.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            FirstName: true,
            LastName: true,
            Email: true,
          },
        },
        relatedOrder: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingTicket) {
      return createFailResponse(req, res, new Error('Support ticket not found'), next, HTTPResponses.NotFound);
    }

    if (existingTicket.status === 'RESOLVED' || existingTicket.status === 'CLOSED') {
      return createFailResponse(
        req,
        res,
        new Error('Support ticket is already resolved or closed'),
        next,
        HTTPResponses.ValidationError,
      );
    }

    // Update the support ticket
    const updatedTicket = await req.prisma.supportRequests.update({
      where: { id: ticketId },
      data: {
        status: status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        issueDescription: true,
      },
    });

    // Log the action
    if (req.logger) {
      req.logger.info('Support ticket resolved by admin', {
        adminId,
        ticketId,
        userId: existingTicket.userId,
        previousStatus: existingTicket.status,
        newStatus: status,
        resolutionNotes,
        timestamp: new Date().toISOString(),
      });
    }

    const response: ResolveSupportTicketResponse = {
      ticketId: updatedTicket.id,
      status: updatedTicket.status,
      resolvedAt: updatedTicket.updatedAt,
      message: `Support ticket ${status.toLowerCase()} successfully`,
      resolutionNotes: resolutionNotes,
    };

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    if (req.logger) {
      req.logger.error(error, 'Error resolving support ticket', {
        ticketId: req.params.ticketId,
        adminId: req.user?.id,
      });
    }
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default resolveSupportTicket;
