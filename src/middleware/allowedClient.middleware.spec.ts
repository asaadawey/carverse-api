import { encrypt } from '@src/utils/encrypt';
import { AllowedClients } from '@src/interfaces/enums';
import envVars from '@src/config/environment';
import allowedClientMiddleware from './allowedClient.middleware';

describe('allowedClient.middlware', () => {
  it('Should success becuase allowed client is right', () => {
    global.mockReq.header = jest.fn((arg) => {
      if (arg === envVars.allowedClient.key) return encrypt(AllowedClients.MobileApp);
    });
    global.mockNext = jest.fn(() => ({}));
    allowedClientMiddleware([AllowedClients.MobileApp])(global.mockReq, global.mockRes, global.mockNext);

    expect(global.mockNext).toHaveBeenCalled();
  });

  it('Should fail since client is not right', () => {
    global.mockReq.header = jest.fn((arg) => {
      if (arg === envVars.allowedClient.key) return encrypt(AllowedClients.Web);
    });
    global.mockNext = jest.fn(() => ({}));
    allowedClientMiddleware([AllowedClients.MobileApp])(global.mockReq, global.mockRes, global.mockNext);

    expect(global.mockNext).not.toHaveBeenCalled();
  });
});
