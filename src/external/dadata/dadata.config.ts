import { cleanEnv, str } from "envalid";

export const dadataConfig = cleanEnv(process.env, {
  DADATA_TOKEN: str(),
  DADATA_SECRET: str(),
});
