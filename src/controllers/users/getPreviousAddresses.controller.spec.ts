import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getPreviousAddresses from './getPreviousAddresses.controller';
import createSuccessResponse from '@src/responses/success';

describe('users/getPreviousAddresses', () => {
  it('Should return addresses', async () => {
    prismaMock.orders.findMany.mockResolvedValue([{ Latitude: 123 }]);
    await getPreviousAddresses(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [{ Latitude: 123 }],
      global.mockNext,
    );
  });
});
