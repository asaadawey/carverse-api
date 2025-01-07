import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getOneOrder from './getOneOrder.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('orders/getOneOrder', () => {
  it('Should success and return the order', async () => {
    prismaMock.orders.findUnique.mockResolvedValue({
      id: 111,
    });
    global.mockReq.params = { id: 1211 };
    await getOneOrder(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, { id: 111 }, global.mockNext);
  });

  it('Should fail because no order', async () => {
    prismaMock.orders.findUnique.mockResolvedValue();
    global.mockReq.params = { id: 111 };
    await getOneOrder(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, {}, global.mockNext);
  });
});
