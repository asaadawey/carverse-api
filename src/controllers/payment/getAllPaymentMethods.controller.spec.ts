import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getAllPaymentMethods from './getAllPaymentMethods.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('payment/getAllPaymentMethods', () => {
  it('Should return payment methods', async () => {
    prismaMock.paymentMethods.findMany.mockResolvedValue([{ test: 'test' }]);
    await getAllPaymentMethods(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [{ test: 'test' }],
      global.mockNext,
    );
  });
});
