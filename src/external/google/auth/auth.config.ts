import { cleanEnv, str, } from "envalid";

export const googleAuthConfig = cleanEnv(process.env, {
  GOOGLE_OAUTH_CLIENT_ID: str(),
  GOOGLE_OAUTH_CLIENT_SECRET: str(),
},);
