import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getListOfAttachments from './getListOfAttachments.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('attachments/getListOfAttachments', () => {
  it('Should success', async () => {
    prismaMock.attachments.findMany.mockResolvedValue([]);
    await getListOfAttachments(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});
