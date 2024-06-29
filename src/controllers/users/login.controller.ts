import { RequestHandler } from 'express';
import { HttpException } from 'src/errors';
import * as yup from 'yup';
import prisma from 'src/helpers/databaseHelpers/client';
import { createSuccessResponse, createFailResponse } from 'src/responses';
import { HTTPErrorMessages, HTTPResponses } from 'src/interfaces/enums';
import crypto from 'crypto';
import { generateToken } from 'src/utils/token';
import { decrypt } from 'src/utils/encrypt';
import { Prisma } from '@prisma/client';
// import createFailResponse from 'src/responses';

//#region Login
export const loginSchema: yup.SchemaOf<{ body: LoginRequestBody }> = yup.object({
  body: yup.object({
    email: yup.string().required('Email is required'),
    password: yup.string().required('Password is required'),
    keepLoggedIn: yup.bool().optional(),
    encryptedClient: yup.string().required('client is required'),
  }),
});

type LoginRequestQuery = {};

type LoginRequestBody = {
  email: string;
  password: string;
  keepLoggedIn?: boolean;
  encryptedClient: string;
};

export type LoginResponse = {
  isUserActive: boolean;
  isDocumentsFullfilled: boolean | undefined,
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
    const { email, password } = req.body;

    const user = await prisma.users.findFirst({
      where: { Email: { equals: email } },
      select: {
        Email: true,
        Password: true,
        FirstName: true,
        LastName: true,
        PhoneNumber: true,
        id: true,
        userTypes: {
          select: {
            TypeName: true,
            AllowedClients: true,
          },
        },
        isActive: true,
        customer: { select: { id: true } },
        provider: { select: { id: true } },
      },
    });
    //TODO HASH PASSWORDS
    if (!user)
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'No user found',
      );

    const isValid =
      password.length === user.Password.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(user.Password));

    if (!isValid)
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'Password incorrect',
      );
    // const headerSalt = req.headers['salt'];

    // const envSalt = envVars.auth.apiSalt;

    // const isSame = headerSalt === envSalt;

    // Check if received exists in allowed client
    const decryptedClient = decrypt(req.body.encryptedClient);
    if (!user.userTypes.AllowedClients.includes(decryptedClient))
      throw new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.NoSufficientPermissions, {
        decryptedClient,
        userClient: user.userTypes.AllowedClients,
      });

    const token = generateToken({
      id: user.id,
      customerId: user.customer?.id,
      providerId: user.provider?.id,
      exp: Boolean(req.body.keepLoggedIn) ? '30d' : '',
      authorisedEncryptedClient: req.body.encryptedClient,
    });

    // Check if provider has uploaded documents or not
    let isDocumentsFullfilled: boolean | undefined = undefined;
    if (user.userTypes.TypeName === "Provider" && !user.isActive) {
      const attachments = await prisma.uploadedFiles.findFirst({ where: { AND: [{ UserID: { equals: user.id } }, { JsonData: { equals: Prisma.JsonNull } }] } })
      isDocumentsFullfilled = Boolean(attachments);
    }

    createSuccessResponse(
      req,
      res,
      {
        isUserActive: user.isActive,
        isDocumentsFullfilled: isDocumentsFullfilled,
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
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default login;
