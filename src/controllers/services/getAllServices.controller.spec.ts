import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import getAllServices from './getAllServices.controller';
import { createSuccessResponse } from 'src/responses';

describe('services/getAllServices', () => {
  it('Should succeed and return all modules', async () => {
    prismaMock.providerServices.findMany.mockResolvedValue([
      {
        test: 'test',
      },
    ]);
    await getAllServices(global.mockReq, global.mockRes, global.mockNext);

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
