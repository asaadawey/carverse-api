import { PrismaClient } from '@prisma/client';
import httpMocks from 'node-mocks-http';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import prisma from 'src/helpers/databaseHelpers/client';

jest.mock('src/helpers/databaseHelpers/client.ts', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

jest.mock('src/responses/success.ts');
jest.mock('src/responses/failure.ts');

export const prismaMock = prisma as unknown as DeepMockProxy<any>;

beforeEach(() => {
  let req: httpMocks.MockRequest<any>;
  let res: httpMocks.MockResponse<any>;
  let next: jest.Func;
  req = httpMocks.createRequest({
    body: {},
  });
  res = httpMocks.createResponse();
  next = jest.fn();

  global.mockReq = req;
  global.mockRes = res;
  global.mockNext = next;

  mockReset(prismaMock);
});
