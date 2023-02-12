import { PrismaClient } from '@prisma/client';
import httpMocks from 'node-mocks-http';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import prisma from 'helpers/databaseHelpers/client';

jest.mock('helpers/databaseHelpers/client.ts', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

jest.mock('responses/success.ts');
jest.mock('responses/failure.ts');

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
