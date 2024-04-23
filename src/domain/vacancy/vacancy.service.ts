import { injectable, singleton } from "tsyringe";
import { VacancyEmploymentType, VacancyExperience, VacancyStatus } from "@prisma/client";
import { TelegramService } from "../../external/telegram/telegram.service";
import { appConfig } from "../../infrastructure/app.config";
import { AdminPanelService } from "../../external/admin-panel/admin-panel.service";

@injectable()
@singleton()
export class VacancyService {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly adminPanelService: AdminPanelService,
  ) {}

  async sendVacancyCreatedToAdminGroup(
    vacancy: {
      id: string,
      name: string,
      shortDescription?: string | null,
      city: string,
      status: VacancyStatus
    },
    employer: {
      id: string,
      firstName: string,
      lastName: string,
      middleName?: string | null,
      contact: string,
      email: string
    }
  ) {
    let text =
      `Создана новая вакансия!` +
      `\n` +
      `\nНазвание вакансии: <b>${vacancy.name}</b>` +
      `\nID: <code>${vacancy.id}</code>` +
      `\nКрактое описание: <b>${vacancy.shortDescription}</b>` +
      `\nГород: <b>${vacancy.city}</b>` +
      `\nСтатус: <b>${vacancy.status}</b>` +
      `\n` +
      `\nРаботодатель (ФИО): <b>${employer.lastName} ${employer.firstName} ${employer.middleName}</b>` +
      `\nID: <code>${vacancy.id}</code>` +
      `\nКонтакт: <b>${employer.contact}</b>` +
      `\nEmail: <b>${employer.email}</b>`

    await this.telegramService.enqueueAdminNotification({
      text,
      options: {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Admin-panel",
              url: this.adminPanelService.getLinkOnVacancy(vacancy.id)
            }]
          ]
        }
      },
    });
  }
}
