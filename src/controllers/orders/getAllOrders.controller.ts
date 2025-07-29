import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';
import { paginationSchema, PaginatorQueryParamsProps, spreadPaginationParams } from '@src/interfaces/express.types';

//#region GetAllOrders
type GetAllOrdersParams = {};

type GetAllOrdersRequestBody = {};

type GetAllOrdersResponse = {
  id: number;
  Longitude: number;
  Latitude: number;
  AddressString: string;
  OrderTotalAmount: number;
  OrderCreatedDate: Date;
  AdditionalAddressData: any;
  AdditionalNotes: string | null;
  orderHistory: {
    id: number;
    CreatedOn: Date;
    orderHistoryItems: {
      HistoryName: string;
    };
  }[];
  customer: {
    id: number;
    users: {
      FirstName: string;
      LastName: string;
      Email: string;
      PhoneNumber: string;
    };
  };
  provider: {
    id: number;
    NumberOfOrders: number;
    users: {
      FirstName: string;
      LastName: string;
      Email: string;
      PhoneNumber: string;
    };
  };
  orderServices: {
    id: number;
    providerServicesAllowedBodyTypes: {
      Price: Prisma.Decimal;
      providerService: {
        services: {
          ServiceName: string;
          ServiceDescription: string;
        } | null;
      } | null;
    };
    cars: {
      PlateNumber: string;
      Manufacturer: string;
      Model: string;
      bodyTypes: {
        TypeName: string;
      };
      PlateCity: string | null;
    };
  }[];
}[];

type GetAllOrdersQuery = PaginatorQueryParamsProps & {
  status?: string;
  customerId?: string;
  providerId?: string;
};

export const getAllOrdersSchema: yup.SchemaOf<{ query: GetAllOrdersQuery }> = yup.object({
  query: paginationSchema.concat(
    yup.object({
      status: yup.string().optional(),
      customerId: yup.string().optional(),
      providerId: yup.string().optional(),
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
    const { status, customerId, providerId } = req.query;

    // Build where clause based on filters
    const whereClause: Prisma.ordersWhereInput = {};

    if (customerId) {
      whereClause.CustomerID = parseInt(customerId);
    }

    if (providerId) {
      whereClause.ProviderID = parseInt(providerId);
    }

    if (status) {
      whereClause.orderHistory = {
        some: {
          orderHistoryItems: {
            HistoryName: status,
          },
        },
      };
    }

    const orders = await req.prisma.orders.findMany({
      where: whereClause,
      ...spreadPaginationParams(req.query),
      orderBy: {
        OrderCreatedDate: 'desc',
      },
      select: {
        id: true,
        Longitude: true,
        Latitude: true,
        AddressString: true,
        OrderTotalAmount: true,
        OrderCreatedDate: true,
        AdditionalAddressData: true,
        AdditionalNotes: true,
        orderHistory: {
          select: {
            id: true,
            CreatedOn: true,
            orderHistoryItems: {
              select: {
                HistoryName: true,
              },
            },
          },
          orderBy: {
            CreatedOn: 'desc',
          },
        },
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
        provider: {
          select: {
            id: true,
            NumberOfOrders: true,
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
        orderServices: {
          select: {
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
                bodyTypes: {
                  select: {
                    TypeName: true,
                  },
                },
                PlateCity: true,
              },
            },
          },
        },
      },
    });

    createSuccessResponse(req, res, orders, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllOrders;
