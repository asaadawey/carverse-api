import * as yup from 'yup';

export type PaginatorQueryParamsProps = {
  take?: string;
  skip?: string;
};

export const paginationSchema: yup.SchemaOf<PaginatorQueryParamsProps> = yup.object().shape({
  take: yup.string().optional().min(1),
  skip: yup.string().optional().min(0),
});

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

export type ResultResponse = { result: boolean; createdItemId: number };
