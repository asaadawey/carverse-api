import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import addDeleteRequest from './addDeleteRequest.controller';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { UserTypes } from '@src/interfaces/enums';

describe('users/addDeleteRequest', () => {
  it('Should success and add delete request for normal user', async () => {
    prismaMock.deleteRequests.create.mockResolvedValue({ FirstName: '', id: 123 });
    mockReq.body = {
      comments: 'Test comment',
    };
    mockReq.user = {
      id: 12345,
      userType: UserTypes.Customer,
    };
    await addDeleteRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.deleteRequests.create).toHaveBeenCalledWith({
      data: {
        Comments: 'Test comment',
        UserID: 12345,
        DeletedBy: 12345,
        IsProcessed: false,
        ProcessedBy: undefined,
        ProcessedOn: undefined,
      },
    });
    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
  });

  it('Should success and add delete request for admin user user', async () => {
    prismaMock.deleteRequests.create.mockResolvedValue({ FirstName: '', id: 123 });
    mockReq.body = {
      comments: 'Test comment',
    };
    mockReq.params = { userId: '111' };
    mockReq.user = {
      id: 12345,
      userType: UserTypes.Admin,
    };
    await addDeleteRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.deleteRequests.create).toHaveBeenCalledWith({
      data: {
        Comments: 'Test comment',
        UserID: 111,
        DeletedBy: 12345,
        IsProcessed: true,
        ProcessedBy: 12345,
        ProcessedOn: expect.anything(),
      },
    });
    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
  });

  it('Should fail if body passed with wrong user', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ FirstName: '' });
    global.mockReq = { user: { userType: UserTypes.Customer }, body: { userId: 1 } };
    await addDeleteRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    expect(createFailResponse).toHaveBeenCalled();
  });
});
