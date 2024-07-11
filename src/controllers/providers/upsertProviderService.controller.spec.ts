import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import upsertProviderServices from './upsertProviderService.controller';
import { createSuccessResponse } from 'src/responses';

describe('providers/upsertProviderServices', () => {
  it('Should succeed without delete', async () => {
    prismaMock.providerServices.upsert.mockResolvedValue({ id: 1 });
    await upsertProviderServices(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.anything(),
      global.mockNext,
    );
  });

  it('Should succeed with delete', async () => {
    prismaMock.providerServices.update.mockResolvedValue({ id: 123 });
    const sentProviderServiceId = 321;
    global.mockReq = { ...global.mockReq, body: { providerServiceId: sentProviderServiceId, isDelete: true } };
    await upsertProviderServices(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.anything(),
      global.mockNext,
    );
  });
});
