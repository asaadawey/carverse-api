import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getOneProvider from './getOneProvider.controller';
import { createSuccessResponse } from '@src/responses/index';
import { Decimal } from '@prisma/client/runtime/library';

describe('provider/getOneProvider', () => {
  it('Should success and return the order', async () => {
    prismaMock.provider.findFirst.mockResolvedValue({
      id: 111,
      providerServices: {},
      users: {},
      orders: [{ ratings: { Rating: new Decimal(3) } }, { ratings: { Rating: new Decimal(3) } }],
    });

    global.mockReq.params = { id: 1211 };
    await getOneProvider(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      {
        id: 111,
        providerServices: {},
        users: {},
        ratingNumber: 2,
        ratingsAverage: '3.0',
      },
      global.mockNext,
    );
  });

  it('Should fail because no order', async () => {
    prismaMock.provider.findFirst.mockResolvedValue(null);
    global.mockReq.params = { id: 111 };
    await getOneProvider(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, null, global.mockNext);
  });
});
