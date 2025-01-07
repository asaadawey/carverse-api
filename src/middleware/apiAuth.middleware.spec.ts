import apiAuthMiddleware from './apiAuth.middleware';
import envVars from '@src/config/environment';

describe('apiAuth.middleware', () => {
  it('Should fail becuase no auth key is passed', () => {
    try {
      apiAuthMiddleware('');
    } catch (error: any) {
      expect(error.additionalParameters).toEqual('GAPI Key not found');
    }
  });

  it('Should fail becuase auth key is passed but its incorrect', () => {
    try {
      apiAuthMiddleware('wrong');
    } catch (error: any) {
      expect(error.additionalParameters).toEqual(
        'GAPI Key found but doesnt match' + JSON.stringify({ received: 'wrong' }),
      );
    }
  });

  it('Should succeed', (done) => {
    try {
      apiAuthMiddleware(envVars.auth.apiValue);
      done();
    } catch (error: any) {
      expect(error).toBeUndefined();
    }
  });
});
