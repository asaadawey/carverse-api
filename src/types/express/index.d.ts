declare namespace Express {
  interface Request {
    userId: number;
    providerId: number;
    updatedToken: string | undefined;
  }
  interface Response {}
}
