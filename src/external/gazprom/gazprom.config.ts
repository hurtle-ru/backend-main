import { cleanEnv, str } from "envalid";

export const gazpromConfig = cleanEnv(process.env, {
  GAZPROM_CLIENT_ID: str(),
  GAZPROM_CLIENT_SECRET: str(),
  GAZPROM_REDIRECT_URI: str(),
});
