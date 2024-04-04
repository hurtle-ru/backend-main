import { SendMessageOptions as BasicSendMessageOptions } from "node-telegram-bot-api";


export const TELEGRAM_JOB_NAME = "sendAdminNotification";
export const TELEGRAM_QUEUE_NAME = "telegram";


export interface CustomSendMessageOptions extends BasicSendMessageOptions{
  useDevServerLabel?: boolean | undefined
}

export interface TelegramAdminNotificationJobData {
  text: string,
  options?: CustomSendMessageOptions
}
