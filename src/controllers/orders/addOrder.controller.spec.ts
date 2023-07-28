import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import addOrder from './addOrder.controller';
import { createSuccessResponse } from 'src/responses';

describe('orders/addOrder', () => {
  it('Should succeed', async () => {
    prismaMock.orders.create.mockResolvedValue({ id: 1 });
    await addOrder(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, { id: 1 }, global.mockNext);
  });
});
