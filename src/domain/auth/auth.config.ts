import { cleanEnv, str } from "envalid";

export const authConfig = cleanEnv(process.env, {
  JWT_SECRET_KEY: str(),
});
