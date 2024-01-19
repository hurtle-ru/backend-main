import { injectable, singleton } from "tsyringe";
import intersect from "fast_array_intersect";
import { MeetingTypeByRole } from "./meeting.dto";
import { MeetingType } from "@prisma/client";
import { UserRole } from "../auth/auth.dto";
import { SberJazzService } from "../../external/sberjazz/sberjazz.service";
import moment from "moment-timezone";
import { appConfig } from "../../infrastructure/app.config";
import { TelegramService } from "../../external/telegram/telegram.service";
import { MailService } from "../../external/mail/mail.service";


@injectable()
@singleton()
export class MeetingService {
  constructor(
    private readonly jazzService: SberJazzService,
    private readonly telegramService: TelegramService,
    private readonly mailService: MailService,
  ) {}

  doesUserHaveAccessToMeetingSlot(userRole: UserRole, slotTypes: MeetingType[]): boolean {
    return intersect([MeetingTypeByRole[userRole], slotTypes]).length > 0;
  }

  async createRoom(meetingType: MeetingType, user: { firstName: string, lastName: string }): Promise<string> {
    let meetingName = "";
    switch(meetingType) {
      case MeetingType.CONSULTATION_B2B:
        meetingName = "Консультация B2B";
        break;
      case MeetingType.CONSULTATION_B2C:
        meetingName = "Консультация B2C";
        break;
      case MeetingType.INTERVIEW:
        meetingName = "Интервью";
        break;
    }

    const roomName = `${user.lastName} ${user.firstName[0]}. | Хартл ${meetingName}`;
    return await this.jazzService.createRoom(roomName);
  }

  async sendMeetingCreatedToAdminGroup(
    meeting: { name: string, id: string, dateTime: Date },
    manager: { name: string, id: string },
    user: { firstName: string, lastName: string, id: string, role: string },
  )  {
    const dateString = moment(meeting.dateTime)
      .tz(appConfig.TZ)
      .format(`HH:mm | DD.MM.YYYY | [GMT]Z`);


    const text =
      `Забронирована новая встреча!` +
      `\n` +
      `\nНазвание: <b>${meeting.name} (ID: ${meeting.id})</b>` +
      `\nДата: <b>${meeting.dateTime}</b>` +
      `\nМенеджер: <b>${manager.name} (ID: ${manager.id}</b>` +
      `\n` +
      `\nПользователь: <b>${user.lastName} ${user.firstName[0]}. (ID: ${user.id})</b>`;
      `\nРоль: <b>${user.role}</b>`;

    await this.telegramService.sendMessage(text, { parse_mode: "HTML" });
  }
  async sendMeetingCreatedToEmail(
    userEmail: string,
    meeting: { name: string, link: string, dateTime: Date },
  )  {
    const date = moment(meeting.dateTime)
      .locale("ru")
      .tz(appConfig.TZ)
      .format(`D MMM YYYY г. HH:mm по московскому времени`);

    await this.mailService.sendEmail(
      userEmail,
      "Встреча забронирована!",
      {
        name: "meeting-create",
        context: { name: meeting.name, date, link: meeting.link},
      }
    );
  }
}
