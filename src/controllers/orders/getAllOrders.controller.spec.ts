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
        OrderStats: {
          orderCurrentStatus: 'in-progress',
          isOrderFinished: false,
          isServiceProvided: false,
        },
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
        paymentMethods: {
          id: 1,
          MethodName: 'Credit Card',
          MethodDescription: 'Payment via credit card',
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

    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, mockOrders, global.mockNext);
  });

  it('should handle database errors gracefully', async () => {
    //@ts-ignore
    prismaMock.orders.findMany.mockRejectedValue(new Error('Database error'));

    await getAllOrders(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, expect.any(Error), global.mockNext);
  });
});
