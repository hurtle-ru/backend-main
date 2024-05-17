import { cleanEnv, str } from "envalid";


export const sberjazzConfig = {
  API_BASE: "https://api.salutejazz.ru/v1",

  ...cleanEnv(process.env, {
    SALUTE_JAZZ_API_KEY: str(),
  }),

};
