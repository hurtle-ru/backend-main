import { injectable, singleton } from "tsyringe";
import { Prisma, VacancyEmploymentType, VacancyExperience, VacancyStatus } from "@prisma/client";
import { TelegramService } from "../../external/telegram/telegram.service";
import { AdminPanelService } from "../../external/admin-panel/admin-panel.service";
import SearchingUtils from "../../infrastructure/searching/utils";

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
    },
  ) {
    const text =
      "Создана новая вакансия!" +
      "\n" +
      `\nНазвание вакансии: <b>${vacancy.name}</b>` +
      `\nID: <code>${vacancy.id}</code>` +
      `\nКрактое описание: <b>${vacancy.shortDescription}</b>` +
      `\nГород: <b>${vacancy.city}</b>` +
      `\nСтатус: <b>${vacancy.status}</b>` +
      "\n" +
      `\nРаботодатель (ФИО): <b>${employer.lastName} ${employer.firstName} ${employer.middleName}</b>` +
      `\nID: <code>${vacancy.id}</code>` +
      `\nКонтакт: <b>${employer.contact}</b>` +
      `\nEmail: <b>${employer.email}</b>`;

    await this.telegramService.enqueueAdminNotification({
      text,
      options: {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Admin-panel",
              url: this.adminPanelService.getLinkOnVacancy(vacancy.id),
            }],
          ],
        },
      },
    });
  }

  public buildSearchInput(searchQuery: string): Prisma.VacancyWhereInput {
    const searchWords = SearchingUtils.getSearchWords(searchQuery);
    const mode = Prisma.QueryMode.insensitive

    const scalarFieldsInput = searchWords.flatMap((word): Prisma.VacancyWhereInput[] => [
      { name: { contains: word, mode } },
      { city: { contains: word, mode } },

      { employer: { name: { contains: word, mode } } },
    ]);

    return {
      OR: [
        ...scalarFieldsInput,
      ],
    };
  }

  public buildSearchInputWithFts(searchQuery: string): Prisma.VacancyFindManyArgs["where"] {
    searchQuery = SearchingUtils.prepareSearchQueryForFts(searchQuery);
    const mode = Prisma.QueryMode.insensitive

    return {
      OR: [
        { name: { search: searchQuery, mode } },
        { city: { search: searchQuery, mode } },
        { employer: { name: { search: searchQuery, mode } } },
      ],
    };
  }
}
