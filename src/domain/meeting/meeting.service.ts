import { injectable, singleton } from "tsyringe";
import intersect from "fast_array_intersect";
import { MeetingType } from "@prisma/client";
import { GUEST_ROLE, UserRole } from "../auth/auth.dto";
import { SberJazzService } from "../../external/sberjazz/sberjazz.service";
import moment from "moment-timezone";
import { appConfig } from "../../infrastructure/app.config";
import { TelegramService } from "../../external/telegram/telegram.service";
import { MailService } from "../../external/mail/mail.service";
import { meetingNameByType, MeetingTypeByRole } from "./meeting.config";
import pino from "pino";


@injectable()
@singleton()
export class MeetingService {
  constructor(
    private readonly jazzService: SberJazzService,
    private readonly telegramService: TelegramService,
    private readonly mailService: MailService,
  ) {}

  doesUserHaveAccessToMeetingSlot(userRole: UserRole | typeof GUEST_ROLE, slotTypes: MeetingType[]): boolean {
    return intersect([MeetingTypeByRole[userRole], slotTypes]).length > 0;
  }

  async createRoom(
    meetingType: MeetingType,
    user: { _type: "user", firstName: string, lastName: string }
        | { _type: "guest" }
  ): Promise<string> {
    const meetingName = meetingNameByType[meetingType];

    let roomName;
    if(user._type === "guest") roomName = `Хартл ${meetingName}`;
    else if(user._type === "user") roomName = `${user.lastName} ${user.firstName[0]}. | Хартл ${meetingName}`;

    return await this.jazzService.createRoom(roomName!);
  }

  async sendMeetingCreatedToAdminGroup(
    meeting: { name: string, id: string, dateTime: Date, type: MeetingType },
    manager: { name: string, id: string },
    user: { _type: "user", firstName: string, lastName: string, id: string, role: string }
        | { _type: "guest", email: string, id: string, role: string},
  )  {

    let text =
      `Забронирована новая встреча!` +
      `\n` +
      `\nНазвание: <b>${meeting.name} (ID: ${meeting.id})</b>` +
      `\nТип: <b>${meeting.type}</b>` +
      `\nДата: <b>${meeting.dateTime}</b>` +
      `\nМенеджер: <b>${manager.name} (ID: ${manager.id}</b>` +
      `\n`;

    if(user._type === "user") text += `\nПользователь: <b>${user.lastName} ${user.firstName[0]}. (ID: ${user.id})</b>`;
    else if(user._type === "guest") text += `\nEmail Пользователя (гостя): <b>${user.email}</b>`;

    text += `\nРоль: <b>${user.role}</b>`;

    await this.telegramService.sendMessage(text, { parse_mode: "HTML" });
  }

  async sendMeetingCreatedToEmail(
    logger: pino.Logger,
    userEmail: string,
    meeting: { link: string, dateTime: Date },
  )  {
    const date = moment(meeting.dateTime)
      .locale("ru")
      .tz(appConfig.TZ)
      .format(`D MMM YYYY г. HH:mm по московскому времени`);

    await this.mailService.sendEmail(
      logger,
      userEmail,
      "Встреча забронирована!",
      {
        name: "create_meeting",
        context: { date, link: meeting.link },
      }
    );
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
      .format(`D MMM YYYY г. HH:mm по московскому времени`);

    await this.mailService.sendEmail(
      logger,
      userEmail,
      "Встреча отменена!",
      {
        name: "cancel_meeting",
        context: { name: meeting.name, date, link },
      }
    );
  }

  async sendMeetingRemindToEmail(
    logger: pino.Logger,
    userEmail: string,
    meeting: { link: string, dateTime: Date },
  )  {
    const date = moment(meeting.dateTime)
      .locale("ru")
      .tz(appConfig.TZ)
      .format(`D MMM YYYY г. HH:mm по московскому времени`);

    await this.mailService.sendEmail(
      logger,
      userEmail,
      "Напоминание о встрече!",
      {
        name: "remind_about_meeting",
        context: { link: meeting.link, date },
      }
    );
  }

  getMeetingCreateLink(role: UserRole.APPLICANT | UserRole.EMPLOYER | typeof GUEST_ROLE): string {
    return {
      "APPLICANT": appConfig.DOMAIN + "/account/meetings/",
      "EMPLOYER": "https://t.me/hurtle_support_bot",  // TODO: update link
      "GUEST": "https://hurtle.ru/expert",
    }[role];
  }
}
