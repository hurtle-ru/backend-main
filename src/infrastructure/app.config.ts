import { cleanEnv, host, num, port, str, url } from "envalid";

export const appConfig = cleanEnv(process.env, {
  BACKEND_PORT: port(),
  DATABASE_URL: str(),
  TZ: str(),
  SENTRY_DSN: url(),
  NODE_ENV: str({ choices: ["production", "dev"] }),
  DOMAIN: host(), // @example: localhost, b2b.hurtle.ru, b2c.hurtle.ru, hurtle.ru,
  API_VERSION: num({ default: 1 }),
});