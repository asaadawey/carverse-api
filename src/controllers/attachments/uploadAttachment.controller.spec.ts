import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import uploadAttachments from './uploadAttachment.controller';
import { createSuccessResponse } from 'src/responses';
import { S3 } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('attachment/uploadAttachments', () => {
  let awsMockService: any = S3;
  let putObjectFn = jest.fn((arg) => ({ ETage: 'test', $metadata: { httpStatusCode: 200 } }));
  it('Should success', async () => {
    prismaMock.uploadedFiles.create.mockResolvedValue({ id: 1 });
    awsMockService.mockReturnValue({
      putObject: putObjectFn,
    });

    global.mockReq = { ...global.mockReq, file: { mimetype: 'image/jpg', buffer: 'testBuffer' } };
    await uploadAttachments(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(putObjectFn).toBeCalled();
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true },
      global.mockNext,
    );
  });
});
