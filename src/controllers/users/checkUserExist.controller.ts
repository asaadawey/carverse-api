import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region CheckUserExist
type CheckUserExistRequestQuery = {};

type CheckUserExistResponse = {
  result: boolean;
};

type CheckUserExistRequestBody = {
  Email: string;
  PhoneNumber: string;
};

type CheckUserExistRequestParams = {};

export const checkUserExistSchema: yup.SchemaOf<{ body: CheckUserExistRequestBody }> = yup.object({
  body: yup.object({
    Email: yup
      .string()
      //  .email("Email is not valid")
      .required('Email field is required'),
    PhoneNumber: yup.string().required('PhoneNumber field is required'),
  }),
});

const checkUserExist: RequestHandler<
  CheckUserExistRequestQuery,
  CheckUserExistResponse,
  CheckUserExistRequestBody,
  CheckUserExistRequestParams
> = async (req, res, next) => {
  try {
    const user = await req.prisma.users.findFirst({
      where: {
        OR: [{ PhoneNumber: { equals: req.body.PhoneNumber } }, { Email: { equals: req.body.Email } }],
      },
    });

    createSuccessResponse(req, res, { result: Boolean(user) }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default checkUserExist;
