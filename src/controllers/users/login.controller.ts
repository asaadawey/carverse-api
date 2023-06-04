import { RequestHandler } from 'express';
import { HttpException } from 'errors';
import * as yup from 'yup';
import prisma from 'helpers/databaseHelpers/client';
import { createSuccessResponse, createFailResponse } from 'responses';
import { HTTPErrorMessages, HTTPResponses } from 'interfaces/enums';
import crypto from 'crypto';
import { generateToken } from 'utils/token';
import { decrypt } from 'utils/encrypt';
import envVars from 'config/environment';
// import createFailResponse from 'responses';

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

type LoginResponse = {
  token: string;
  userInfo: {
    FirstName: string;
    LastName: string;
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
        id: true,
        userTypes: {
          select: {
            TypeName: true,
            AllowedClients: true,
          },
        },
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

    const isValid = crypto.timingSafeEqual(Buffer.from(password), Buffer.from(user.Password));

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
      keepLoggedIn: Boolean(req.body.keepLoggedIn),
      authorisedEncryptedClient: req.body.encryptedClient,
    });

    createSuccessResponse(
      req,
      res,
      {
        token,
        userInfo: {
          id: user.id,
          FirstName: user.FirstName,
          customerId: user.customer?.id,
          providerId: user.provider?.id,
          LastName: user.LastName,
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
