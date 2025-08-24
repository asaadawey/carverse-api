import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';

//#region CheckUserExist
type CheckUserExistRequestQuery = {};

type CheckUserExistResponse = {
  result: boolean;
  isEmailVerified: boolean | undefined;
  isUserActive: boolean | undefined;
};

type CheckUserExistRequestBody = {
  Email?: string;
  PhoneNumber?: string;
};

type CheckUserExistRequestParams = {};

export const checkUserExistSchema: yup.SchemaOf<{ body: CheckUserExistRequestBody }> = yup.object({
  body: yup
    .object({
      Email: yup
        .string() /*.email('Email is not valid')*/
        .optional(),
      PhoneNumber: yup.string().optional(),
    })
    .test('email-or-phone', 'Either Email or PhoneNumber must be provided', (value) => {
      // Value is the body object
      if (!value) return false;
      const hasEmail = Boolean(value.Email && String(value.Email).trim() !== '');
      const hasPhone = Boolean(value.PhoneNumber && String(value.PhoneNumber).trim() !== '');
      return hasEmail || hasPhone;
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
      select: {
        isEmailVerified: true,
        isActive: true,
      },
    });

    createSuccessResponse(
      req,
      res,
      {
        result: Boolean(user),
        isEmailVerified: user ? user.isEmailVerified : undefined,
        isUserActive: user ? user.isActive : undefined,
      },
      next,
    );
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default checkUserExist;
