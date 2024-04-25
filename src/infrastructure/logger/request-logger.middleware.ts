import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { httpLogger } from "./logger";


export default (req: Request, res: Response, next: NextFunction) => {
  httpLogger(req, res);
  next();
};
