import errorMiddleware from './error.middleware';
import { HttpException } from '@src/errors/index';
import { HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';

describe('error.middleware', () => {
  it('Should success and call res.json', () => {
    global.mockRes.status = jest.fn(() => { });

    errorMiddleware(
      new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'I am additional'),
      global.mockReq,
      global.mockRes,
      global.mockNext,
    );

    expect(global.mockRes.status).toHaveBeenCalledWith(HTTPResponses.BusinessError);
  });
});
