import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';
import { paginationSchema, PaginatorQueryParamsProps, spreadPaginationParams } from '@src/interfaces/express.types';
import allowedUserType from '@src/middleware/allowedUserType.middleware';
import { UserTypes } from '@src/interfaces/enums';
import { getOrderStat, OrderStat } from '@src/utils/orderUtils';
import { Decimal } from '@prisma/client/runtime/library';

//#region GetAllOrders
type GetAllOrdersParams = {};

type GetAllOrdersRequestBody = {};

type GetAllOrdersResponse = Array<{
  id: number;
  OrderStats: OrderStat;
  Longitude: number;
  Latitude: number;
  AddressString: string;
  OrderTotalAmount: number;
  OrderCreatedDate: Date;
  OrderSubmissionType: string;
  AdditionalAddressData: any;
  AdditionalNotes: string | null;
  orderHistory: Array<{
    id: number;
    Notes: string | null;
    CreatedOn: Date;
    orderHistoryItems: {
      HistoryName: string;
    };
  }>;
  customer: {
    id: number;
    users: {
      FirstName: string;
      LastName: string;
      Email: string;
      PhoneNumber: string;
    };
  };
  ProviderNetProfit?: Decimal;
  orderAmountStatements?: Array<{
    Name: string | null;
    Amount: Prisma.Decimal | null;
  }>;
  provider: {
    id: number;
    users: {
      FirstName: string;
      LastName: string;
      Email: string;
      PhoneNumber: string;
    };
  } | null;
  paymentMethods: {
    id: number;
    MethodName: string;
    MethodDescription: string;
  };
  ratings: {
    id: number;
    Rating: Prisma.Decimal | null;
    Feedback: string | null;
  } | null;
  orderServices: Array<{
    id: number;
    service: {
      id: number;
      ServiceName: string;
    } | null;
    providerServicesAllowedBodyTypes: {
      Price: Prisma.Decimal;
      providerService: {
        services: {
          ServiceName: string;
          ServiceDescription: string;
        } | null;
      };
    } | null;
    cars: {
      PlateNumber: string;
      Manufacturer: string;
      Model: string;
      PlateCity: string | null;
      bodyTypes: {
        TypeName: string;
      };
    };
  }>;
}>;

type GetAllOrdersQuery = PaginatorQueryParamsProps & {
  status?: string;
  carId?: string;
  userId?: string;
};

export const getAllOrdersSchema: yup.SchemaOf<{ query: GetAllOrdersQuery }> = yup.object({
  query: paginationSchema.concat(
    yup.object({
      status: yup.string().optional(),
      carId: yup.string().optional(),
      userId: yup.string().optional(),
    }),
  ),
});

const getAllOrders: RequestHandler<
  GetAllOrdersParams,
  GetAllOrdersResponse,
  GetAllOrdersRequestBody,
  GetAllOrdersQuery
> = async (req, res, next) => {
  try {
    // Performance monitoring
    const startTime = Date.now();
    const { carId, userId } = req.query;

    const isProvider = req.user.userType === UserTypes.Provider;
    const isCustomer = req.user.userType === UserTypes.Customer;
    const isAdmin = req.user.userType === UserTypes.Admin;

    // Build optimized where clause
    const whereClause: Prisma.ordersWhereInput = {};

    if (carId) {
      whereClause.orderServices = {
        some: { cars: { id: Number(carId) } },
      };
    }

    if (isCustomer) {
      whereClause.customer = { UserID: req.user.id };
    } else if (isProvider) {
      whereClause.provider = { UserID: req.user.id };
    } else if (isAdmin) {
      // Admin can see all orders
      if (userId) {
        whereClause.OR = [
          { customer: { UserID: { equals: Number(userId) } } },
          { provider: { UserID: { equals: Number(userId) } } },
        ];
      }
    }

    // Optimized query with minimal data fetching
    let orders = await req.prisma.orders.findMany({
      where: whereClause,
      ...spreadPaginationParams(req.query),
      orderBy: { OrderCreatedDate: 'desc' },
      select: {
        id: true,
        Longitude: true,
        Latitude: true,
        OrderSubmissionType: true,
        AddressString: true,
        OrderTotalAmount: true,
        OrderCreatedDate: true,
        AdditionalAddressData: true,
        AdditionalNotes: true,
        ProviderNetProfit: true,
        orderAmountStatements: {
          select: {
            Name: true,
            Amount: true,
            RelatedServiceID: true,
            RelatedProviderServiceID: true,
          },
        },

        orderHistory: {
          select: {
            id: true,
            CreatedOn: true,
            Notes: true,
            orderHistoryItems: {
              select: { HistoryName: true },
            },
          },
          orderBy: { CreatedOn: 'desc' },
        },
        ratings: {
          select: {
            id: true,
            Feedback: true,
            Rating: true,
          },
        },
        // Optimized customer selection
        customer: {
          select: {
            id: true,
            users: {
              select: {
                FirstName: true,
                LastName: true,
                Email: true,
                PhoneNumber: true,
              },
            },
          },
        },
        // Optimized provider selection
        provider: {
          select: {
            id: true,
            users: {
              select: {
                FirstName: true,
                LastName: true,
                Email: true,
                PhoneNumber: true,
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

        // Optimized orderServices selection
        orderServices: {
          select: {
            service: {
              select: {
                id: true,
                ServiceName: true,
              },
            },
            id: true,
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
            cars: {
              select: {
                PlateNumber: true,
                Manufacturer: true,
                Model: true,
                PlateCity: true,
                bodyTypes: {
                  select: { TypeName: true },
                },
              },
            },
          },
        },
      },
    });

    // Performance logging
    const queryTime = Date.now() - startTime;
    if (req.logger) {
      req.logger.info('getAllOrders performance', {
        queryTime: `${queryTime}ms`,
        resultCount: orders.length,

        carId,
      });
    }

    createSuccessResponse(
      req,
      res,
      orders.map((order) => ({ ...order, OrderStats: getOrderStat(order.orderHistory) })),
      next,
    );
  } catch (error: any) {
    if (req.logger) {
      // @ts-ignore - Skip type checking as requested
      req.logger.error('getAllOrders error', error);
    }
    createFailResponse(req, res, error, next);
  }
};

//#endregion

// Export middleware to restrict access to customers only
export const getAllOrdersMiddleware = [allowedUserType([UserTypes.Customer])];

export default getAllOrders;
