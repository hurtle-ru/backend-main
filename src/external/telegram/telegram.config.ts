import { cleanEnv, str } from "envalid";


export const telegramConfig = cleanEnv(process.env, {
  TELEGRAM_BOT_TOKEN: str(),
  TELEGRAM_ADMIN_GROUP_CHAT_ID: str(),
  TELEGRAM_ADMIN_DEV_GROUP_CHAT_ID: str(),
});
