import TelegramBot, { SendMessageOptions } from "node-telegram-bot-api";
import { telegramConfig } from "./telegram.config";
import { singleton } from "tsyringe";
import { TelegramQueue } from "./mq/telegram.queue";
import { TelegramAdminNotificationJobData } from "./telegram.dto";
import { JobsOptions } from "bullmq/dist/esm/types";
import { HtmlFormatter } from "./telegram.service.text-formatter";
import { appConfig } from "../../infrastructure/app.config";


@singleton()
export class TelegramService {
  private bot: TelegramBot;

  public readonly TextFormatter = new HtmlFormatter();

  private adminGroupId = telegramConfig.TELEGRAM_ADMIN_GROUP_ID;
  private adminGroupThreadId = appConfig.NODE_ENV === "production" ? telegramConfig.TELEGRAM_ADMIN_THREAD_ID : telegramConfig.TELEGRAM_DEV_ADMIN_THREAD_ID;

  constructor(
    private readonly queue: TelegramQueue,
  ) {
    this.bot = new TelegramBot(telegramConfig.TELEGRAM_BOT_TOKEN);
  }

  async enqueueAdminNotification(data: TelegramAdminNotificationJobData, opts?: JobsOptions) {
    await this.queue.enqueueAdminNotification(data, opts);
  }

  async sendMessage(text: string, options?: SendMessageOptions): Promise<void> {
    await this.bot.sendMessage(this.adminGroupId, text, { ...options, message_thread_id: this.adminGroupThreadId });
  }
}
