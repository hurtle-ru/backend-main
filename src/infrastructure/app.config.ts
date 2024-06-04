import { cleanEnv, num, port, str, url } from "envalid";
import { webAddress } from "./validation/env/web-address.envalid";


export const appConfig = cleanEnv(process.env, {
  BACKEND_PORT: port(),
  DATABASE_URL: str(),
  TZ: str(),
  SENTRY_DSN: url(),
  NODE_ENV: str({ choices: ["production", "dev"] }),
  DOMAIN: webAddress(), // @example: http://localhost, https://b2b.hurtle.ru, https://b2c.hurtle.ru, https://hurtle.ru,
  API_VERSION: num({ default: 1 }),
});