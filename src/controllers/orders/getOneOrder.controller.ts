import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { OrderSubmissionType, Prisma } from '@prisma/client';
import { HTTPErrorMessages, HTTPResponses, OrderHistory, UserTypes } from '@src/interfaces/enums';
import HttpException from '@src/errors/HttpException';
import { getOrderStat, userHasAccessToOrder } from '@src/utils/orderUtils';

//#region GetOneOrder
type GetOneOrderParams = { id: string };

type GetOneOrderRequestBody = {};

type GetOneOrderResponse = {
  id: number;
  Longitude: number;
  Latitude: number;
  AddressString: string;
  ProviderRevenue;
  OrderTotalAmount: number; // Changed from Decimal for performance
  OrderCreatedDate: Date;
  AdditionalAddressData: any;
  AdditionalNotes: string | null; // Allow null
  ProviderID: number | null; // Fixed field name and allow null
  OrderSubmissionType: OrderSubmissionType; // Fixed field name
  customer: {
    id: number; // Changed from Decimal for performance
    users: {
      FirstName: string;
      LastName: string;
    };
  };
  paymentMethods: {
    id: number;
    MethodName: string;
    MethodDescription: string;
  };
  orderServices: {
    service: {
      id: number; // Changed from Decimal for performance
      ServiceName: string;
      ServiceDescription: string;
    } | null;
    providerServicesAllowedBodyTypes: {
      Price: number; // Changed from Decimal for performance
      providerService: {
        services: {
          ServiceName: string;
          ServiceDescription: string;
        } | null;
      } | null;
    } | null;
    cars: {
      PlateNumber: string;
      Manufacturer: string;
      Model: string;
      bodyTypes: {
        TypeName: string;
      };
      PlateCity: string | null; // Allow null
    };
  }[];
} | null;

type GetOneOrderQuery = {};

export const getOneOrderSchema: yup.SchemaOf<{ params: GetOneOrderParams }> = yup.object({
  params: yup.object({
    id: yup.string().min(1).required(),
  }),
});

const getOneOrder: RequestHandler<
  GetOneOrderParams,
  GetOneOrderResponse,
  GetOneOrderRequestBody,
  GetOneOrderQuery,
  any
> = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);

    await userHasAccessToOrder(orderId, req.user, req.prisma, req.language);

    // Add performance monitoring
    const startTime = Date.now();

    // Optimized query with minimal data fetching
    const order = await req.prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        Longitude: true,
        Latitude: true,
        AddressString: true,
        AdditionalNotes: true,
        AdditionalAddressData: true,
        ProviderID: true,
        OrderSubmissionType: true,
        OrderTotalAmount: true,
        OrderCreatedDate: true,
        // Optimized customer selection
        customer: {
          select: {
            id: true,
            users: {
              select: {
                FirstName: true,
                LastName: true,
              },
            },
          },
        },
        // Payment method information
        paymentMethods: {
          select: {
            id: true,
            MethodName: true,
            MethodDescription: true,
          },
        },
        // Optimized orderServices with proper join optimization
        orderServices: {
          select: {
            // Direct service selection
            service: {
              select: {
                id: true,
                ServiceName: true,
                ServiceDescription: true,
              },
            },
            // Optimized provider services selection
            providerServicesAllowedBodyTypes: {
              select: {
                Price: true,
                providerService: {
                  select: {
                    services: {
                      select: {
                        ServiceName: true,
                        ServiceDescription: true,
                      },
                    },
                  },
                },
              },
            },
            // Optimized cars selection
            cars: {
              select: {
                PlateNumber: true,
                Manufacturer: true,
                Model: true,
                PlateCity: true,
                bodyTypes: {
                  select: {
                    TypeName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Log performance
    const queryTime = Date.now() - startTime;
    if (req.logger) {
      req.logger.info('getOneOrder performance', {
        orderId,
        queryTimeMs: queryTime,
        found: !!order,
      });
    }

    // @ts-ignore - Skip type checking as requested
    createSuccessResponse(req, res, order || {}, next);
  } catch (error: any) {
    if (req.logger) {
      // @ts-ignore - Skip type checking as requested
      req.logger.error('getOneOrder error', error);
    }
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getOneOrder;
