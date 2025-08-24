import {
  calculateTotalAmount,
  getTimeoutObject,
  getOrderStat,
  userHasAccessToOrder,
  processVouncherCode,
  CalculateTotalAmoundParams,
  Statements,
  OrderStat,
  Timeout,
} from './orderUtils';
import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import { ConstantType, OrderSubmissionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Constants, OrderHistory, PaymentMethods, UserTypes, HTTPResponses } from '@src/interfaces/enums';
import { HttpException } from '@src/errors/index';
import { Token } from '@src/interfaces/token.types';
import { SupportedLanguages } from '@src/locales/index';

jest.mock('@src/utils/encrypt', () => ({
  encrypt: jest.fn((value: string) => `encrypted_${value}`),
}));

jest.mock('@src/utils/amountUtils', () => ({
  getAmount: jest.fn((value: any, type: ConstantType, totalAmount: Decimal) => {
    if (type === ConstantType.Percentage) {
      return totalAmount.mul(new Decimal(value)).div(100).toNumber();
    }
    return new Decimal(value).toNumber();
  }),
}));

describe('orderUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTotalAmount', () => {
    const mockLogger = jest.fn();

    it('should calculate total amount for provider services', async () => {
      const params: CalculateTotalAmoundParams = {
        userId: 1,
        paymentMethodName: PaymentMethods.Cash,
        providerServiceBodyTypesIds: '1,2',
      };

      prismaMock.providerServicesAllowedBodyTypes.findMany.mockResolvedValue([
        {
          id: 1,
          Price: new Decimal(100),
          providerService: {
            services: {
              ServiceName: 'Car Wash',
            },
          },
        },
        {
          id: 2,
          Price: new Decimal(50),
          providerService: {
            services: {
              ServiceName: 'Waxing',
            },
          },
        },
      ]);

      prismaMock.constants.findMany.mockResolvedValue([
        {
          id: 1,
          Name: Constants.VAT,
          Label: 'VAT',
          Value: new Decimal(15),
          Type: ConstantType.Percentage,
        },
        {
          id: 2,
          Name: Constants.ServiceCharges,
          Label: 'Service Charges',
          Value: new Decimal(10),
          Type: ConstantType.Amount,
        },
      ]);

      const result = await calculateTotalAmount(prismaMock, params, mockLogger);

      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('providerRevenue');
      expect(result).toHaveProperty('statements');
      expect(result.statements).toHaveLength(4); // 2 services + VAT + Service Charges
      expect(prismaMock.providerServicesAllowedBodyTypes.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1, 2],
          },
        },
        select: {
          id: true,
          Price: true,
          providerService: {
            select: {
              services: {
                select: {
                  ServiceName: true,
                },
              },
            },
          },
        },
      });
    });

    it('should calculate total amount for auto-select services', async () => {
      const params: CalculateTotalAmoundParams = {
        userId: 1,
        paymentMethodName: PaymentMethods.Credit,
        autoSelectServiceIds: '1',
        autoSelectProposedServicePrice: '200',
      };

      prismaMock.services.findFirst.mockResolvedValue({
        ServiceName: 'Premium Wash',
      });

      prismaMock.constants.findMany.mockResolvedValue([
        {
          id: 1,
          Name: Constants.VAT,
          Label: 'VAT',
          Value: new Decimal(15),
          Type: ConstantType.Percentage,
        },
        {
          id: 2,
          Name: Constants.ServiceCharges,
          Label: 'Service Charges',
          Value: new Decimal(10),
          Type: ConstantType.Amount,
        },
        {
          id: 3,
          Name: Constants.OnlinePaymentCharges,
          Label: 'Online Payment Charges',
          Value: new Decimal(5),
          Type: ConstantType.Percentage,
        },
      ]);

      const result = await calculateTotalAmount(prismaMock, params, mockLogger);

      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('providerRevenue');
      expect(result).toHaveProperty('statements');
      expect(result.statements).toHaveLength(4); // 1 service + VAT + Service Charges + Online Payment Charges
      expect(prismaMock.services.findFirst).toHaveBeenCalledWith({
        where: {
          id: { in: [1] },
        },
        select: {
          ServiceName: true,
        },
      });
    });

    it('should include voucher discount when voucher code is provided', async () => {
      const params: CalculateTotalAmoundParams = {
        userId: 1,
        paymentMethodName: PaymentMethods.Cash,
        providerServiceBodyTypesIds: '1',
        voucherCode: 'FIRSTORDER',
      };

      prismaMock.providerServicesAllowedBodyTypes.findMany.mockResolvedValue([
        {
          id: 1,
          Price: new Decimal(100),
          providerService: {
            services: {
              ServiceName: 'Car Wash',
            },
          },
        },
      ]);

      prismaMock.constants.findMany.mockResolvedValue([
        {
          id: 1,
          Name: Constants.VAT,
          Label: 'VAT',
          Value: new Decimal(15),
          Type: ConstantType.Percentage,
        },
        {
          id: 2,
          Name: Constants.ServiceCharges,
          Label: 'Service Charges',
          Value: new Decimal(10),
          Type: ConstantType.Amount,
        },
      ]);

      prismaMock.vouchers.findFirst.mockResolvedValue({
        Label: 'First Order Discount',
        DiscountPercentage: new Decimal(0.2), // 20% discount
        id: 1,
      });

      prismaMock.orders.findMany.mockResolvedValue([]); // No previous orders

      const result = await calculateTotalAmount(prismaMock, params, mockLogger);

      expect(result.statements).toHaveLength(4); // service + VAT + Service Charges + voucher
      expect(result.statements.some((s) => s.relatedVoucherId === 1)).toBe(true);
    });

    it('should throw error when invalid parameters are provided', async () => {
      const params: CalculateTotalAmoundParams = {
        userId: 1,
        paymentMethodName: PaymentMethods.Cash,
        // Missing required service parameters
      };

      await expect(calculateTotalAmount(prismaMock, params, mockLogger)).rejects.toThrow('Parameters are not valid');
    });
  });

  describe('getTimeoutObject', () => {
    it('should return timeout object with correct seconds and future date', () => {
      const seconds = 300; // 5 minutes
      const result: Timeout = getTimeoutObject(seconds);

      expect(result.seconds).toBe(seconds);
      expect(result.dateAfterAddingSeconds).toBeGreaterThan(Date.now());
      expect(typeof result.dateAfterAddingSeconds).toBe('number');
    });

    it('should handle zero seconds', () => {
      const seconds = 0;
      const beforeCall = Date.now();
      const result: Timeout = getTimeoutObject(seconds);
      const afterCall = Date.now();

      expect(result.seconds).toBe(0);
      expect(result.dateAfterAddingSeconds).toBeGreaterThanOrEqual(beforeCall);
      expect(result.dateAfterAddingSeconds).toBeLessThanOrEqual(afterCall);
    });
  });

  describe('getOrderStat', () => {
    it('should return completed status when order is finished and service provided', () => {
      const orderHistory = [
        {
          orderHistoryItems: { HistoryName: OrderHistory.ServiceFinished },
        },
        {
          orderHistoryItems: { HistoryName: OrderHistory.Pending },
        },
      ];

      const result: OrderStat = getOrderStat(orderHistory);

      expect(result.isServiceProvided).toBe(true);
      expect(result.isOrderFinished).toBe(true);
      expect(result.orderCurrentStatus).toBe('completed');
    });

    it('should return not-completed status when order is finished but service not provided', () => {
      const orderHistory = [
        {
          orderHistoryItems: { HistoryName: OrderHistory.Cancelled },
        },
      ];

      const result: OrderStat = getOrderStat(orderHistory);

      expect(result.isServiceProvided).toBe(false);
      expect(result.isOrderFinished).toBe(true);
      expect(result.orderCurrentStatus).toBe('not-completed');
    });

    it('should return in-progress status when order is not finished and service not provided', () => {
      const orderHistory = [
        {
          orderHistoryItems: { HistoryName: OrderHistory.Accepted },
        },
      ];

      const result: OrderStat = getOrderStat(orderHistory);

      expect(result.isServiceProvided).toBe(false);
      expect(result.isOrderFinished).toBe(false);
      expect(result.orderCurrentStatus).toBe('in-progress');
    });

    it('should return unknown status for edge case', () => {
      const orderHistory = [
        {
          orderHistoryItems: { HistoryName: OrderHistory.ServiceFinished },
        },
      ];

      const result: OrderStat = getOrderStat(orderHistory);

      expect(result.isServiceProvided).toBe(true);
      expect(result.isOrderFinished).toBe(true);
      expect(result.orderCurrentStatus).toBe('completed');
    });

    it('should handle empty order history', () => {
      const orderHistory: any[] = [];

      const result: OrderStat = getOrderStat(orderHistory);

      expect(result.isServiceProvided).toBe(false);
      expect(result.isOrderFinished).toBe(false);
      expect(result.orderCurrentStatus).toBe('in-progress');
    });
  });

  describe('userHasAccessToOrder', () => {
    const mockUser: Token = {
      id: 1,
      name: 'Test User',
      customerId: 1,
      providerId: 1,
      userType: UserTypes.Provider,
      timestamp: new Date(),
      applicationVersion: '1.0.0',
      exp: '',
      keepLoggedIn: true,
      authorisedEncryptedClient: '',
      deviceFingerprint: '',
      userAgent: '',
    };

    it('should allow provider access to auto-select order that is not finished', async () => {
      const providerUser = { ...mockUser, userType: UserTypes.Provider };

      prismaMock.orders.findFirst.mockResolvedValue({
        ProviderID: null,
        OrderSubmissionType: OrderSubmissionType.AUTO_SELECT,
        orderHistory: [
          {
            orderHistoryItems: { HistoryName: OrderHistory.LookingForProvider },
          },
        ],
      });

      const result = await userHasAccessToOrder(1, providerUser, prismaMock, SupportedLanguages.EN);

      expect(result).toBe(true);
    });

    it('should allow provider access to provider-select order assigned to them', async () => {
      const providerUser = { ...mockUser, userType: UserTypes.Provider, providerId: 1 };

      prismaMock.orders.findFirst.mockResolvedValue({
        ProviderID: 1,
        OrderSubmissionType: OrderSubmissionType.PROVIDER_SELECT,
        orderHistory: [],
      });

      const result = await userHasAccessToOrder(1, providerUser, prismaMock, SupportedLanguages.EN);

      expect(result).toBe(true);
    });

    it('should deny provider access to provider-select order assigned to different provider', async () => {
      const providerUser = { ...mockUser, userType: UserTypes.Provider, providerId: 1 };

      prismaMock.orders.findFirst.mockResolvedValue({
        ProviderID: 2, // Different provider
        OrderSubmissionType: OrderSubmissionType.PROVIDER_SELECT,
        orderHistory: [],
      });

      await expect(userHasAccessToOrder(1, providerUser, prismaMock, SupportedLanguages.EN)).rejects.toThrow(
        HttpException,
      );
    });

    it('should allow customer access to their own order', async () => {
      const customerUser = { ...mockUser, userType: UserTypes.Customer, customerId: 1 };

      prismaMock.orders.findFirst.mockResolvedValue({
        id: 1,
        customer: { id: 1 },
      });

      const result = await userHasAccessToOrder(1, customerUser, prismaMock, SupportedLanguages.EN);

      expect(result).toBe(true);
    });

    it('should deny customer access to other customer order', async () => {
      const customerUser = { ...mockUser, userType: UserTypes.Customer, customerId: 1 };

      prismaMock.orders.findFirst.mockResolvedValue(null); // Order not found for this customer

      await expect(userHasAccessToOrder(1, customerUser, prismaMock, SupportedLanguages.EN)).rejects.toThrow(
        HttpException,
      );
    });

    it('should deny access for unsupported user types', async () => {
      const adminUser = { ...mockUser, userType: 'Admin' as any };

      await expect(userHasAccessToOrder(1, adminUser, prismaMock, SupportedLanguages.EN)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('processVouncherCode', () => {
    it('should process FIRSTORDER voucher for first-time customer', async () => {
      const voucherCode = 'FIRSTORDER';
      const providerNetRevenue = 100;
      const userId = 1;

      prismaMock.vouchers.findFirst.mockResolvedValue({
        Label: 'First Order Discount',
        DiscountPercentage: new Decimal(0.2), // 20% discount
        id: 1,
      });

      prismaMock.orders.findMany.mockResolvedValue([]); // No previous orders

      const result = await processVouncherCode(prismaMock, voucherCode, providerNetRevenue, userId);

      expect(result).not.toBeNull();
      expect(result?.label).toBe('First Order Discount');
      expect(result?.relatedVoucherId).toBe(1);
      expect(result?.encryptedValue).toBe(-20); // 20% of 100
      expect(result?.discount?.encryptedValueBeforeDiscount).toBe(100);
      expect(result?.discount?.encryptedValueAfterDiscount).toBe(80);
    });

    it('should not apply FIRSTORDER voucher for returning customer', async () => {
      const voucherCode = 'FIRSTORDER';
      const providerNetRevenue = 100;
      const userId = 1;

      prismaMock.vouchers.findFirst.mockResolvedValue({
        Label: 'First Order Discount',
        DiscountPercentage: new Decimal(0.2),
        id: 1,
      });

      prismaMock.orders.findMany.mockResolvedValue([
        {
          orderHistory: [
            {
              orderHistoryItems: { HistoryName: OrderHistory.ServiceFinished },
            },
          ],
        },
      ]);

      const result = await processVouncherCode(prismaMock, voucherCode, providerNetRevenue, userId);

      expect(result).toBeNull();
    });

    it('should return null for inactive voucher', async () => {
      const voucherCode = 'FIRSTORDER';
      const providerNetRevenue = 100;
      const userId = 1;

      prismaMock.vouchers.findFirst.mockResolvedValue(null); // Voucher not found or inactive

      const result = await processVouncherCode(prismaMock, voucherCode, providerNetRevenue, userId);

      expect(result).toBeNull();
    });

    it('should return null for unknown voucher code', async () => {
      const voucherCode = 'UNKNOWN_CODE';
      const providerNetRevenue = 100;
      const userId = 1;

      const result = await processVouncherCode(prismaMock, voucherCode, providerNetRevenue, userId);

      expect(result).toBeNull();
    });

    it('should handle orders with non-service-provided history for FIRSTORDER', async () => {
      const voucherCode = 'FIRSTORDER';
      const providerNetRevenue = 100;
      const userId = 1;

      prismaMock.vouchers.findFirst.mockResolvedValue({
        Label: 'First Order Discount',
        DiscountPercentage: new Decimal(0.2),
        id: 1,
      });

      prismaMock.orders.findMany.mockResolvedValue([
        {
          orderHistory: [
            {
              orderHistoryItems: { HistoryName: OrderHistory.Cancelled }, // Order cancelled, service not provided
            },
          ],
        },
      ]);

      const result = await processVouncherCode(prismaMock, voucherCode, providerNetRevenue, userId);

      expect(result).not.toBeNull(); // Should still apply voucher since no service was provided
      expect(result?.relatedVoucherId).toBe(1);
    });
  });
});
