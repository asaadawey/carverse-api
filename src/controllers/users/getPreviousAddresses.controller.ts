import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import { HTTPErrorString, HTTPResponses, UserTypes } from '@src/interfaces/enums';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { paginationSchema, PaginatorQueryParamsProps, spreadPaginationParams } from '@src/interfaces/express.types';

//#region GetPreviousAddresses
type GetPreviousAddressesRequestQuery = {} & PaginatorQueryParamsProps;

type GetPreviousAddressesResponse = {
  Latitude: number;
  Longitude: number;
  AddressString: string;
  AdditionalAddressData: any;
}[];

type GetPreviousAddressesRequestBody = {};

type GetPreviousAddressesRequestParams = {};

export const GetPreviousAddressesSchema: yup.SchemaOf<{}> = yup.object({
  query: yup.object().concat(paginationSchema),
});
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
      ...spreadPaginationParams(req.query),
    });

    createSuccessResponse(req, res, addresess, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getPreviousAddresses;
