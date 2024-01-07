import TelegramBot, { ParseMode, SendMessageOptions } from "node-telegram-bot-api";
import { telegramConfig } from "./telegram.config";
import { singleton } from "tsyringe";


@singleton()
export class TelegramService {
  private bot: TelegramBot;
  private adminGroupChatId = telegramConfig.TELEGRAM_ADMIN_GROUP_CHAT_ID

  constructor() {
    this.bot = new TelegramBot(telegramConfig.TELEGRAM_BOT_TOKEN);
  }

  async sendMessage(text: string, options: SendMessageOptions): Promise<void> {
    await this.bot.sendMessage(this.adminGroupChatId, text, options);
  }
}