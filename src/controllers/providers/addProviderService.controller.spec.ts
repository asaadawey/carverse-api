import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import addProviderServices from './addProviderService.controller';
import { createSuccessResponse } from 'src/responses';

describe('providers/addProviderServices', () => {
  it('Should succeed', async () => {
    prismaMock.providerServices.create.mockResolvedValue({ id: 1 });
    await addProviderServices(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true },
      global.mockNext,
    );
  });
});
