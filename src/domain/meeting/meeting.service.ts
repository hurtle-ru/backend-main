import moment from "moment-timezone";
import { injectable, singleton } from "tsyringe";
import intersect from "fast_array_intersect";
import { BasicRequestUser, MeetingTypeByRole } from "./meeting.dto";
import { Meeting, MeetingType, MeetingSlot } from "@prisma/client";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { SberJazzService } from "../../external/sberjazz/sberjazz.service";
import { appConfig } from "../../infrastructure/app.config";
import { TelegramService } from "../../external/telegram/telegram.service";
import { MailService } from "../../external/mail/mail.service";
import { HttpError } from "../../infrastructure/error/http.error";
import { prisma } from "../../infrastructure/database/prisma.provider";


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

  doesUserCanBookSlot(slot: any, req: JwtModel): void {
    if (!slot) throw new HttpError(404, "MeetingSlot not found");
    if (slot.meeting) throw new HttpError(409, "MeetingSlot already booked");
    if (!this.doesUserHaveAccessToMeetingSlot(req.user.role, slot.types)) {
      console.log(req.user.role, slot.types, intersect([MeetingTypeByRole[req .user.role], slot.types]).length)
      throw new HttpError(403, "User does not have access to this MeetingSlot type");
    }
  }

  async getBasicRequestUser(req: JwtModel): Promise<BasicRequestUser> {
    let user: BasicRequestUser | null = null;
      const findArgs = {
        where: { id: req.user.id },
        select: { firstName: true, lastName: true, email: true },
      };

      if (req.user.role === UserRole.APPLICANT) user = await prisma.applicant.findUnique(findArgs);
      else if (req.user.role === UserRole.EMPLOYER) user = await prisma.employer.findUnique(findArgs);

    return user!
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
