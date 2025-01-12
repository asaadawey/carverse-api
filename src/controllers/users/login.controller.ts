import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import bcrypt from 'bcrypt';
import constants from '@src/config/environment';
import { generateToken } from '@src/utils/token';
import { compareHashedString, decrypt } from '@src/utils/encrypt';
import { Prisma } from '@prisma/client';
// import createFailResponse from '@src/responses/index';

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
  isDocumentsFullfilled: boolean | undefined;
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

    const user = await req.prisma.users.findFirst({
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

    const isValid = await compareHashedString(user.Password, password);

    if (!isValid)
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'Password incorrect',
      );

    // Extra check if user have either provider id or customer id
    if (!user.provider?.id && !user.customer?.id)
      throw new HttpException(
        HTTPResponses.InternalServerError,
        HTTPErrorString.SomethingWentWrong,
        'Why no customer or provider id ? ' + JSON.stringify([user]),
      );

    // Check delete requests for the user
    const deleteRequest = await req.prisma.deleteRequests.findFirst({
      where: { UserID: user.id },
      select: { IsProcessed: true, id: true },
    });
    if (deleteRequest !== undefined && deleteRequest !== null)
      throw new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.AccountDeleted,
        'Delete request id ' + deleteRequest?.id,
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
      userType: user.userTypes.TypeName,
      keepLoggedIn: true,
      authorisedEncryptedClient: req.body.encryptedClient,
    });

    // Check if provider has uploaded documents or not
    let isDocumentsFullfilled: boolean | undefined = undefined;
    if (user.userTypes.TypeName === 'Provider' && !user.isActive) {
      const attachments = await req.prisma.uploadedFiles.findFirst({
        where: { AND: [{ UserID: { equals: user.id } }, { JsonData: { equals: Prisma.JsonNull } }] },
      });
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
