import { SendMessageOptions, } from "node-telegram-bot-api";


export const TELEGRAM_JOB_NAME = "sendAdminNotification";
export const TELEGRAM_QUEUE_NAME = "telegram";


export interface TelegramAdminNotificationJobData {
  text: string,
  options?: SendMessageOptions
}
