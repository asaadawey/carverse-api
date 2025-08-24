import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import addOrder from './addOrder.controller';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { encrypt, decrypt } from '@src/utils/encrypt';
import { Statements } from '@src/utils/orderUtils';
import { HttpException } from '@src/errors/index';
import { HTTPResponses, PaymentMethods, OrderHistory, Constants } from '@src/interfaces/enums';
import { Decimal } from '@prisma/client/runtime/library';
import envVars from '@src/config/environment';

// Mock the utility functions
jest.mock('@src/utils/orderUtils', () => ({
  calculateTotalAmount: jest.fn(),
  getTimeoutObject: jest.fn(() => ({
    seconds: 300,
    dateAfterAddingSeconds: Date.now() + 300000,
  })),
}));

jest.mock('@src/utils/encrypt', () => ({
  encrypt: jest.fn((value: string) => `encrypted_${value}`),
  decrypt: jest.fn((value: string) => value.replace('encrypted_', '')),
}));

jest.mock('@src/utils/payment', () => ({
  createAndGetIntent: jest.fn(() => ({
    clientSecret: 'pi_test_client_secret',
    paymentIntentId: 'pi_test_intent_id',
  })),
}));

jest.mock('@src/config/environment', () => ({
  order: {
    timeout: 300,
  },
}));

const { calculateTotalAmount } = require('@src/utils/orderUtils');

describe('orders/addOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default user context
    global.mockReq.user = {
      id: 1,
      customerId: 1,
      providerId: null,
    };

    // Setup default logger
    global.mockReq.logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    // Setup default query
    global.mockReq.query = {};

    // Default successful calculation mock
    (calculateTotalAmount as jest.Mock).mockResolvedValue({
      totalAmount: 400,
      providerRevenue: 300,
      statements: [
        {
          name: 'service fees',
          encryptedValue: 'encrypted_300',
          relatedProviderServiceId: 2,
        },
        {
          name: 'VAT',
          encryptedValue: 'encrypted_45',
          relatedConstantId: 1,
        },
        {
          name: 'Service charges',
          encryptedValue: 'encrypted_55',
          relatedConstantId: 2,
        },
      ] as Statements[],
    });
  });

  describe('Provider Select Orders', () => {
    it('Should succeed with provider select order (Cash payment)', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });
      prismaMock.cars.findUnique.mockResolvedValue({ BodyTypeID: 1 });
      prismaMock.providerServicesAllowedBodyTypes.findUnique.mockResolvedValue({ BodyTypeID: 1 });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: { building: '123' },
        paymentMethodName: PaymentMethods.Cash,
        additionalNotes: 'Please call before arrival',
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(calculateTotalAmount).toHaveBeenCalledWith(
        global.mockReq.prisma,
        {
          paymentMethodName: PaymentMethods.Cash,
          providerServiceBodyTypesIds: '2',
          autoSelectProposedServicePrice: undefined,
          autoSelectServiceIds: undefined,
          userId: 1,
          voucherCode: undefined,
        },
        expect.any(Function),
      );

      expect(prismaMock.orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          OrderSubmissionType: 'PROVIDER_SELECT',
          AdditionalNotes: 'Please call before arrival',
          Longitude: 12,
          Latitude: 13,
          AddressString: 'Bateen',
          OrderTotalAmount: 400,
          AdditionalAddressData: { building: '123' },
          orderHistory: {
            create: {
              orderHistoryItems: {
                connect: {
                  HistoryName: OrderHistory.Pending,
                },
              },
            },
          },
          provider: { connect: { id: 1 } },
          customer: { connect: { id: 1 } },
        }),
        select: { id: true },
      });

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
      expect(createSuccessResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        {
          id: 1,
          clientSecret: null,
          orderTimeoutSeconds: expect.any(Object),
        },
        global.mockNext,
      );
    });

    it('Should succeed with provider select order (Credit payment)', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });
      prismaMock.cars.findUnique.mockResolvedValue({ BodyTypeID: 1 });
      prismaMock.providerServicesAllowedBodyTypes.findUnique.mockResolvedValue({ BodyTypeID: 1 });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Credit,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(prismaMock.orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          OrderSubmissionType: 'PROVIDER_SELECT',
          orderHistory: {
            create: {
              orderHistoryItems: {
                connect: {
                  HistoryName: OrderHistory.PendingPayment,
                },
              },
            },
          },
        }),
        select: { id: true },
      });

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto Select Orders', () => {
    it('Should succeed with auto select order', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.body = {
        autoSelectServiceIds: '1,2',
        autoSelectProposedServicePrice: '400',
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(calculateTotalAmount).toHaveBeenCalledWith(
        global.mockReq.prisma,
        {
          paymentMethodName: PaymentMethods.Cash,
          providerServiceBodyTypesIds: '',
          autoSelectProposedServicePrice: '400',
          autoSelectServiceIds: '1,2',
          userId: 1,
          voucherCode: undefined,
        },
        expect.any(Function),
      );

      expect(prismaMock.orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          OrderSubmissionType: 'AUTO_SELECT',
          orderHistory: {
            create: {
              orderHistoryItems: {
                connect: {
                  HistoryName: OrderHistory.LookingForProvider,
                },
              },
            },
          },
          orderServices: undefined, // No order services for auto select
        }),
        select: { id: true },
      });

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    });

    it('Should succeed with auto select order and voucher code', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.body = {
        autoSelectServiceIds: '1',
        autoSelectProposedServicePrice: '400',
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
        voucherCode: 'FIRSTORDER',
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(calculateTotalAmount).toHaveBeenCalledWith(
        global.mockReq.prisma,
        expect.objectContaining({
          voucherCode: 'FIRSTORDER',
        }),
        expect.any(Function),
      );

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation and Error Handling', () => {
    it('Should fail when payment method is not found', async () => {
      prismaMock.paymentMethods.findUnique.mockResolvedValue(null);

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: 'InvalidMethod',
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(createFailResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        expect.any(HttpException),
        global.mockNext,
      );
      expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    });

    it('Should fail when payment method is not active', async () => {
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: false });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(createFailResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        expect.any(HttpException),
        global.mockNext,
      );
      expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    });

    it('Should fail when calculated total amount does not match provided amount', async () => {
      (calculateTotalAmount as jest.Mock).mockResolvedValue({
        totalAmount: 500, // Different from request amount
        providerRevenue: 400,
        statements: [],
      });

      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(createFailResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        expect.any(HttpException),
        global.mockNext,
      );
      expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    });

    it('Should fail when car body type does not match service body type', async () => {
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });
      prismaMock.cars.findUnique.mockResolvedValue({ BodyTypeID: 1 });
      prismaMock.providerServicesAllowedBodyTypes.findUnique.mockResolvedValue({ BodyTypeID: 2 }); // Different body type

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(createFailResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        expect.any(HttpException),
        global.mockNext,
      );
      expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    });

    it('Should handle calculateTotalAmount throwing an error', async () => {
      (calculateTotalAmount as jest.Mock).mockRejectedValue(new Error('Calculation failed'));
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(createFailResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        expect.any(Error),
        global.mockNext,
      );
      expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    });
  });

  describe('Order Cleanup on Failure', () => {
    it('Should cleanup created order when error occurs after order creation', async () => {
      const mockCreatedOrder = { id: 123 };

      // Mock the order creation to succeed first, then fail on a subsequent operation
      prismaMock.orders.create.mockResolvedValueOnce(mockCreatedOrder);
      prismaMock.paymentMethods.findUnique.mockResolvedValueOnce({ isActive: true });
      prismaMock.cars.findUnique.mockResolvedValueOnce({ BodyTypeID: 1 });
      prismaMock.providerServicesAllowedBodyTypes.findUnique.mockResolvedValueOnce({ BodyTypeID: 1 });
      prismaMock.orders.delete.mockResolvedValueOnce(mockCreatedOrder);

      // Mock createSuccessResponse to throw an error
      (createSuccessResponse as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Response creation failed');
      });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      try {
        await addOrder(global.mockReq, global.mockRes, global.mockNext);
      } catch (error) {
        // Expected to throw
      }

      expect(prismaMock.orders.delete).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(createFailResponse).toHaveBeenCalled();
    });
  });

  describe('Service ID vs Provider Service Body Type ID', () => {
    it('Should succeed with serviceId instead of providerServiceBodyTypeId', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            serviceId: 5, // Using serviceId instead
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(prismaMock.orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderServices: {
            create: [
              {
                CarID: 1,
                ProviderServiceBodyTypeID: undefined,
                ServiceID: 5,
              },
            ],
          },
        }),
        select: { id: true },
      });

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Order Services', () => {
    it('Should succeed with multiple order services', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });
      prismaMock.cars.findUnique.mockResolvedValue({ BodyTypeID: 1 });
      prismaMock.providerServicesAllowedBodyTypes.findUnique.mockResolvedValue({ BodyTypeID: 1 });

      global.mockReq.body = {
        providerId: 1,
        orderServices: [
          {
            carId: 1,
            providerServiceBodyTypeId: 2,
          },
          {
            carId: 2,
            providerServiceBodyTypeId: 3,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(calculateTotalAmount).toHaveBeenCalledWith(
        global.mockReq.prisma,
        expect.objectContaining({
          providerServiceBodyTypesIds: '2,3',
        }),
        expect.any(Function),
      );

      expect(prismaMock.orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderServices: {
            create: [
              {
                CarID: 1,
                ProviderServiceBodyTypeID: 2,
                ServiceID: undefined,
              },
              {
                CarID: 2,
                ProviderServiceBodyTypeID: 3,
                ServiceID: undefined,
              },
            ],
          },
        }),
        select: { id: true },
      });

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('Should handle empty orderServices array correctly', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.body = {
        autoSelectServiceIds: '1',
        autoSelectProposedServicePrice: '400',
        orderServices: [], // Empty array
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(prismaMock.orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderServices: undefined,
        }),
        select: { id: true },
      });

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    });

    it('Should handle missing additionalAddressData', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.body = {
        autoSelectServiceIds: '1',
        autoSelectProposedServicePrice: '400',
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        // additionalAddressData not provided
        paymentMethodName: PaymentMethods.Cash,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      expect(prismaMock.orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          AdditionalAddressData: {}, // Should default to empty object
        }),
        select: { id: true },
      });

      expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    });

    it('Should skip card payment when skipCardPayment query param is true', async () => {
      prismaMock.orders.create.mockResolvedValue({ id: 1 });
      prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

      global.mockReq.query = { skipCardPayment: 'true' };
      global.mockReq.body = {
        autoSelectServiceIds: '1',
        autoSelectProposedServicePrice: '400',
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        additionalAddressData: {},
        paymentMethodName: PaymentMethods.Credit,
      };

      await addOrder(global.mockReq, global.mockRes, global.mockNext);

      // Should not create payment intent when skipCardPayment is true
      expect(createSuccessResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        expect.objectContaining({
          clientSecret: null,
        }),
        global.mockNext,
      );
    });
  });
});
