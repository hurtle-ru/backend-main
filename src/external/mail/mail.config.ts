import { bool, cleanEnv, num, port, str } from "envalid";

export const mailConfig = cleanEnv(process.env, {
  MAIL_HOST: str(),
  MAIL_PORT: port(),
  MAIL_SECURE: bool(),
  MAIL_AUTH_USER: str(),
  MAIL_AUTH_PASS: str(),
});