import { cleanEnv, str } from "envalid";

export const hhConfig = cleanEnv(process.env, {
  HH_CLIENT_ID: str(),
  HH_CLIENT_SECRET: str(),
  HH_REDIRECT_URI: str(),
});