import errorMiddleware from './error.middleware';
import { HttpException } from 'errors';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';

describe('error.middleware', () => {
  it('Should success and call res.json', () => {
    global.mockRes.status = jest.fn(() => {});

    errorMiddleware(
      new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'I am additional'),
      global.mockReq,
      global.mockRes,
      global.mockNext,
    );

    expect(global.mockRes.status).toHaveBeenCalledWith(HTTPResponses.BusinessError);
  });
});
