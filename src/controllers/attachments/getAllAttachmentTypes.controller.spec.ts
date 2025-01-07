import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getAllAttachmentTypes from './getAllAttachmentTypes.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('attachment/getAllAttachmentTypes', () => {
  it('Should success', async () => {
    prismaMock.attachmentTypes.findMany.mockResolvedValue([]);
    await getAllAttachmentTypes(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});
