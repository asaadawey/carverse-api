import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { AttachmentTypes, HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import { generateToken } from '@src/utils/token';
import { compareHashedString, decrypt } from '@src/utils/encrypt';
import { Prisma } from '@prisma/client';
import logger, { loggerUtils } from '@src/utils/logger';
import { getLocalizedMessage } from '@src/utils/localization';
import { generateDeviceFingerprint } from '@src/utils/deviceFingerprint';

//#region Login
export const loginSchema: yup.SchemaOf<{ body: LoginRequestBody }> = yup.object({
  body: yup.object({
    email: yup.string().required('Email is required'),
    password: yup.string().required('Password is required'),
    keepLoggedIn: yup.bool().optional(),
    encryptedClient: yup.string(),
    notificationToken: yup.string().optional(),
  }),
});

type LoginRequestQuery = {};

type LoginRequestBody = {
  email: string;
  password: string;
  keepLoggedIn?: boolean;
  encryptedClient?: string;
  notificationToken?: string;
};

export type LoginResponse = {
  providerData: {
    isHaveServices: boolean;
    isDocumentsFullfilled: boolean | undefined;
  };
  customerData: {};
  userData: {
    isFirstLogin: boolean;
    isUserActive: boolean;
  };

  token: string;
  userInfo: {
    FirstName: string;
    LastName: string;
    MobileNumber: string;
    Email: string;
    id: number;
    customerId?: number;
    providerId?: number;
    UserTypeName: string;
  };
};

type LoginRequestParams = {};

const login: RequestHandler<LoginRequestQuery, LoginResponse, LoginRequestBody, LoginRequestParams> = async (
  req,
  res,
  next,
): Promise<void> => {
  try {
    const { email, password, notificationToken } = req.body;

    req.logger.info('Login attempt initiated', { email });

    const user = await req.prisma.users.findFirst({
      where: { Email: { equals: email } },
      select: {
        Email: true,
        Password: true,
        FirstName: true,
        LastName: true,
        PhoneNumber: true,
        isEmailVerified: true,
        id: true,
        userTypes: {
          select: {
            TypeName: true,
            AllowedClients: true,
          },
        },
        LastLoginDate: true,
        isActive: true,
        customer: { select: { id: true } },
        provider: { select: { id: true, providerServices: { take: 1 } } },
      },
    });

    if (!user) {
      loggerUtils.logAuthEvent('Login failed - User not found', undefined, false, { email });
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'No user found',
      );
    }

    const isValid = await compareHashedString(user.Password, password);

    if (!isValid) {
      loggerUtils.logAuthEvent('Login failed - Invalid password', user.id, false, { email });
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'Password incorrect',
      );
    }

    // Extra check if user have either provider id or customer id (except for Admin users)
    if (!user.provider?.id && !user.customer?.id && user.userTypes.TypeName !== 'Admin') {
      req.logger.error(new Error('User missing both provider and customer ID'), 'Login validation error', {
        userId: user.id,
        userType: user.userTypes.TypeName,
      });
      throw new HttpException(
        HTTPResponses.InternalServerError,
        HTTPErrorString.SomethingWentWrong,
        'User account configuration error',
      );
    }

    // Check delete requests for the user
    const deleteRequest = await req.prisma.deleteRequests.findFirst({
      where: { UserID: user.id },
      select: { IsProcessed: true, id: true },
    });
    if (deleteRequest !== undefined && deleteRequest !== null)
      throw new HttpException(
        HTTPResponses.BusinessError,
        getLocalizedMessage(req, 'error.accountDeleted'),
        'Delete request id ' + deleteRequest?.id,
      );

    // Check if email verified
    if (!user.isEmailVerified)
      throw new HttpException(
        HTTPResponses.BusinessError,
        getLocalizedMessage(req, 'error.emailNotVerified'),
        'Email not verified',
      );

    // Check if received exists in allowed client
    const decryptedClient = decrypt(req.headers['allowed-client'] as string);
    if (!user.userTypes.AllowedClients.includes(decryptedClient))
      throw new HttpException(HTTPResponses.BusinessError, getLocalizedMessage(req, 'error.noSufficientPermissions'), {
        decryptedClient,
        userClient: user.userTypes.AllowedClients,
      });

    // Generate device fingerprint for this login session
    const deviceFingerprint = generateDeviceFingerprint(req);

    const token = generateToken({
      id: user.id,
      customerId: user.customer?.id,
      providerId: user.provider?.id,
      exp: Boolean(req.body.keepLoggedIn) ? '30d' : '',
      userType: user.userTypes.TypeName,
      keepLoggedIn: true,
      authorisedEncryptedClient: req.headers['allowed-client'] as string,
      deviceFingerprint: deviceFingerprint,
      userAgent: req.headers['user-agent'],
    });

    // Check if provider has uploaded documents or not
    let isDocumentsFullfilled: boolean | undefined = undefined;
    if (user.userTypes.TypeName === 'Provider' && !user.isActive) {
      const uploadedFilesCount = await req.prisma.uploadedFiles.count({
        where: {
          attachment: {
            attachmentType: {
              TypeName: { equals: AttachmentTypes.ProviderVerification },
            },
          },
        },
      });

      const requiredAttachments = await req.prisma.attachments.count({
        where: { attachmentType: { TypeName: { equals: AttachmentTypes.ProviderVerification } } },
      });

      isDocumentsFullfilled = Boolean(uploadedFilesCount) && uploadedFilesCount === requiredAttachments;
    } else {
      isDocumentsFullfilled = undefined;
    }

    // Log successful login
    req.logger.info('Login successful', {
      email,
      userType: user.userTypes.TypeName,
      hasDocuments: isDocumentsFullfilled,
    });

    let toUpdateData = {};
    // Update last login date
    if (!user.LastLoginDate && user.isActive) {
      toUpdateData = { LastLoginDate: new Date() };
    }

    if (notificationToken) {
      toUpdateData = { ...toUpdateData, LastKnownNotificationToken: notificationToken };
    }

    if (Object.keys(toUpdateData).length > 0) {
      await req.prisma.users.update({
        where: { id: user.id },
        data: toUpdateData,
      });
    }

    createSuccessResponse(
      req,
      res,
      {
        userData: {
          isUserActive: user.isActive,
          isFirstLogin: Boolean(!user.LastLoginDate),
        },
        customerData: {},
        providerData: {
          isHaveServices: (user?.provider?.providerServices?.length ?? 0) > 0,
          isDocumentsFullfilled: isDocumentsFullfilled,
        },
        token,
        userInfo: {
          id: user.id,
          FirstName: user.FirstName,
          customerId: user.customer?.id,
          providerId: user.provider?.id,
          LastName: user.LastName,
          Email: user.Email,
          MobileNumber: user.PhoneNumber,
          UserTypeName: user.userTypes?.TypeName,
        },
      },
      next,
    );
  } catch (error: any) {
    loggerUtils.logError(error as Error, 'Login Controller', {
      email: req.body.email,
      reqId: req.headers['req_id'],
      error,
    });
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default login;
