import { cleanEnv, str } from "envalid";

export const oauthConfig = cleanEnv(process.env, {
  OAUTH_GOOGLE_CLIENT_ID: str(),
  OAUTH_GOOGLE_CLIENT_SECRET: str(),
});
