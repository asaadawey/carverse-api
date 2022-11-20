import { Prisma, users } from "@prisma/client";

//@ts-ignore
type PayloadReturn<T, TSelect> = T;

export type ServiceProps<TWhereUnique, TWhereAll, TSelect, TInclude, TUpdate> =
  {
    findOneUnqiue: <T>(
      where: TWhereUnique,
      select?: TSelect,
      include?: TInclude
    ) => Promise<PayloadReturn<T, TSelect>>;
    findOne: <T>(
      where: TWhereAll,
      select?: TSelect,
      include?: TInclude
    ) => Promise<PayloadReturn<T, TSelect>>;
    findMany: <T>(
      where: TWhereAll,
      update: TSelect,
      include?: TInclude
    ) => Promise<PayloadReturn<T, TSelect>[]>;
    updateOne: (where: TWhereUnique, update: TUpdate) => Promise<boolean>;
  };

export type ResultResponse = { result: boolean };
/*
type a = Prisma.usersSelect

type b = users

type c<T extends keyof a> = Pick<a, T>

type d = c<b>

*/
