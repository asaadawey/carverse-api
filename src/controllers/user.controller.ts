import { RequestHandler } from "express";
import { HttpException } from "../errors/HttpException";
import * as yup from "yup";
import { sign } from "jsonwebtoken";
import { Token, tokens } from "../interfaces/token.types";
import prismaClient from "../../prisma/client";

const prisma = prismaClient;

//#region Login
type LoginLinkQuery = {};

type LoginRequestBody = {
  email: string;
  password: string;
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

type LoginQueryParams = {};

export const login: RequestHandler<
  LoginLinkQuery,
  LoginResponse,
  LoginRequestBody,
  LoginQueryParams
> = async (req, res, next): Promise<void> => {
  try {
    console.log(req.body);
    const { email, password } = req.body;

    const user = await prisma.users.findFirst({
      where: { Email: { equals: email } },
      select: {
        Email: true,
        Password: true,
        FirstName: true,
        LastName: true,
        id: true,
        userTypes: true,
        customer: { select: { id: true } },
        provider: { select: { id: true } },
      },
    });
    //TODO HASH PASSWORDS
    if (!user) throw new HttpException(409, "Email or passowrd incorrect");

    if (user.Password !== password)
      throw new HttpException(409, "Email or password incorrect");

    const token = sign(
      {
        id: user.id,
        name: tokens.name,
        timestamp: new Date(),
      } as Token,
      tokens.secret,
      { expiresIn: tokens.expiry }
    );
    res.status(201).json({
      token,
      userInfo: {
        id: user.id,
        FirstName: user.FirstName,
        customerId: user.customer?.id,
        providerId: user.provider?.id,
        LastName: user.LastName,
        UserTypeName: user.userTypes.TypeName,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
//#endregion

//#region Register
type RegisterLinkQuery = {};

type RegisterResponse = {
  result: boolean;
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

type RegisterQueryParams = { grantOnly: string };

const registerBodySchema: yup.SchemaOf<Omit<RegisterRequestBody, "grantOnly">> =
  yup.object().shape({
    Email: yup
      .string()
      //  .email("Email is not valid")
      .required("Email field is required"),
    Password: yup.string().required("Password field is required"),
    FirstName: yup.string().required("FirstName field is required"),
    LastName: yup.string().required("LastName field is required"),
    PhoneNumber: yup.string().required("PhoneNumber field is required"),
    Nationality: yup.string().required("Nationality field is required"),
    UserTypeName: yup.string().required("UserTypeName is required"),
  });

export const registerUser: RequestHandler<
  RegisterLinkQuery,
  RegisterResponse,
  RegisterRequestBody,
  RegisterQueryParams
> = async (req, res, next) => {
  try {
    console.log(req.body);
    await registerBodySchema.validate(req.body);
    const grant = req.query.grantOnly === "true";
    console.log({ grant });
    const { UserTypeName, ...rest } = req.body;

    if (!grant)
      await prisma.users.create({
        data: { ...rest, userTypes: { connect: { TypeName: UserTypeName } } },
      });
    else {
      const user = await prisma.users.findFirst({
        where: {
          OR: [
            { PhoneNumber: { equals: rest.PhoneNumber } },
            { Email: { equals: rest.Email } },
          ],
        },
      });

      if (user)
        throw new HttpException(
          409,
          "There is user found with the same PhoneNumber or Email"
        );
    }
    res.status(201).json({ result: true });
  } catch (error: any) {
    next(error);
  }
};
