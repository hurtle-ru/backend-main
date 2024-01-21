import { NextFunction, Request, Response } from "express";
import { ValidateError } from "@tsoa/runtime";
import { HttpError, HttpErrorBody } from "./http.error";
import { ValidationError } from "yup";

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);

  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Request syntax error", details: err });
  }
  if (err instanceof ValidateError) {
    return res.status(422).json({
      error: "Request validation error",
      details: {
        ...err,
      },
      type: "tsoa",
    });
  } else if (err instanceof ValidationError) {
    return res.status(422).json({
      error: "Request validation error",
      details: err.errors,
      type: "yup",
    });
  } else if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details ?? null,
    } as HttpErrorBody);
  }

  return res.status(500).json({ error: "Internal Server Error" });
};
