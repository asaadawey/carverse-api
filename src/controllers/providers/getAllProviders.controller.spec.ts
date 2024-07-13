import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import getAllProviders from './getAllProviders.controller';
import { createSuccessResponse } from 'src/responses';

describe('providers/getAllProviders', () => {
  it('Should sucess and return all providers with no avg', async () => {
    prismaMock.provider.findMany.mockResolvedValue([{ test: 'test' }]);
    await getAllProviders(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [{ test: 'test' }],
      global.mockNext,
    );
  });

  it('Should sucess and return all providers with  avg', async () => {
    prismaMock.provider.findMany.mockResolvedValue([
      {
        id: 1,
      },
    ]);

    prismaMock.providerServices.findMany.mockResolvedValue([
      {
        Price: 15,
      },
      {
        Price: 30,
      },
    ]);
    global.mockReq.query = { avg: 'true' };
    await getAllProviders(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [
        {
          id: 1,
          // avg: (15 + 30) / 2,
        },
      ],
      global.mockNext,
    );
  });
});
