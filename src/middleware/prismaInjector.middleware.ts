import { Prisma, PrismaClient } from "@prisma/client";
import { RequestHandler } from "express";


export const prismaExtends = {

}

export default ((req, res, next) => {
    let tablesWithIsActiveField: string[] = []

    Prisma.dmmf.datamodel.models.forEach((model) => {
        if (model.fields.some(field => field.name === "isActive" && field.type === "Boolean"))
            tablesWithIsActiveField.push(model.name);
    })


    const prisma = new PrismaClient().$extends({
        query: {
            $allModels: {
                async findMany({ args, query, model, operation }) {
                    if (tablesWithIsActiveField.includes(model))
                        args.where = { ...args.where, isActive: { equals: req.query.isActive ? req.query.isActive === 'true' : true } }

                    return query(args)
                },
            },
        },
    })

    //@ts-ignore
    req.prisma = prisma;
    next();
}) as RequestHandler;