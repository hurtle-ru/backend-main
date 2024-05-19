import { injectable, singleton } from "tsyringe";
import intersect from "fast_array_intersect";
import { MeetingType } from "@prisma/client";
import { GUEST_ROLE, UserRole } from "../auth/auth.dto";
import { SberJazzService } from "../../external/sberjazz/sberjazz.service";
import moment from "moment-timezone";
import { appConfig } from "../../infrastructure/app.config";
import { TelegramService } from "../../external/telegram/telegram.service";
import { EmailService } from "../../external/email/email.service";
import { MeetingNameByType, MeetingTypeByRole, ReminderMinutesBeforeMeeting } from "./meeting.config";
import pino from "pino";
import { AdminPanelService } from "../../external/admin-panel/admin-panel.service";
import { CreateMeetingByApplicantOrEmployerRequest, CreateMeetingGuestRequest, UserMeetingCreator, MeetingCreator } from "./meeting.dto";
import { HtmlFormatter } from "../../external/telegram/telegram.service.text-formatter";


@injectable()
@singleton()
export class MeetingService {
  constructor(
    private readonly jazzService: SberJazzService,
    private readonly telegramService: TelegramService,
    private readonly formatter: HtmlFormatter,
    private readonly emailService: EmailService,
    private readonly adminPanelService: AdminPanelService,
  ) {}

  doesUserHaveAccessToMeetingSlot(userRole: UserRole | typeof GUEST_ROLE, slotTypes: MeetingType[]): boolean {
    return intersect([MeetingTypeByRole[userRole], slotTypes]).length > 0;
  }

  async createRoom(
    meetingType: MeetingType,
    user: { _type: "user", firstName: string, lastName: string }
        | { _type: "guest" },
  ): Promise<string> {
    const meetingName = MeetingNameByType[meetingType];

    let roomName;
    if (user._type === "guest") roomName = `Хартл ${meetingName}`;
    else if (user._type === "user") roomName = `${user.lastName} ${user.firstName[0]}. | Хартл ${meetingName}`;

    return await this.jazzService.createRoom(roomName!);
  }

  async sendMeetingCreatedToAdminGroup(
    meeting: { name: string, id: string, dateTime: Date, type: MeetingType },
    manager: { name: string, id: string },
    user: { _type: "user", firstName: string, lastName: string, id: string, role: string }
        | { _type: "guest", email: string, id: string, role: string},
  )  {

    let text =
      "Забронирована новая встреча!" +
      "\n" +
      `\nНазвание: <b>${meeting.name} (ID: ${meeting.id})</b>` +
      `\nТип: <b>${meeting.type}</b>` +
      `\nДата: <b>${meeting.dateTime}</b>` +
      `\nМенеджер: <b>${manager.name} (ID: ${manager.id}</b>` +
      "\n";

    if (user._type === "user") text += `\nПользователь: <b>${user.lastName} ${user.firstName[0]}. (ID: ${user.id})</b>`;
    else if (user._type === "guest") text += `\nEmail Пользователя (гостя): <b>${user.email}</b>`;

    text += `\nРоль: <b>${user.role}</b>`;

    await this.telegramService.enqueueAdminNotification({
      text,
      options: {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Admin-panel",
              url: this.adminPanelService.getLinkOnMeeting(meeting.id),
            }],
          ],
        },
      },
    });
  }

  async sendMeetingCreatedToEmail(
    logger: pino.Logger,
    userEmail: string,
    meeting: { link: string, dateTime: Date },
  )  {
    const date = moment(meeting.dateTime)
      .locale("ru")
      .tz(appConfig.TZ)
      .format("D MMM YYYY г. HH:mm по московскому времени");

    await this.emailService.enqueueEmail({
      to: userEmail,
      subject: "Встреча забронирована!",
      template: {
        name: "create_meeting",
        context: { date, link: meeting.link },
      },
    });
  }

  async sendMeetingCancelledToEmail(
    logger: pino.Logger,
    userEmail: string,
    role: UserRole.APPLICANT | UserRole.EMPLOYER | typeof GUEST_ROLE,
    meeting: { name: string, dateTime: Date },
  )  {
    const link = this.getMeetingCreateLink(role);
    const date = moment(meeting.dateTime)
      .locale("ru")
      .tz(appConfig.TZ)
      .format("D MMM YYYY г. HH:mm по московскому времени");

    await this.emailService.enqueueEmail({
      to: userEmail,
      subject: "Встреча отменена!",
      template: {
        name: "cancel_meeting",
        context: { name: meeting.name, date, link },
      },
    });
  }

  async scheduleMeetingReminderToEmail(
    logger: pino.Logger,
    userEmail: string,
    meeting: { link: string, dateTime: Date },
  )  {
    const date = moment(meeting.dateTime)
      .locale("ru")
      .tz(appConfig.TZ)
      .format("D MMM YYYY г. HH:mm по московскому времени");

    const emailData = {
      to: userEmail,
      subject: "Напоминание о встрече!",
      template: {
        name: "remind_about_meeting",
        context: { link: meeting.link, date },
      },
    };

    for (const minutesBefore of ReminderMinutesBeforeMeeting) {
      const reminderDelay = this.calculateReminderDelay(meeting.dateTime, minutesBefore);

      if (reminderDelay > 0) {
        await this.emailService.enqueueEmail(emailData, { delay: reminderDelay })
          .then(() => logger.debug({ reminderDelay }, "Scheduled meeting reminder"))
          .catch((error) => logger.error({ error }, "Error scheduling meeting reminder"));
      }
    }
  }

  async sendMeetingNotCreatedBySberJazzRelatedErrorToAdminGroup(
    user: MeetingCreator & { id: string },
    body: CreateMeetingGuestRequest | CreateMeetingByApplicantOrEmployerRequest,
    error: any,
  ) {
    let text = "Ошибка во время попытки создать комнату в Sber Jazz:" + "\n\n";

    const formatter = new HtmlFormatter();
    text += [
      "Слот: " + formatter.bold(formatter.code(body.slotId)),
      "Тип встречи: " + formatter.bold(body.type),
      "",
      "Информация о пользователе: ",
      this.getMeetingNotCreatedBySberJazzRelatedErrorToAdminGroupMessage(user, body),
      "",
      "Ошибка: ",
      formatter.code(error),
    ].join("\n");

    const reply_markup = body._requester !== "GUEST" ? {
      inline_keyboard: [
        [{
          text: "Admin-panel",
          url: {
            "APPLICANT": this.adminPanelService.getLinkOnApplicant(user.id),
            "EMPLOYER":  this.adminPanelService.getLinkOnEmployer(user.id),
          }[body._requester],
        }],
      ],
    } : undefined;

    await this.telegramService.enqueueAdminNotification({
      text,
      options: {
        parse_mode: "HTML",
        reply_markup: reply_markup,
      },
    });
  }

  // TODO: replace roomUrl with meeting id
  async removeMeetingReminderToEmail(
    logger: pino.Logger,
    userEmail: string,
    roomUrl: string,
  ) {
    const jobs = await this.emailService.findIncompleteJobsByEmailAndLink(userEmail, roomUrl);
    for (const job of jobs) {
      if (job.id) {
        logger.debug({ jobId: job.id }, "removeMeetingReminderToEmail: removing job");
        try {
          await this.emailService.removeJob(job.id);
        } catch (e) {
          logger.error({ jobId: job.id }, "Error while removing job");
        }
      }
    }
  }

  getMeetingCreateLink(role: UserRole.APPLICANT | UserRole.EMPLOYER | typeof GUEST_ROLE): string {
    return {
      "APPLICANT": appConfig.DOMAIN + "/account/meetings/",
      "EMPLOYER": "https://t.me/hurtle_support_bot",  // TODO: update link
      "GUEST": "https://hurtle.ru/expert",
    }[role];
  }

  calculateReminderDelay(meetingDateTime: Date, minutesBefore: number): number {
    const reminderTime = new Date(meetingDateTime.getTime() - minutesBefore * 60 * 1000); // 60000 ms in a minute
    return reminderTime.getTime() - new Date().getTime();
  }

  private getMeetingNotCreatedBySberJazzRelatedErrorToAdminGroupMessage(
    user: MeetingCreator & { id: string },
    body: CreateMeetingGuestRequest | CreateMeetingByApplicantOrEmployerRequest,
  ): string {
    let message = [
      "ID: " + this.formatter.code(user.id),
      "Роль: "  + body._requester,
      "Почта: " + this.formatter.code(user.email),
    ].join("\n");

    message += user._type === "user" ?
      "\n" + [
        "Имя: " + this.formatter.bold(user.firstName),
        "Фамилия: " + this.formatter.bold(user.lastName),
      ].join("\n")
      : "";

    return message;
  }
}
