import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import addOrder from './addOrder.controller';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { encrypt } from '@src/utils/encrypt';
import { Statements } from './getOrderTotalAmountStatements.controller';

describe('orders/addOrder', () => {
  it('Should succeed', async () => {
    prismaMock.orders.create.mockResolvedValue({ id: 1 });
    prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: true });

    global.mockReq.body = {
      providerId: 1,
      customerId: 1,
      orderServices: [
        {
          carId: 1,
          providerServiceId: 2,
        },
      ],
      orderAmount: 400,
      longitude: 12,
      latitude: 13,
      addressString: 'Bateen',
      paymentMethodName: 'Cash',
      orderTotalAmountStatement: [
        {
          name: 'service fees',
          encryptedValue: encrypt(String(400)),
          relatedProviderServiceId: 2,
        },
      ] as Statements[],
    };

    await addOrder(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { id: 1, clientSecret: null },
      global.mockNext,
    );
  });
  it('Should fail when payment is not active', async () => {
    prismaMock.orders.create.mockResolvedValue({ id: 1 });
    prismaMock.paymentMethods.findUnique.mockResolvedValue({ isActive: false });

    global.mockReq.body = {
      providerId: 1,
      customerId: 1,
      orderServices: [
        {
          carId: 1,
          providerServiceId: 2,
        },
      ],
      orderAmount: 400,
      longitude: 12,
      latitude: 13,
      addressString: 'Bateen',
      paymentMethodName: 'Cash',
      orderTotalAmountStatement: [
        {
          name: 'service fees',
          encryptedValue: encrypt(String(400)),
          relatedProviderServiceId: 2,
        },
      ] as Statements[],
    };

    await addOrder(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    expect(createFailResponse).toHaveBeenCalled();
  });
});
