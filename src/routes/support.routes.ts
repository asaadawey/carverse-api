import { Router } from 'express';
import { createSupportRequestSchema } from '@src/controllers/support/createSupportRequest.controller';
import { resolveSupportTicketSchema } from '@src/controllers/support/resolveSupportTicket.controller';
import { getAllSupportTicketsSchema } from '@src/controllers/support/getAllSupportTickets.controller';
import { createSupportRequest, resolveSupportTicket, getAllSupportTickets } from '@src/controllers/support/index';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';
import { authRoute } from '@src/middleware/auth.middleware';
import allowedUserTypeMiddleware from '@src/middleware/allowedUserType.middleware';
import allowedClientMiddleware from '@src/middleware/allowedClient.middleware';
import { AllowedClients, UserTypes } from '@src/interfaces/enums';

const router = Router();

/**
 * @swagger
 * /support/create:
 *   post:
 *     summary: Create a support request
 *     description: Create a new support request for user issues or order-related problems
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issueDescription
 *               - contactUserByRegisteredMobile
 *               - sendEmail
 *             properties:
 *               relatedOrderId:
 *                 type: integer
 *                 description: Optional order ID if the issue is related to a specific order
 *                 example: 123
 *               issueDescription:
 *                 type: string
 *                 description: Detailed description of the issue
 *                 minLength: 10
 *                 example: "I have a problem with my recent car wash service. The service was incomplete."
 *               contactUserByRegisteredMobile:
 *                 type: boolean
 *                 description: Whether support team should contact user via registered mobile number
 *                 example: true
 *               sendEmail:
 *                 type: boolean
 *                 description: Whether to send email confirmation to user
 *                 example: true
 *     responses:
 *       200:
 *         description: Support request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         supportId:
 *                           type: string
 *                           example: "cm1a2b3c4d5e6f7g8h9i0j"
 *                         message:
 *                           type: string
 *                           example: "Support request created successfully"
 *                         emailSent:
 *                           type: boolean
 *                           description: Whether confirmation email was sent
 *                           example: true
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - valid token required
 *       404:
 *         description: Related order not found or doesn't belong to user
 */
router.post(RouterLinks.createSupportRequest, authRoute, validate(createSupportRequestSchema), createSupportRequest);

/**
 * @swagger
 * /support/tickets:
 *   get:
 *     summary: Get support tickets
 *     description: Get support tickets. Admins can see all tickets, users can see only their own tickets.
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, InProgress, Resolved, Closed]
 *         description: Filter by ticket status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(RouterLinks.getAllSupportTickets, authRoute, validate(getAllSupportTicketsSchema), getAllSupportTickets);

/**
 * @swagger
 * /support/tickets/{ticketId}/resolve:
 *   put:
 *     summary: Resolve support ticket (Admin only)
 *     description: Mark a support ticket as resolved or closed. Only accessible by admin users.
 *     tags: [Support, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the support ticket to resolve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [RESOLVED, CLOSED]
 *                 description: New status for the ticket
 *                 example: "RESOLVED"
 *               resolutionNotes:
 *                 type: string
 *                 description: Optional notes about the resolution
 *                 example: "Issue has been resolved by updating the user's account settings."
 *     responses:
 *       200:
 *         description: Ticket status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Ticket not found
 *       400:
 *         description: Invalid status value
 */
router.put(
  RouterLinks.resolveSupportTicket,
  authRoute,
  allowedUserTypeMiddleware([UserTypes.Admin]),
  allowedClientMiddleware([AllowedClients.Web]),
  validate(resolveSupportTicketSchema),
  resolveSupportTicket,
);

export default router;
