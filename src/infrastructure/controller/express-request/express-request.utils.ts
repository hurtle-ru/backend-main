import { Request } from "express";
import { appConfig } from "../../app.config";


export function getHeaderFirstValue(header: string, req: Request): string | undefined {
  const value = req.headers[header];
  return Array.isArray(value) ? value[0] : value;
}

export function getIp(req: Request): string | undefined {
  return getHeaderFirstValue("x-real-ip", req) || req.ip;
}

export function isProvidedApiSecretKey(req: Request): boolean {
  const key = req.header("API_KEY");
  return key === appConfig.API_SECRET_KEY
}
