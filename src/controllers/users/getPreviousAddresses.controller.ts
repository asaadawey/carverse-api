import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import { HTTPErrorString, HTTPResponses, UserTypes } from '@src/interfaces/enums';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';

//#region GetPreviousAddresses
type GetPreviousAddressesRequestQuery = {};

type GetPreviousAddressesResponse = {
  Latitude: number;
  Longitude: number;
  AddressString: string;
  AdditionalAddressData: any;
}[];

type GetPreviousAddressesRequestBody = {};

type GetPreviousAddressesRequestParams = {};

export const GetPreviousAddressesSchema: yup.SchemaOf<{}> = yup.object({});

const getPreviousAddresses: RequestHandler<
  GetPreviousAddressesRequestParams,
  GetPreviousAddressesResponse,
  GetPreviousAddressesRequestBody,
  GetPreviousAddressesRequestQuery
> = async (req, res, next) => {
  try {
    const addresess = await req.prisma.orders.findMany({
      distinct: ['AddressString'],
      select: {
        AddressString: true,
        Latitude: true,
        Longitude: true,
        AdditionalAddressData: true,
      },
      where: {
        customer: {
          UserID: { equals: req.user.id },
        },
      },
    });

    createSuccessResponse(req, res, addresess, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getPreviousAddresses;
