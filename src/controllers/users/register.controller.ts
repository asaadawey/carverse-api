import { RequestHandler } from 'express';
import * as yup from 'yup';
import bcrypt from 'bcrypt';
import constants from '@src/config/environment';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { generateHashedString } from '@src/utils/encrypt';
import { sendOTPEmail } from '@src/services/emailService';
import { generateOtp } from '@src/services/otpService';
import HttpException from '@src/errors/HttpException';
import { getLocalizedMessage } from '@src/utils/localization';
import { HTTPResponses } from '@src/interfaces/enums';

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
  NotificationToken?: string;
  CompanyName?: string;
  CompanyRepresentativeMobileNumber?: string;
  ProviderEmiratesID?: string;
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
    NotificationToken: yup.string().optional(),
    CompanyName: yup.string().when('UserTypeName', {
      is: 'Provider',
      then: yup.string().required('CompanyName is required'),
      otherwise: yup.string().optional(),
    }),
    CompanyRepresentativeMobileNumber: yup.string().when('UserTypeName', {
      is: 'Provider',
      then: yup.string().required('CompanyRepresentativeMobileNumber is required'),
      otherwise: yup.string().optional(),
    }),
    ProviderEmiratesID: yup.string().when('UserTypeName', {
      is: 'Provider',
      then: yup.string().required('ProviderEmiratesID is required'),
      otherwise: yup.string().optional(),
    }),
  }),
});

const registerUser: RequestHandler<
  RegisterRequestQuery,
  RegisterResponse,
  RegisterRequestBody,
  RegisterRequestParams
> = async (req, res, next) => {
  try {
    const {
      UserTypeName,
      Password,
      CompanyName,
      CompanyRepresentativeMobileNumber,
      ProviderEmiratesID,
      PhoneNumber,
      NotificationToken,
      ...rest
    } = req.body;

    const createdUser = await req.prisma.users.create({
      data: {
        ...rest,
        PhoneNumber,
        LastKnownNotificationToken: NotificationToken,
        isEmailVerified: false,

        Password: await generateHashedString(Password),
        userTypes: { connect: { TypeName: UserTypeName } },
        // Only active in case of customer
        isActive: UserTypeName.toLowerCase() === 'customer',
        ...(UserTypeName === 'Customer'
          ? { customer: { create: {} } }
          : {
              provider: {
                create: {
                  CompanyName: CompanyName || '',
                  CompanyRepresentativeMobileNumber: CompanyRepresentativeMobileNumber || '',
                  ProviderEmiratesID: ProviderEmiratesID || '',
                },
              },
            }),
      },
      select: { id: true },
    });

    // Generate OTP using OTP service
    const otpResult = await generateOtp(rest.Email, 'EMAIL_VERIFICATION', req.prisma);

    if (!otpResult.success) {
      throw new HttpException(
        HTTPResponses.InternalServerError,
        getLocalizedMessage(req, 'error.somethingWentWrong'),
        otpResult.error || 'Failed to generate OTP',
      );
    }

    // Send OTP via email
    const emailSent = await sendOTPEmail(rest.Email, otpResult.otp!, 'EMAIL_VERIFICATION');

    createSuccessResponse(req, res, { result: true, id: createdUser.id, emailSent }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default registerUser;
