import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';

import { validate } from '@src/utils/schema';
import { AllowedClients, UserTypes } from '@src/interfaces/enums';

import { authRoute } from '@src/middleware/auth.middleware';
import allowedUserTypeMiddleware from '@src/middleware/allowedUserType.middleware';
import allowedClientMiddleware from '@src/middleware/allowedClient.middleware';

import {
  loginController,
  registerController,
  checkUserExistController,
  getUserDetailsController,
  addDeleteRequestController,
  processDeleteRequestController,
  getPreviousAddressesController,
  updatePasswordController,
  sendEmailOtpController,
  verifyEmailOtpController,
  changeUserStatusController,
  getAllUsersController,
} from '@src/controllers/users/index';

import { checkUserExistSchema } from '@src/controllers/users/checkUserExist.controller';
import { getUserDetailsSchema } from '@src/controllers/users/getUserDetails.controller';
import { loginSchema } from '@src/controllers/users/login.controller';
import { registerSchema } from '@src/controllers/users/register.controller';
import { updatePasswordSchema } from '@src/controllers/users/updatePassword.controller';
import { sendEmailOtpSchema } from '@src/controllers/users/sendEmailOtp.controller';
import { verifyEmailOtpSchema } from '@src/controllers/users/verifyEmailOtp.controller';
import { changeUserStatusSchema } from '@src/controllers/users/changeUserStatus.controller';
import { getAllUsersSchema } from '@src/controllers/users/getAllUsers.controller';

import { addDeleteRequestSchema } from '@src/controllers/users/addDeleteRequest.controller';
import { processDeleteRequestSchema } from '@src/controllers/users/processDeleteRequest.controller';
import { GetPreviousAddressesSchema } from '@src/controllers/users/getPreviousAddresses.controller';

const router = Router();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(RouterLinks.login, validate(loginSchema), loginController);
/**
 * @swagger
 * /register:
 *   post:
 *     summary: User registration
 *     description: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - FirstName
 *               - LastName
 *               - Email
 *               - Password
 *               - Nationality
 *               - PhoneNumber
 *               - UserTypeName
 *             properties:
 *               FirstName:
 *                 type: string
 *                 example: "John"
 *               LastName:
 *                 type: string
 *                 example: "Doe"
 *               Email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               Password:
 *                 type: string
 *                 example: "password123"
 *               Nationality:
 *                 type: string
 *                 example: "US"
 *               PhoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               UserTypeName:
 *                 type: string
 *                 example: "Customer"
 *     responses:
 *       200:
 *         description: Registration successful
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
 *                         result:
 *                           type: boolean
 *                           example: true
 *                         id:
 *                           type: integer
 *                           example: 1
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(RouterLinks.register, validate(registerSchema), registerController);
/**
 * @swagger
 * /checkUserExist:
 *   post:
 *     summary: Check if user exists
 *     description: Check if a user exists with the given email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: User existence check result
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
 *                         exists:
 *                           type: boolean
 *                           example: true
 */
router.post(RouterLinks.checkUserExist, validate(checkUserExistSchema), checkUserExistController);
/**
 * @swagger
 * /getUserDetails/{userId}:
 *   get:
 *     summary: Get user details
 *     description: Retrieve detailed information about a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: false
 *         description: User ID (optional, defaults to current user)
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(RouterLinks.getUserDetails, authRoute, validate(getUserDetailsSchema), getUserDetailsController);
router.post(RouterLinks.addDeleteRequest, authRoute, validate(addDeleteRequestSchema), addDeleteRequestController);
router.get(
  RouterLinks.processDeleteRequest,
  authRoute,
  allowedUserTypeMiddleware([UserTypes.Admin]),
  allowedClientMiddleware([AllowedClients.Web]),
  validate(processDeleteRequestSchema),
  processDeleteRequestController,
);
router.get(
  RouterLinks.getPreviousAddresses,
  authRoute,
  validate(GetPreviousAddressesSchema),
  getPreviousAddressesController,
);

/**
 * @swagger
 * /updatePassword:
 *   put:
 *     summary: Update user password
 *     description: Update user password using email and OTP verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                         success:
 *                           type: boolean
 *                           example: true
 *                         message:
 *                           type: string
 *                           example: Password updated successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Business error (user not found, invalid OTP, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(RouterLinks.updatePassword, validate(updatePasswordSchema), updatePasswordController);

/**
 * @swagger
 * /sendEmailOtp:
 *   post:
 *     summary: Send OTP to email
 *     description: Send a one-time password to user's email for password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                         success:
 *                           type: boolean
 *                           example: true
 *                         message:
 *                           type: string
 *                           example: OTP sent to your email address
 *                         otpSent:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Business error (user not found, inactive user, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(RouterLinks.sendEmailOtp, validate(sendEmailOtpSchema), sendEmailOtpController);

/**
 * @swagger
 * /verifyEmailOtp:
 *   post:
 *     summary: Verify email OTP
 *     description: Verify the one-time password sent to user's email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                         success:
 *                           type: boolean
 *                           example: true
 *                         message:
 *                           type: string
 *                           example: OTP verified successfully
 *                         verified:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Business error (user not found, invalid OTP format, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(RouterLinks.verifyEmailOtp, validate(verifyEmailOtpSchema), verifyEmailOtpController);

// Admin-only routes
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve all users with filtering and pagination capabilities. Only accessible by admin users.
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for email or name
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [Customer, Provider, Admin]
 *         description: Filter by user type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  RouterLinks.getAllUsers,
  authRoute,
  allowedUserTypeMiddleware([UserTypes.Admin]),
  allowedClientMiddleware([AllowedClients.Web]),
  validate(getAllUsersSchema),
  getAllUsersController,
);

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   put:
 *     summary: Change user status (Admin only)
 *     description: Activate or deactivate a user account. Only accessible by admin users.
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *         example: "user-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New active status for the user
 *                 example: false
 *               reason:
 *                 type: string
 *                 description: Optional reason for the status change
 *                 example: "Account suspended due to policy violation"
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict - Admins cannot deactivate themselves
 */
router.put(
  RouterLinks.changeUserStatus,
  authRoute,
  allowedUserTypeMiddleware([UserTypes.Admin]),
  allowedClientMiddleware([AllowedClients.Web]),
  validate(changeUserStatusSchema),
  changeUserStatusController,
);

export default router;
