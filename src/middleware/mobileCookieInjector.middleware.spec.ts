import { encrypt } from "@src/utils/encrypt";
import mobileCookieInjector from "./mobileCookieInjector.middleware";
import { AllowedClients } from "@src/interfaces/enums";
import envVars from '@src/config/environment';

describe('mobileCookietInjector.middleware', () => {
    it('Should success and parse cookies from headers', () => {
        global.mockRes.status = jest.fn(() => { });
        global.mockReq.header = jest.fn((arg) => {
            if (arg === envVars.allowedClient.key) return encrypt(AllowedClients.MobileApp)
            else if (arg === 'cookies') return JSON.stringify({ test: "test" })
        });

        mobileCookieInjector(
            global.mockReq,
            global.mockRes,
            global.mockNext,
        );

        expect(global.mockReq.cookies).toMatchObject({ test: "test" })
    });

    it('Should success and shouldnt parse cookies from headers', () => {
        global.mockRes.status = jest.fn(() => { });
        global.mockReq.header = jest.fn((arg) => {
            if (arg === envVars.allowedClient.key) return encrypt(AllowedClients.Web)
            else if (arg === 'cookies') return JSON.stringify({ test: "test" })
        });

        mobileCookieInjector(
            global.mockReq,
            global.mockRes,
            global.mockNext,
        );

        expect(global.mockReq.cookies).toMatchObject({})
    });
});
