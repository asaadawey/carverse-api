import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import getAllProviderServices from './getAllProviderServices.controller';
import { createSuccessResponse } from 'src/responses';

describe('services/getAllProviderServices', () => {
  it('Should succeed and return all modules', async () => {
    prismaMock.providerServices.findMany.mockResolvedValue([
      {
        test: 'test',
      },
    ]);
    await getAllProviderServices(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [
        {
          test: 'test',
        },
      ],
      global.mockNext,
    );
  });
});
