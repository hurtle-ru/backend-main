import { Request, Response, NextFunction } from "express";
// import * as Sentry from "@sentry/node";

export default (req: Request, res: Response, next: NextFunction) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
};
