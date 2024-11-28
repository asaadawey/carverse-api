import { UserTypes } from "src/interfaces/enums";
import allowedUserType from "./allowedUserType.middleware";

describe('allowedClient.middlware', () => {
    it('Should success becuase allowed user type is right', () => {
        global.mockReq.user = { userType: UserTypes.Customer }
        global.mockNext = jest.fn(() => ({}))
        allowedUserType([UserTypes.Customer])(
            global.mockReq,
            global.mockRes,
            global.mockNext,
        );

        expect(global.mockNext).toHaveBeenCalled();
    });

    it('Should fail since user type is not right', () => {
        global.mockReq.user = { userType: UserTypes.Admin }
        global.mockNext = jest.fn(() => ({}))
        allowedUserType([UserTypes.Customer])(
            global.mockReq,
            global.mockRes,
            global.mockNext,
        );

        expect(global.mockNext).not.toHaveBeenCalled();
    });
});
