import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getImage from './getImage.controller';
import { createSuccessResponse } from '@src/responses/index';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/s3-request-presigner');

describe('attachment/getImage', () => {
    let awsMockService: any = getSignedUrl;
    it('Should success', async () => {
        prismaMock.uploadedFiles.findMany.mockResolvedValue([{ FileName: "", attachment: { Name: "testName" } }]);
        awsMockService.mockReturnValue("test");

        global.mockReq = { ...global.mockReq, file: { mimetype: 'image/jpg', buffer: 'testBuffer' } };
        await getImage(global.mockReq, global.mockRes, global.mockNext);

        expect(createSuccessResponse).toHaveBeenCalledTimes(1);
        expect(getSignedUrl).toBeCalled();
        expect(createSuccessResponse).toHaveBeenCalledWith(
            global.mockReq,
            global.mockRes,
            [{ url: "test", name: "testName" }],
            global.mockNext,
        );
    });
});
