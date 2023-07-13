declare namespace Express {
  interface Request {
    userId: number;
    updatedToken: string | undefined;
  }
  interface Response {}
}

declare global {
  namespace Express {
    export interface Request {
      userId: number;
      updatedToken: string | undefined;
    }
  }
}
