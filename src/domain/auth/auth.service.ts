import jwt from "jsonwebtoken";
import { JwtModel } from "./auth.dto";
import { authConfig } from "./auth.config";
import * as bcrypt from "bcryptjs";
import { singleton } from "tsyringe";


@singleton()
export class AuthService {
  createToken(payload: JwtModel["user"]): string {
    return jwt.sign(payload, authConfig.JWT_SECRET_KEY);
  }

  async generatePasswordHash(password: string) {
    return await bcrypt.hash(password, 12);
  }

  async comparePasswords(password: string, passwordHash: string) {
    return await bcrypt.compare(password, passwordHash);
  }
}
