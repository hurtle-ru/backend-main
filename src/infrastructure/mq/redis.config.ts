import { cleanEnv, host, port, str, url } from "envalid";


export const redisConfig = cleanEnv(process.env, {
  REDIS_URL: url(),
  REDIS_HOST: host(),
  REDIS_PORT: port(),
  REDIS_USERNAME: str({ default: "" }),
  REDIS_PASSWORD: str(),
});