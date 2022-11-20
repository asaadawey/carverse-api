import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { HttpException } from "../errors/HttpException";

const errorMiddleware = (
  error: HttpException | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status: number = error.status || 500;
    let message: string = error.message || "Something went wrong";

    if (
      error instanceof Prisma.PrismaClientUnknownRequestError ||
      (error.clientVersion && !error.code)
    ) {
      //Prisma unknown errors custom handler
      if (message.includes("Unknown arg"))
        message = message
          .slice(message.indexOf("Unknown"), message.indexOf("Available"))
          .trim();

      console.error(error.message);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        message = message.slice(message.indexOf("Unique constraint"));
      else if (error.code === "P2025")
        message = message.slice(message.indexOf("An operation failed"));
    }
    console.log(
      `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`
    );
    res.status(status).json({ message, status });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
