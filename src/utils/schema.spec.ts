import { createFailResponse } from 'src/responses';
import { validate } from './schema';
import * as yup from 'yup';
describe('schema.ts', () => {
  it('Should not accept any additional parameters', async () => {
    const schema = yup.object({
      body: yup.object({
        shouldPass: yup.string().required(),
      }),
    });
    global.mockReq.body = { shouldPass: 'Hi', shouldNotPass: 'No' };
    await validate(schema)(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toBeCalledTimes(1);
  });

  it('Should success', async () => {
    const schema = yup.object({
      body: yup.object({
        shouldPass: yup.string().required(),
      }),
    });
    global.mockReq.body = { shouldPass: 'Hi' };
    await validate(schema)(global.mockReq, global.mockRes, global.mockNext);

    expect(global.mockNext).toBeCalledTimes(1);
  });
});
