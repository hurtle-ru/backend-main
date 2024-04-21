import { injectable } from "tsyringe";
import * as moment from 'moment-timezone';
import {
  Body,
  Controller,
  Delete,
  Exception,
  Get,
  Middlewares, Patch,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";
import { MeetingService } from "./meeting.service";
import { GUEST_ROLE, JwtModel, UserRole } from "../auth/auth.dto";
import {
  BasicMeeting,
  CreateMeetingGuestRequest,
  GetMeetingResponse, PatchMeetingByManagerRequest, ExportAllResponse, CreateMeetingByApplicantOrEmployerRequest, CreateMeetingRequestSchema, CreateMeetingByApplicantRequestSchema, CreateMeetingByEmployerRequestSchema, PatchMeetingByManagerRequestSchema, MeetingCreator,
} from "./meeting.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import { Request as ExpressRequest } from "express";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { Readable } from "stream";
import path from "path";
import { artifactConfig, AVAILABLE_VIDEO_FILE_MIME_TYPES } from "../../external/artifact/artifact.config";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware"
import { AVAILABLE_PASSPORT_FILE_MIME_TYPES, meetingConfig } from "./meeting.config";
import { MeetingPaymentService } from "./payment/payment.service";
import { MeetingStatus } from "@prisma/client";
import { validateSyncByAtLeastOneSchema } from "../../infrastructure/validation/requests/utils.yup";
import { AxiosError } from "axios";
import { logger } from "../../infrastructure/logger/logger";


@injectable()
@Route("api/v1/meetings")
@Tags("Meeting")
export class MeetingController extends Controller {
  constructor(
    private readonly paymentService: MeetingPaymentService,
    private readonly meetingService: MeetingService,
    private readonly artifactService: ArtifactService,
  ) {
    super();
  }

  @Post("")
  @Security("jwt", [GUEST_ROLE, UserRole.APPLICANT, UserRole.EMPLOYER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & { "error": "MeetingSlot not found" }>(404)
  @Response<HttpErrorBody & { "error":
      | "Invalid body request for applicant"
      | "Invalid body request for employer"
      | "Invalid body request for guest"
      | "User does not have access to this MeetingSlot type"
  }>(403)
  @Response<HttpErrorBody & { "error":
      | "MeetingSlot already booked"
      | "Meeting requires MeetingPayment with SUCCESS status"
      | "Invalid MeetingPayment success code"
      | "Paid meeting type and passed type from request body dont match"
      | "Related service not available, retry later"
  }>(409)
  @Response<HttpErrorBody & { "error": "Too Many Requests" }>(429)
  public async create(
    @Request() req: ExpressRequest & JwtModel,
    @Body() body: CreateMeetingGuestRequest | CreateMeetingByApplicantOrEmployerRequest,
  ): Promise<BasicMeeting> {
    body = validateSyncByAtLeastOneSchema([
      CreateMeetingRequestSchema,
      CreateMeetingByApplicantRequestSchema,
      CreateMeetingByEmployerRequestSchema,
    ], body)

    const { _requester, ...bodyData } = body;

    if(req.user.role === UserRole.APPLICANT && _requester !== UserRole.APPLICANT) throw new HttpError(403, "Invalid body request for applicant");
    if(req.user.role === UserRole.EMPLOYER && _requester !== UserRole.EMPLOYER) throw new HttpError(403, "Invalid body request for employer");
    if(req.user.role === GUEST_ROLE && _requester !== GUEST_ROLE) throw new HttpError(403, "Invalid body request for guest");

    const slot = await prisma.meetingSlot.findUnique({
      where: {
        id: bodyData.slotId,
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

    if(!slot) throw new HttpError(404, "MeetingSlot not found");
    if(slot.meeting) throw new HttpError(409, "MeetingSlot already booked");
    if(!this.meetingService.doesUserHaveAccessToMeetingSlot(req.user.role, slot.types))
      throw new HttpError(403, "User does not have access to this MeetingSlot type");

    // TODO: Если платные встречи станут доступны для обычных пользователей и/или бесплатные станут доступны гостям, нужно будет пересмотреть логику этой валидации
    if(this.paymentService.doesMeetingTypeRequiresPayment(bodyData.type)) {
      const slotPaymentPaidByGuest = prisma.meetingPayment.getPaidByGuest(slot.payments, req.user.id);

      if(!slotPaymentPaidByGuest)
        throw new HttpError(409, "Meeting requires MeetingPayment with SUCCESS status");

      if(slotPaymentPaidByGuest.successCode !== (bodyData as CreateMeetingGuestRequest).successCode)
        throw new HttpError(409, "Invalid MeetingPayment success code");

      if(slotPaymentPaidByGuest.type !== bodyData.type)
        throw new HttpError(409, "Paid meeting type and passed type from request body dont match");
    }

    let user: MeetingCreator | null = null;

    const findArgs = {
      where: { id: req.user.id },
      select: { firstName: true, lastName: true, email: true },
    };

    if(req.user.role === UserRole.APPLICANT) user = { _type: "user", ...await prisma.applicant.findUnique(findArgs) as any };
    if(req.user.role === UserRole.EMPLOYER) user = { _type: "user", ...await prisma.employer.findUnique(findArgs) as any };
    else if(req.user.role === GUEST_ROLE) user = { _type: "guest", email: req.user.id }

    let roomUrl = ''
    try {
      roomUrl = await this.meetingService.createRoom(bodyData.type, user!);
    }
    catch (error) {
      logger.error("Can not create Sber jazz room, error: " + error)

      this.meetingService.sendMeetingNotCreatedBySberJazzRelatedErrorToAdminGroup({...user!, id: req.user.id}, body, error)

      throw new HttpError(409, "Related service not available, retry later")
    }

    let description = "На этой встрече пройдет вводное собеседование с HR-специалистом, чтобы создать твою карту компетенций, а также нейрорезюме."
        + "\n Также, в процессе нашей беседы мы поможем тебе четко сформулировать ценность на рынке труда. "
        + "В конце встречи ты получишь обратную связь, которая поможет тебе расти и развиваться.";

    if(bodyData.type !== "INTERVIEW") description = bodyData.description;

    const meeting = await prisma.meeting.create({
      data: {
        roomUrl,
        name: bodyData.name,
        description: description,
        slotId: bodyData.slotId,
        type: bodyData.type,
        applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
        employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
        guestEmail: req.user.role === GUEST_ROLE ? req.user.id : undefined,
      },
    });

    await this.meetingService.sendMeetingCreatedToAdminGroup(
      { name: bodyData.name, id: meeting.id, dateTime: slot.dateTime, type: bodyData.type },
      { name: slot.manager.name, id: slot.manager.id },
      { ...user!, id: req.user.id, role: req.user.role }
    );

    await this.meetingService.sendMeetingCreatedToEmail(
      req.log,
      user!.email,
      { link: roomUrl, dateTime: slot.dateTime },
    );

    await this.meetingService.scheduleMeetingReminderToEmail(
      req.log,
      user!.email,
      { link: roomUrl, dateTime: slot.dateTime },
    );

    return meeting;
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("feedback" | "scriptProtocols" | "applicant" | "employer" | "slot")[],
    @Query() applicantId?: string,
    @Query() employerId?: string,
    @Query() hasFeedback?: boolean,
  ): Promise<PageResponse<GetMeetingResponse>> {
    const where = {
      applicantId: applicantId ?? undefined,
      employerId: employerId ?? undefined,
      feedback: hasFeedback === true ? { some: {} }
        : hasFeedback === false ? { none: {} }
        : undefined,
    }

    const [meetings, meetingsCount] = await Promise.all([
      prisma.meeting.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          feedback: include?.includes("feedback"),
          scriptProtocols: include?.includes("scriptProtocols"),
          applicant: include?.includes("applicant"),
          employer: include?.includes("employer"),
          slot: include?.includes("slot"),
        },
      }),
      prisma.meeting.count({ where }),
    ])

    return new PageResponse(meetings, page, size, meetingsCount);
  }

  @Get("my")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  public async getMy(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("feedback" | "scriptProtocols" | "applicant" | "employer" | "slot")[],
  ): Promise<PageResponse<GetMeetingResponse>> {
    const where = {
      applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
      employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
      slot: req.user.role === UserRole.MANAGER ? { managerId: req.user.id } : undefined,
    };

    const [meetings, meetingsCount] = await Promise.all([
      prisma.meeting.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          feedback: include?.includes("feedback"),
          scriptProtocols: include?.includes("scriptProtocols"),
          slot: include?.includes("slot"),
          applicant: include?.includes("applicant"),
          employer: include?.includes("employer"),
        },
      }),
      prisma.meeting.count({ where }),
    ])

    return new PageResponse(meetings, page, size, meetingsCount);
  }

  /**
   * @param {string} secret Токен для доступа к методу
   * @param {string} date Дата в формате "YYYY-MM-DD"
   * @param {string} timezone Часовой пояс по стандарту ISO 8601. Пример: "Europe/Moscow"
   */
  @Get("/export")
  public async exportAll(
    @Query() secret: string,
    @Query() date: string,
    @Query() timezone: string = "Europe/Moscow",
  ): Promise<ExportAllResponse> {
    if(secret !== meetingConfig.MEETING_EXPORT_SECRET) throw new HttpError(401, "Invalid secret");

    const startDateTime = moment.tz(date, timezone).startOf("day");
    const endDateTime = startDateTime.clone().endOf("day");

    const meetings = await prisma.meeting.findMany({
      where: {
        slot: {
          dateTime: {
            gte: startDateTime.toISOString(),
            lte: endDateTime.toISOString(),
          },
        },
      },
      include: {
        applicant: true,
        employer: true,
        slot: {
          include: {
            manager: true,
          },
        },
      },
    });

    return meetings.map(meeting => ({
      status: meeting.status,
      managerName: meeting.slot.manager.name,
      roomUrl: meeting.roomUrl,
      ...(meeting.applicant && {
        applicantName: meeting.applicant.firstName + " " + meeting.applicant.lastName,
        contact: meeting.applicant.contact,
        email: meeting.applicant.email,
      }),
      ...(meeting.employer && {
        employerName: meeting.employer.firstName + " " + meeting.employer.lastName,
        contact: meeting.employer.contact,
        email: meeting.employer.email,
      }),
    }));
  }

  @Get("{id}/passport")
  @Security("jwt", [UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 30, interval: 60}))
  @Response<HttpErrorBody & {"error": "File not found" | "Meeting not found"}>(404)
  public async getPassport(
    @Request() req: ExpressRequest & JwtModel,
    @Path() id: string,
  ): Promise<Readable | any> {
    const fileName = await this.artifactService.getFullFileName(`meeting/${id}/`, "passport");
    const filePath = `meeting/${id}/${fileName}`;

    const meeting = await prisma.meeting.findUnique({where: { id }});

    if (!meeting) throw new HttpError(404, "Meeting not found");
    if(fileName == null) throw new HttpError(404, "File not found");

    const response = req.res;
    if (response) {
      const [stream, fileOptions] = await this.artifactService.loadFile(filePath);

      if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
      response.setHeader("Content-Length", fileOptions.size.toString());

      stream.pipe(response);
      return stream;
    }
  }

  @Put("{id}/passport")
  @Security("jwt", [UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Meeting not found"}>(404)
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async uploadPassport(
    @Request() req: JwtModel,
    @UploadedFile() file: Express.Multer.File,
    @Path() id: string,
  ): Promise<void> {
    const passportExtension = path.extname(file.originalname);
    const passportDirectory = `meeting/${id}/`;
    const passportPath = passportDirectory + `passport${passportExtension}`;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");

    await this.artifactService.validateFileAttributes(file, AVAILABLE_PASSPORT_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE);
    const oldPassportFileName = await this.artifactService.getFullFileName(passportDirectory, "passport");

    if (oldPassportFileName !== null) {
      this.artifactService.deleteFile(passportDirectory + oldPassportFileName);
    }

    await this.artifactService.saveFile(file, passportPath, AVAILABLE_PASSPORT_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE);
  }

  @Get("{id}/video")
  @Middlewares(rateLimit({limit: 30, interval: 60}))
  @Response<HttpErrorBody & {"error": "File not found" | "Meeting not found"}>(404)
  public async getVideo(
    @Request() req: ExpressRequest & JwtModel,
    @Path() id: string,
  ): Promise<Readable | any> {
    const meeting = await prisma.meeting.findUnique( {
      where: {
        id,
      },
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");

    const fileName = await this.artifactService.getFullFileName(`meeting/${id}/`, "video");
    const filePath = `meeting/${id}/${fileName}`;

    if(fileName == null) throw new HttpError(404, "File not found");

    const response = req.res;
    if (response) {
      const [stream, fileOptions] = await this.artifactService.loadFile(filePath);

      if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
      response.setHeader("Content-Length", fileOptions.size.toString());

      stream.pipe(response);
      response.on("close", () => {
        try {
          stream.destroy();
        }
        catch (e) {
          req.log.error(e, "Stream response error");
        }
      });
      return stream;
    }
  }

  @Put("{id}/video")
  @Security("jwt", [UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Meeting not found"}>(404)
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async uploadVideo(
    @Request() req: JwtModel,
    @UploadedFile() file: Express.Multer.File,
    @Path() id: string,
  ): Promise<void> {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");

    const videoExtension = path.extname(file.originalname);
    const videoDirectory = `meeting/${id}/`;
    const videoPath = videoDirectory + `video${videoExtension}`;

    await this.artifactService.validateFileAttributes(file, AVAILABLE_VIDEO_FILE_MIME_TYPES, artifactConfig.MAX_VIDEO_FILE_SIZE);
    const oldVideoFileName = await this.artifactService.getFullFileName(videoDirectory, "video");

    if (oldVideoFileName !== null) this.artifactService.deleteFile(videoDirectory + oldVideoFileName);

    await this.artifactService.saveVideoFile(file, videoPath);
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "Meeting not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Body() body: PatchMeetingByManagerRequest,
    @Path() id: string,
  ): Promise<BasicMeeting> {
    body = PatchMeetingByManagerRequestSchema.validateSync(body)

    const where = { id };

    const meeting = await prisma.meeting.findUnique({
      where,
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");

    return await prisma.meeting.update({
      where,
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.APPLICANT, UserRole.EMPLOYER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Meeting not found"}>(404)
  @Response<HttpErrorBody & {"error": "Applicant and employer unable to delete finished meeting"}>(409)
  public async deleteById(
    @Request() req: ExpressRequest & JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const meeting = await prisma.meeting.findUnique({
      where: {
        id,
        ...(req.user.role === UserRole.APPLICANT && { applicantId: req.user.id }),
        ...(req.user.role === UserRole.EMPLOYER && { employerId: req.user.id }),
      },
      include: {
        slot: true,
        applicant: true,
        employer: true,
      },
    });

    if(!meeting) throw new HttpError(404, "Meeting not found");
    switch(req.user.role) {
      case UserRole.APPLICANT:
      case UserRole.EMPLOYER:
        if(meeting.status !== MeetingStatus.PLANNED) {
          throw new HttpError(409, "Applicant and employer unable to delete finished meeting");
        }

        break;
    }

    await prisma.meeting.archive(id);

    const userEmail = meeting.applicant?.email || meeting.employer?.email || meeting.guestEmail;
    const userFirstName = meeting.applicant?.firstName || meeting.employer?.firstName || meeting.guestEmail;

    let role: UserRole.APPLICANT | UserRole.EMPLOYER | typeof GUEST_ROLE;

    if (meeting.applicant) role = UserRole.APPLICANT
    else if (meeting.employer) role = UserRole.EMPLOYER
    else role = GUEST_ROLE

    await this.meetingService.sendMeetingCancelledToEmail(
      req.log,
      userEmail!,
      role,
      { name: userFirstName!, dateTime: meeting.slot.dateTime }
    );

    await this.meetingService.removeMeetingReminderToEmail(
      req.log,
      userEmail!,
      meeting.roomUrl,
    );
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "Meeting not found" }>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("feedback" | "scriptProtocols" | "applicant" | "employer" | "slot")[]
  ): Promise<GetMeetingResponse> {
    const meeting = await prisma.meeting.findUnique({
      where: {
        id,
        applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
        employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
      },
      include: {
        feedback: include?.includes("feedback"),
        scriptProtocols: include?.includes("scriptProtocols"),
        slot: include?.includes("slot"),
        applicant: include?.includes("applicant"),
        employer: include?.includes("employer"),
      },
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");
    return meeting;
  }
}
