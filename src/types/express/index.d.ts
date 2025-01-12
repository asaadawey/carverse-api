declare namespace Express {
  type Token = import('../../interfaces/token.types').Token;
  type Prisma = import('@prisma/client').PrismaClient;
  interface Request {
    user: Token;
    prisma: Prisma;
    providerId: number;
    updatedToken: string | undefined;
  }
  interface Response {}
}
