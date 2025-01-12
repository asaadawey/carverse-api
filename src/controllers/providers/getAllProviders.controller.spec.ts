import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getAllProviders from './getAllProviders.controller';
import { createSuccessResponse } from '@src/responses/index';
import { Decimal } from '@prisma/client/runtime/library';

describe('providers/getAllProviders', () => {
  it('Should success and return all providers with no avg', async () => {
    prismaMock.provider.findMany.mockResolvedValue([
      {
        id: 'test',
        users: {},
        orders: [{ ratings: { Rating: new Decimal(3) } }, { ratings: { Rating: new Decimal(3) } }],
      },
    ]);
    await getAllProviders(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [{ id: 'test', users: {}, ratingNumber: 2, ratingsAverage: '3.0' }],
      global.mockNext,
    );
  });
});
