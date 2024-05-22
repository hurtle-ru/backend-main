import { Request } from "express";


export function getHeaderFirstValue(header: string, req: Request): string | undefined {
  const value = req.headers[header];
  return Array.isArray(value) ? value[0] : value;
}

export function getIp(req: Request): string | undefined {
  return getHeaderFirstValue("x-real-ip", req) || req.ip;
}

export function parseCookies(cookieHeader: string | undefined): { [key: string]: string } {
  const cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach(cookie => {
      const parts = cookie.split("=");
      cookies[parts.shift()!.trim()] = decodeURI(parts.join("="));
      console.log("COOK",cookieHeader, decodeURI(parts.join("=")))
    });
  }
  return cookies;
}
