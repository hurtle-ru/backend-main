import { injectable, singleton } from "tsyringe";
import { MeetingType, Meeting, MeetingSlot } from "@prisma/client";
import { GUEST_ROLE, JwtModel, UserRole } from "../auth/auth.dto";
import { SberJazzService } from "../../external/sberjazz/sberjazz.service";
import moment from "moment-timezone";
import { appConfig } from "../../infrastructure/app.config";
import { Request as ExpressRequest } from "express";
import { TelegramService } from "../../external/telegram/telegram.service";
import { EmailService } from "../../external/email/email.service";
import { MeetingBusinessInfoByTypes, ReminderMinutesBeforeMeeting } from "./meeting.config";
import pino from "pino";
import { AdminPanelService } from "../../external/admin-panel/admin-panel.service";
import { UserMeetingCreator, MeetingCreator } from "./meeting.dto";
import { HtmlFormatter } from "../../external/telegram/telegram.service.text-formatter";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError } from "../../infrastructure/error/http.error";
import { logger } from "../../infrastructure/logger/logger";
import { BasicManager } from "../manager/manager.dto";


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
    return slotTypes.some(slotType => MeetingBusinessInfoByTypes[slotType]?.roles.includes(userRole));
  }

  async tryToCreateSaluteJazzRoomOrNotifyAdminsAndThrow(user: MeetingCreator & { id: string, role: "APPLICANT" | "EMPLOYER" | "GUEST" }, body: Pick<Meeting, "slotId" | "type">): Promise<string | never> {
    try {
      return await this.createSaluteJazzRoom(body.type, user!);
    } catch (error) {
      logger.error({ error }, "Can not create Sber jazz room");

      await this.sendMeetingNotCreatedBySberJazzRelatedErrorToAdminGroup(
        user!,
        body,
        error
      );

      throw new HttpError(409, "Related service not available, retry later");
    }
  }

  async createSaluteJazzRoom(
    meetingType: MeetingType,
    user: MeetingCreator,
  ): Promise<string> {
    const meetingName = MeetingBusinessInfoByTypes[meetingType].name;

    let name;
    if (user._type === "user") {
      name = `${(user as UserMeetingCreator).lastName} ${(user as UserMeetingCreator).firstName[0]}. | Хартл ${meetingName}`
    } else {
      name = `Хартл ${meetingName}`
    }
    return await this.jazzService.createRoom(name);
  }

  async notifyMeetingCreatedToAdminGroupAndUserEmail(
    user: MeetingCreator,
    meeting: Pick<Meeting, "id" | "name" | "type" | "roomUrl">,
    slot: Pick<MeetingSlot, "dateTime"> & { manager: Pick<BasicManager, "name" | "id"> },
    req: ExpressRequest & JwtModel,
    isRescheduling: boolean = false,
  ) {
    await this.sendMeetingCreatedToAdminGroup(
      { name: meeting.name, id: meeting.id, dateTime: slot.dateTime, type: meeting.type },
      { name: slot.manager.name, id: slot.manager.id },
      { ...user!, id: req.user.id, role: req.user.role },
      isRescheduling,
    );

    await this.sendMeetingCreatedToEmail(
      req.log,
      user!.email,
      {
        name: meeting.name,
        link: meeting.roomUrl,
        dateTime: slot.dateTime,
        emailDescriptionOnCreate: MeetingBusinessInfoByTypes[meeting.type].emailDescriptionOnCreate },
    );
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

  async sendMeetingCreatedToAdminGroup(
    meeting: { name: string, id: string, dateTime: Date, type: MeetingType },
    manager: { name: string, id: string },
    user: { _type: "user", firstName: string, lastName: string, id: string, role: string }
        | { _type: "guest", email: string, id: string, role: string},
    isRescheduling: boolean = false,
  )  {

    let text =
      (isRescheduling ? "Перенесена встреча!" : "Забронирована новая встреча!") +
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
    meeting: { name: string, link: string, dateTime: Date, emailDescriptionOnCreate: string },
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
        context: {
          date,
          meetingName: meeting.name,
          link: meeting.link,
          emailDescriptionOnCreate: meeting.emailDescriptionOnCreate,
        },
      },
    });
  }

  async sendMeetingCancelledToEmail(
    logger: pino.Logger,
    userEmail: string,
    role: UserRole.APPLICANT | UserRole.EMPLOYER | typeof GUEST_ROLE,
    meeting: { applicantName: string, name: string, dateTime: Date },
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
        context: {
          name: meeting.applicantName,
          meetingName: meeting.name,
          date,
          link,
        },
      },
    });
  }

  async scheduleMeetingReminderToEmail(
    logger: pino.Logger,
    userEmail: string,
    meeting: { link: string, name: string, dateTime: Date, emailDescriptionOnRemind: string },
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
        context: {
          date,
          meetingName: meeting.name,
          link: meeting.link,
          emailDescriptionOnRemind: meeting.emailDescriptionOnRemind,
        },
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
    user: MeetingCreator & { id: string, role: "APPLICANT" | "EMPLOYER" | "GUEST" },
    body: Pick<Meeting, "slotId" | "type">,
    error: any,
  ) {
    let text = "Ошибка во время попытки создать комнату в Sber Jazz:" + "\n\n";

    const formatter = new HtmlFormatter();
    text += [
      "Слот: " + formatter.bold(formatter.code(body.slotId)),
      "Тип встречи: " + formatter.bold(body.type),
      "",
      "Информация о пользователе: ",
      this.getMeetingNotCreatedBySberJazzRelatedErrorToAdminGroupMessage({ ...user, role: user.role }),
      "",
      "Ошибка: ",
      formatter.code(error),
    ].join("\n");

    const reply_markup = user.role !== "GUEST" ? {
      inline_keyboard: [
        [{
          text: "Admin-panel",
          url: {
            "APPLICANT": this.adminPanelService.getLinkOnApplicant(user.id),
            "EMPLOYER":  this.adminPanelService.getLinkOnEmployer(user.id),
          }[user.role],
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

  async doesSlotAvailableForBookingOrThrow(slotId: string, requester_role: JwtModel["user"]["role"]) {
    const slot = await this.findFutureSlotById(slotId)

    if (!slot) throw new HttpError(404, "MeetingSlot not found");
    if (slot.meeting) throw new HttpError(409, "MeetingSlot already booked");

    if (!this.doesUserHaveAccessToMeetingSlot(requester_role, slot.types))
      throw new HttpError(403, "User does not have access to this MeetingSlot type");

    return slot
  }

  async findFutureSlotById(slotId: string) {
    return await prisma.meetingSlot.findUnique({
      where: {
        id: slotId,
        dateTime: { gte: new Date() },
      },
      select: {
        meeting: true,
        types: true,
        dateTime: true,
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            id: true,
            dueDate: true,
            status: true,
            guestEmail: true,
            successCode: true,
            type: true,
          },
        },
      },
    });
  }

  async getMeetingApplicantOrEmployerCreator(meeting: Pick<Meeting, "applicantId" | "employerId">) {
    if (meeting.applicantId) {
      return { _type: "user", ...await prisma.applicant.findUnique({ where: { id: meeting.applicantId }}) as any }
    }
    if (meeting.employerId) {
      return { _type: "user", ...await prisma.employer.findUnique({ where: { id: meeting.employerId }}) as any }
    }
  }

  private getMeetingNotCreatedBySberJazzRelatedErrorToAdminGroupMessage(
    user: MeetingCreator & { id: string, role: string },
  ): string {
    let message = [
      "ID: " + this.formatter.code(user.id),
      "Роль: "  + user.role,
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
