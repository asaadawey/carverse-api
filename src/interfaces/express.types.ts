import { Socket } from 'socket.io';
import * as yup from 'yup';

declare global {
  namespace Express {
    interface Request {
      userId: number;
    }
    interface Response {
      io: Socket;
    }
  }
}

export type PaginatorQueryParamsProps = {
  take?: string;
  skip?: string;
};

export const spreadPaginationParams = ({ skip, take }: PaginatorQueryParamsProps) => {
  return {
    take: take ? Number(take) : undefined,
    skip: skip ? Number(skip) : undefined,
  };
};

export type YupSchema<Body = undefined, Query = undefined, Params = undefined> = yup.SchemaOf<{
  body?: yup.SchemaOf<Body> | undefined;
  query?: yup.SchemaOf<Query> | undefined;
  params?: yup.SchemaOf<Params> | undefined;
}>;
