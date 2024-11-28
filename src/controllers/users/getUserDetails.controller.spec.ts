import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import getUserDetails from './getUserDetails.controller';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import { UserTypes } from 'src/interfaces/enums';

describe('users/getUserDetails', () => {
  it('Should success and return user details', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ FirstName: "" });
    await getUserDetails(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, { FirstName: "" }, global.mockNext);
  });

  it('Should fail if body passed with wrong user', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ FirstName: "" });
    global.mockReq = { user: { userType: UserTypes.Customer }, body: { userId: 1 } }
    await getUserDetails(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(0);
    expect(createFailResponse).toHaveBeenCalled();
  });
});
