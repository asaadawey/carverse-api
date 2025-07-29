import getAllOrders from './getAllOrders.controller';
import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import { HttpException } from '@src/errors/index';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPResponses } from '@src/interfaces/enums';

// Mock dependencies
jest.mock('@src/interfaces/express.types');
jest.mock('@src/utils/logger');

describe('Get All Orders Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockReq.query = { take: '10', skip: '0' };
  });

  it('should successfully get all orders without filters', async () => {
    const mockOrders = [
      {
        id: 1,
        Longitude: -122.4194,
        Latitude: 37.7749,
        AddressString: '123 Main St',
        OrderTotalAmount: 25.99,
        OrderCreatedDate: new Date(),
        AdditionalAddressData: {},
        AdditionalNotes: 'Test note',
        orderHistory: [
          {
            id: 1,
            CreatedOn: new Date(),
            orderHistoryItems: {
              HistoryName: 'Pending',
            },
          },
        ],
        customer: {
          id: 1,
          users: {
            FirstName: 'John',
            LastName: 'Doe',
            Email: 'john@example.com',
            PhoneNumber: '+1234567890',
          },
        },
        provider: {
          id: 1,
          NumberOfOrders: 5,
          users: {
            FirstName: 'Provider',
            LastName: 'User',
            Email: 'provider@example.com',
            PhoneNumber: '+1987654321',
          },
        },
        orderServices: [
          {
            id: 1,
            providerServicesAllowedBodyTypes: {
              Price: 25.99,
              providerService: {
                services: {
                  ServiceName: 'Car Wash',
                  ServiceDescription: 'Basic car wash service',
                },
              },
            },
            cars: {
              PlateNumber: 'ABC123',
              Manufacturer: 'Toyota',
              Model: 'Camry',
              bodyTypes: {
                TypeName: 'Sedan',
              },
              PlateCity: 'City',
            },
          },
        ],
      },
    ];

    //@ts-ignore
    prismaMock.orders.findMany.mockResolvedValue(mockOrders);

    await getAllOrders(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        take: 10,
        skip: 0,
        orderBy: {
          OrderCreatedDate: 'desc',
        },
      }),
    );

    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, mockOrders, global.mockNext);
  });

  it('should filter by customer ID', async () => {
    global.mockReq.query = { take: '10', skip: '0', customerId: '1' };
    //@ts-ignore
    prismaMock.orders.findMany.mockResolvedValue([]);

    await getAllOrders(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { CustomerID: 1 },
        take: 10,
        skip: 0,
        orderBy: {
          OrderCreatedDate: 'desc',
        },
      }),
    );
  });

  it('should filter by provider ID', async () => {
    global.mockReq.query = { take: '10', skip: '0', providerId: '2' };
    //@ts-ignore
    prismaMock.orders.findMany.mockResolvedValue([]);

    await getAllOrders(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ProviderID: 2 },
        take: 10,
        skip: 0,
        orderBy: {
          OrderCreatedDate: 'desc',
        },
      }),
    );
  });

  it('should filter by status', async () => {
    global.mockReq.query = { take: '10', skip: '0', status: 'Pending' };
    //@ts-ignore
    prismaMock.orders.findMany.mockResolvedValue([]);

    await getAllOrders(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orderHistory: {
            some: {
              orderHistoryItems: {
                HistoryName: 'Pending',
              },
            },
          },
        },
        take: 10,
        skip: 0,
        orderBy: {
          OrderCreatedDate: 'desc',
        },
      }),
    );
  });

  it('should combine multiple filters', async () => {
    global.mockReq.query = { take: '5', skip: '10', customerId: '1', providerId: '2', status: 'Completed' };
    //@ts-ignore
    prismaMock.orders.findMany.mockResolvedValue([]);

    await getAllOrders(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.orders.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          CustomerID: 1,
          ProviderID: 2,
          orderHistory: {
            some: {
              orderHistoryItems: {
                HistoryName: 'Completed',
              },
            },
          },
        },
        take: 5,
        skip: 10,
        orderBy: {
          OrderCreatedDate: 'desc',
        },
      }),
    );
  });

  it('should handle database errors gracefully', async () => {
    //@ts-ignore
    prismaMock.orders.findMany.mockRejectedValue(new Error('Database error'));

    await getAllOrders(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, expect.any(Error), global.mockNext);
  });
});
