import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: err.issues.map((issue) => issue.message),
    });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error",
  });
};
