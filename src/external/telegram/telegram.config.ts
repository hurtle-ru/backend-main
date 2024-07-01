import { cleanEnv, str, num } from "envalid";


export const telegramConfig = cleanEnv(process.env, {
  TELEGRAM_BOT_TOKEN: str(),

  TELEGRAM_ADMIN_GROUP_ID: str(),

  TELEGRAM_ADMIN_THREAD_ID: num(),
  TELEGRAM_DEV_ADMIN_THREAD_ID: num(),
});
