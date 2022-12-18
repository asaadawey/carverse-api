import { prismaMock } from 'helpers/testHelpers/unit-singeleton';
import getAllServices from './getAllServices.controller';
import { createSuccessResponse } from 'responses';

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
