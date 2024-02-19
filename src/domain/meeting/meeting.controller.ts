import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
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
  CreateMeetingApplicantOrEmployerRequest, CreateMeetingGuestRequest,
  CreateMeetingRequest,
  GetMeetingResponse,
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
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limit/rate-limit.middleware"
import { AVAILABLE_PASSPORT_FILE_MIME_TYPES } from "./meeting.config";
import { MeetingPaymentService } from "./payment/payment.service";
import { MeetingPaymentStatus } from "@prisma/client";


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
      | "MeetingSlot already booked"
      | "Meeting requires MeetingPayment with SUCCESS status"
      | "Invalid MeetingPayment success code"
      | "Paid meeting type and passed type from request body dont match"
  }>(409)
  @Response<HttpErrorBody & { "error":
      | "Invalid body request for applicant"
      | "Invalid body request for employer"
      | "Invalid body request for guest"
      | "User does not have access to this MeetingSlot type"
  }>(403)
  @Response<HttpErrorBody & { "error": "Too Many Requests" }>(429)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingGuestRequest | CreateMeetingApplicantOrEmployerRequest,
  ): Promise<BasicMeeting> {
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

    let user: { _type: "user", firstName: string, lastName: string, email: string }
      | { _type: "guest"; email: string }
      | null = null;

    const findArgs = {
      where: { id: req.user.id },
      select: { firstName: true, lastName: true, email: true },
    };

    if(req.user.role === UserRole.APPLICANT) user = { _type: "user", ...await prisma.applicant.findUnique(findArgs) as any };
    if(req.user.role === UserRole.EMPLOYER) user = { _type: "user", ...await prisma.employer.findUnique(findArgs) as any };
    else if(req.user.role === GUEST_ROLE) user = { _type: "guest", email: req.user.id }

    const roomUrl = await this.meetingService.createRoom(bodyData.type, user!);
    const meeting = await prisma.meeting.create({
      data: {
        roomUrl,
        name: bodyData.name,
        description: bodyData.description,
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
      user!.email,
      { name: bodyData.name, link: roomUrl, dateTime: slot.dateTime },
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
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another applicant"}>(403)
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
      include: {slot: true},
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");
    if (req.user.id !== meeting?.slot.managerId) throw new HttpError(403, "Not enough rights to edit another applicant");

    await this.artifactService.validateFileAttributes(file, AVAILABLE_PASSPORT_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE);
    const oldPassportFileName = await this.artifactService.getFullFileName(passportDirectory, "passport");

    if (oldPassportFileName !== null) {
      this.artifactService.deleteFile(passportDirectory + oldPassportFileName);
    }

    await this.artifactService.saveFile(file, passportPath, AVAILABLE_PASSPORT_FILE_MIME_TYPES, artifactConfig.MAX_IMAGE_FILE_SIZE);
  }

  @Get("{id}/video")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 30, interval: 60}))
  @Response<HttpErrorBody & {"error": "File not found" | "Meeting not found"}>(404)
  public async getVideo(
    @Request() req: ExpressRequest & JwtModel,
    @Path() id: string,
  ): Promise<Readable | any> {
    const fileName = await this.artifactService.getFullFileName(`meeting/${id}/`, "video");
    const filePath = `meeting/${id}/${fileName}`;

    if(fileName == null) throw new HttpError(404, "File not found");
    const meeting = await prisma.meeting.findUnique({where: { id }});

    if (!meeting) throw new HttpError(404, "Meeting not found");

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
          console.log("Error:", e);
        }
      });
      return stream;
    }
  }

  @Put("{id}/video")
  @Security("jwt", [UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Not enough rights to edit another applicant"}>(403)
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
      include: {slot: true},
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");
    if (req.user.id !== meeting?.slot.managerId) throw new HttpError(403, "Not enough rights to edit another applicant");

    const videoExtension = path.extname(file.originalname);
    const videoDirectory = `meeting/${id}/`;
    const videoPath = videoDirectory + `video${videoExtension}`;

    await this.artifactService.validateFileAttributes(file, AVAILABLE_VIDEO_FILE_MIME_TYPES, artifactConfig.MAX_VIDEO_FILE_SIZE);
    const oldVideoFileName = await this.artifactService.getFullFileName(videoDirectory, "video");

    if (oldVideoFileName !== null) this.artifactService.deleteFile(videoDirectory + oldVideoFileName);

    await this.artifactService.saveVideoFile(file, videoPath);
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Middlewares(rateLimit({limit: 10, interval: 60}))
  @Response<HttpErrorBody & {"error": "Not enough rights to delete another meeting"}>(403)
  @Response<HttpErrorBody & {"error": "Meeting not found"}>(404)
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const meeting = await prisma.meeting.findUnique({ where: { id }, include: { slot: true } });
    if(!meeting) throw new HttpError(404, "Meeting not found");

    if (req.user.id !== meeting?.slot.managerId)
      throw new HttpError(403, "Not enough rights to delete another meeting");

    await prisma.meeting.archive(id);
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
