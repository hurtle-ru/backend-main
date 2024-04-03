import TelegramBot from "node-telegram-bot-api";
import { telegramConfig } from "./telegram.config";
import { singleton } from "tsyringe";
import { TelegramQueue } from "./mq/telegram.queue";
import { CustomSendMessageOptions, TelegramAdminNotificationJobData, } from "./telegram.dto";
import { JobsOptions } from "bullmq/dist/esm/types";


@singleton()
export class TelegramService {
  private bot: TelegramBot;
  private adminGroupChatId = telegramConfig.TELEGRAM_ADMIN_GROUP_CHAT_ID

  private TEST_SERVER_LABEL = "Сообщение инициализировано на тестовом сервере!"

  constructor(
    private readonly queue: TelegramQueue,
  ) {
    this.bot = new TelegramBot(telegramConfig.TELEGRAM_BOT_TOKEN);
  }

  async enqueueAdminNotification(data: TelegramAdminNotificationJobData, opts?: JobsOptions) {
    await this.queue.enqueueAdminNotification(data, opts);
  }

  async sendMessage(text: string, options?: CustomSendMessageOptions): Promise<void> {
    text = this.useOptions(text, options)
    await this.bot.sendMessage(this.adminGroupChatId, text, options);
  }

  private useOptions(text: string, options?: CustomSendMessageOptions): string {
    if (options?.useDevServerLabel) text = this.bold(this.TEST_SERVER_LABEL) + "\n\n" + text

    return text
  }

  public bold = (text: string): string => "<b>" + text + "</b>"
}
