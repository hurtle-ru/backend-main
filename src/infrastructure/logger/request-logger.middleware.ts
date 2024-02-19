import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";

export default (req: Request, res: Response, next: NextFunction) => {
  const time = new Date().toTimeString().split(" ")[0];
  console.log(`[${time}] Received request: ${req.method} ${req.url}`);
  next();
};
