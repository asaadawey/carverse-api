import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';
import allowedUserType from '@src/middleware/allowedUserType.middleware';
import { OrderHistory, UserTypes } from '@src/interfaces/enums';
import { getOrderStat, OrderStat } from '@src/utils/orderUtils';
import { addDays } from 'date-fns';

//#region GetProviderRevenue
type GetProviderRevenueParams = {};

type GetProviderRevenueRequestBody = {};

type GetProviderRevenueResponse = {
  totalOrders: number;
  totalRevenue: number;
  averageRevenuePerOrder: number;
  orders: Array<{
    id: number;
    orderState: OrderStat;
    OrderTotalAmount: number;
    ProviderRevenue: number;
    OrderCreatedDate: Date;
    customer: {
      users: {
        FirstName: string;
        LastName: string;
      };
    };
    orderServices: Array<{
      id: number;
      serviceName: string;
      serviceDescription?: string;
      price: number;
      car: {
        PlateNumber: string;
        Manufacturer: string;
        Model: string;
        PlateCity: string | null;
        bodyType: string;
      };
    }>;
  }>;
};

type GetProviderRevenueQuery = {
  startDate?: string;
  endDate?: string;
};

export const getProviderRevenueSchema: yup.SchemaOf<{ query: GetProviderRevenueQuery }> = yup.object({
  query: yup.object({
    startDate: yup.string().optional(),
    endDate: yup.string().optional(),
  }),
});

const getProviderRevenueController: RequestHandler<
  GetProviderRevenueParams,
  GetProviderRevenueResponse,
  GetProviderRevenueRequestBody,
  GetProviderRevenueQuery
> = async (req, res, next) => {
  try {
    const startTime = addDays(Date.now(), 1).getTime();
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = addDays(new Date(endDate), 1);
    }

    // Build where clause for provider's orders - only include orders where service is finished
    const whereClause: Prisma.ordersWhereInput = {
      provider: { UserID: req.user.id },
      ...(Object.keys(dateFilter).length > 0 && { OrderCreatedDate: dateFilter }),
      // Only include orders where service was actually finished
    };
    console.log('WHERE CLAUSE', whereClause);
    // Fetch orders with necessary data including order services and car details
    const orders = await req.prisma.orders.findMany({
      where: whereClause,
      orderBy: { OrderCreatedDate: 'desc' },
      select: {
        id: true,
        OrderTotalAmount: true,
        OrderCreatedDate: true,
        customer: {
          select: {
            users: {
              select: {
                FirstName: true,
                LastName: true,
              },
            },
          },
        },
        orderHistory: {
          select: {
            orderHistoryItems: {
              select: {
                HistoryName: true,
              },
            },
          },
        },
        ProviderNetProfit: true,

        orderServices: {
          select: {
            id: true,
            service: {
              select: {
                id: true,
                ServiceName: true,
              },
            },
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

    // Process orders and calculate revenue (only for finished services)
    let totalRevenue = 0;

    const ordersWithDetails = orders.map((order) => {
      const orderState = getOrderStat(order.orderHistory);
      const providerRevenue = order.ProviderNetProfit.toNumber();

      if (orderState.isServiceProvided) {
        totalRevenue += providerRevenue;
      }
      // Process order services to unify service structure
      const unifiedOrderServices = order.orderServices.map((orderService) => {
        // Get service details from either direct service or provider service
        const serviceName =
          orderService.service?.ServiceName ||
          orderService.providerServicesAllowedBodyTypes?.providerService?.services?.ServiceName ||
          'Unknown Service';

        const serviceDescription =
          orderService.providerServicesAllowedBodyTypes?.providerService?.services?.ServiceDescription;

        const price = orderService.providerServicesAllowedBodyTypes?.Price
          ? Number(orderService.providerServicesAllowedBodyTypes.Price)
          : 0;

        return {
          id: orderService.id,
          serviceName,
          serviceDescription,
          price,
          car: {
            PlateNumber: orderService.cars.PlateNumber,
            Manufacturer: orderService.cars.Manufacturer,
            Model: orderService.cars.Model,
            PlateCity: orderService.cars.PlateCity,
            bodyType: orderService.cars.bodyTypes.TypeName,
          },
        };
      });

      return {
        id: order.id,
        orderState,
        OrderTotalAmount: order.OrderTotalAmount,
        ProviderRevenue: providerRevenue,
        OrderCreatedDate: order.OrderCreatedDate,
        customer: order.customer,
        orderServices: unifiedOrderServices,
      };
    });

    const totalOrders = orders.length;
    const averageRevenuePerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Performance logging
    const queryTime = Date.now() - startTime;
    if (req.logger) {
      req.logger.info('getProviderRevenue performance', {
        queryTime: `${queryTime}ms`,
        totalOrders,
        totalRevenue,
        providerId: req.user.id,
        dateRange: { startDate, endDate },
      });
    }

    const response: GetProviderRevenueResponse = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageRevenuePerOrder: Math.round(averageRevenuePerOrder * 100) / 100,
      orders: ordersWithDetails,
    };

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    if (req.logger) {
      // @ts-ignore - Skip type checking as requested
      req.logger.error('getProviderRevenue error', error);
    }
    createFailResponse(req, res, error, next);
  }
};

//#endregion

// Export middleware to restrict access to providers only
export const getProviderRevenueMiddleware = [allowedUserType([UserTypes.Provider])];

export default getProviderRevenueController;
