import { prismaMock } from 'helpers/testHelpers/unit-singeleton';
import getOneProvider from './getOneProvider.controller';
import { createSuccessResponse } from 'responses';

describe('provider/getOneProvider', () => {
  it('Should success and return the order', async () => {
    prismaMock.provider.findFirst.mockResolvedValue({
      id: 111,
    });
    prismaMock.orders.count.mockResolvedValue(1234);
    global.mockReq.params = { id: 1211 };
    await getOneProvider(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { id: 111, ordersCount: 1234 },
      global.mockNext,
    );
  });

  it('Should fail because no order', async () => {
    prismaMock.provider.findFirst.mockResolvedValue();
    global.mockReq.params = { id: 111 };
    await getOneProvider(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, {}, global.mockNext);
  });
});
