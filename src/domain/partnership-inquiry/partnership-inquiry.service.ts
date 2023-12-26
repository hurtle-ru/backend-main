import { TelegramService } from "../../external/telegram/telegram.service";
import { BasicPartnershipInquiry } from "./partnership-inquiry.dto";
import { injectable, singleton } from "tsyringe";


@injectable()
@singleton()
export class PartnershipInquiryService {
  constructor(
    private readonly telegramService: TelegramService,
  ) {}

  async sendToAdminGroup(inquiry: BasicPartnershipInquiry)  {
    const text =
      `Поступила новая заявка на сотрудничество от компании: <b>${inquiry.companyName}</b>` +
      `\nПредставитель: <b>${inquiry.representativeName}</b>` +
      `\nКонтакт: <b>${inquiry.contact}</b>` +
      `\nПочта: <b>${inquiry.email}</b>`;

    await this.telegramService.sendMessage(text, { parse_mode: "HTML" });
  }
}