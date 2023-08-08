import { RequestHandler } from 'express';
import * as yup from 'yup';
import prisma from 'src/helpers/databaseHelpers/client';
import { createSuccessResponse, createFailResponse } from 'src/responses';

//#region Register
type RegisterRequestQuery = {};

type RegisterResponse = {
  result: boolean;
  id: number;
};

type RegisterRequestBody = {
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  Nationality: string;
  PhoneNumber: string;
  UserTypeName: string;
};

type RegisterRequestParams = {};

export const registerSchema: yup.SchemaOf<{ body: RegisterRequestBody }> = yup.object({
  body: yup.object({
    Email: yup
      .string()
      //  .email("Email is not valid")
      .required('Email field is required'),
    Password: yup.string().required('Password field is required'),
    FirstName: yup.string().required('FirstName field is required'),
    LastName: yup.string().required('LastName field is required'),
    PhoneNumber: yup.string().required('PhoneNumber field is required'),
    Nationality: yup.string().required('Nationality field is required'),
    UserTypeName: yup.string().required('UserTypeName is required'),
  }),
});

const registerUser: RequestHandler<
  RegisterRequestQuery,
  RegisterResponse,
  RegisterRequestBody,
  RegisterRequestParams
> = async (req, res, next) => {
  try {
    const { UserTypeName, ...rest } = req.body;

    const createdUser = await prisma.users.create({
      data: { ...rest, userTypes: { connect: { TypeName: UserTypeName } } },
      select: { id: true },
    });

    createSuccessResponse(req, res, { result: true, id: createdUser.id }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default registerUser;
