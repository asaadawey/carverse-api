import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import confirmOrder from './confirmOrder.controller';
import createSuccessResponse from '@src/responses/success';

describe('users/confirmOrder', () => {
  it('Should return addresses', async () => {
    prismaMock.orderRating.create.mockResolvedValue({ id: 1 });
    await confirmOrder(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true, createdItemId: 1 },
      global.mockNext,
    );
  });
});
