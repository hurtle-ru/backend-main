import { Request, } from "express";


export function getHeaderFirstValue(header: string, req: Request,): string | undefined {
  const value = req.headers[header];
  return Array.isArray(value,) ? value[0] : value;
}

export function getIp(req: Request,): string | undefined {
  return getHeaderFirstValue("x-real-ip", req,) || req.ip;
}
