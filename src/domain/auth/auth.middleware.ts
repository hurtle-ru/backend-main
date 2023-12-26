import { Request } from "express";
import jwt from "jsonwebtoken";
import { JwtModel } from "./auth.dto";
import { HttpError } from "../../infrastructure/error/httpError";
import { authConfig } from "./auth.config";

export const expressAuthentication = async (request: Request, securityName: string, scopes?: string[]): Promise<any> => {
  const token = request.header("Authorization");

  if (securityName !== "jwt") throw new Error("Invalid security name");
  if (!token) throw new HttpError(401, "No token provided");

  let decoded: JwtModel["user"];
  try {
    decoded = jwt.verify(token, authConfig.JWT_SECRET_KEY) as JwtModel["user"];
  } catch {
    throw new HttpError(401, "Token is invalid");
  }

  if (scopes && !scopes.includes(decoded.role)) {
    throw new HttpError(403, "Forbidden due to inappropriate role. Your role: " + decoded.role);
  }

  return decoded;
};
