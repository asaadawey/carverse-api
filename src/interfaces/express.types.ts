import { Response } from "express";
import { Socket } from "socket.io";
export interface ModifiedResponse extends Response {
  io: Socket;
}

export type PaginatorQueryParamsProps = {
  take?: string;
  skip?: string;
};

export const spreadPaginationParams = ({
  skip,
  take,
}: PaginatorQueryParamsProps) => {
  return {
    take: take ? Number(take) : undefined,
    skip: skip ? Number(skip) : undefined,
  };
};
