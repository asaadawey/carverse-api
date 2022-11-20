import { modules } from "@prisma/client";
import { RequestHandler } from "express";
import prismaClient from "../../prisma/client";

const prisma = prismaClient;

//#region GetModules

type GetModulesLinkQuery = {};

type GetModulesRequestBody = {};

type GetModulesResponse = {} & modules[];

type GetModulesQueryParams = {};

export const getAllModules: RequestHandler<
  GetModulesLinkQuery,
  GetModulesResponse,
  GetModulesRequestBody,
  GetModulesQueryParams
> = async (req, res, next) => {
  const modules = await prisma.modules.findMany();
  res.status(200).json(modules);
};

//#endregion
