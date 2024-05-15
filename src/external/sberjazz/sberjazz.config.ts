import { cleanEnv, str } from "envalid";


export const sberjazzConfig = {
  API_BASE: "https://backend.jazz.sber.ru",
  ...cleanEnv(process.env, {
    SALUTE_JAZZ_API_KEY: str(),
  })
};
