import { NextFunction, Request, Response } from "express";
import { ValidateError } from "@tsoa/runtime";
import { HttpError, HttpErrorBody } from "./http.error";
import { ValidationError } from "yup";

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  let errorResponse: { status: number, body: any } | null = null;

  if (err instanceof SyntaxError) {
    errorResponse = {
      status: 400,
      body: { error: "Request syntax error", details: err },
    };
  } else if (err instanceof ValidateError) {
    errorResponse = {
      status: 422,
      body: {
        error: "Request validation error",
        details: {
          ...err,
        },
        type: "tsoa",
      },
    };
  } else if (err instanceof ValidationError) {
    errorResponse = {
      status: 422,
      body: {
        error: "Request validation error",
        details: err.errors,
        type: "yup",
      },
    };
  } else if (err instanceof HttpError) {
    errorResponse = {
      status: err.status,
      body: {
        error: err.message,
        details: err.details ?? null,
      } as HttpErrorBody,
    };
  }

  if (!errorResponse) {
    errorResponse = {
      status: 500,
      body: { error: "Internal Server Error" },
    };
  }

  const logObject = { "errorResponse": errorResponse.body };
  const logMsg = `HTTP Error ${errorResponse.status}`;

  if (errorResponse.status >= 500) req.log.error({ ...logObject, err }, logMsg);
  else req.log.warn(logObject, logMsg);

  return res.status(errorResponse.status).json(errorResponse.body);
};
