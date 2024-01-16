import { injectable } from "tsyringe";
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Request, Response, Route, Security, Tags, UploadedFile } from "tsoa";
import { MeetingService } from "./meeting.service";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { BasicMeeting, CreateMeetingRequest, GetMeetingResponse } from "./meeting.dto";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";
import {Request as ExpressRequest} from "express";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { Readable } from "stream";
import path from "path";
import {AVAILABLE_VIDEO_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE, MAX_VIDEO_FILE_SIZE } from "../../external/artifact/artifact.config";
import { AVAILABLE_PASSPORT_FILE_MIME_TYPES } from "./meeting.config"


@injectable()
@Route("api/v1/meetings")
@Tags("Meeting")
export class MeetingController extends Controller {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly artifactService: ArtifactService,
  ) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER])
  @Response<HttpErrorBody & { "error": "MeetingSlot not found" }>(404)
  @Response<HttpErrorBody & { "error": "MeetingSlot already booked" }>(409)
  @Response<HttpErrorBody & { "error": "User does not have access to this MeetingSlot type" }>(403)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingRequest,
  ): Promise<BasicMeeting> {
    const slot = await prisma.meetingSlot.findUnique({
      where: {
        id: body.slotId,
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
      },
    });

    if (!slot) throw new HttpError(404, "MeetingSlot not found");
    if (slot.meeting) throw new HttpError(409, "MeetingSlot already booked");
    if (!this.meetingService.doesUserHaveAccessToMeetingSlot(req.user.role, slot.types))
      throw new HttpError(403, "User does not have access to this MeetingSlot type");

    let user: { firstName: string, lastName: string, email: string } | null = null;
    const findArgs = {
      where: { id: req.user.id },
      select: { firstName: true, lastName: true, email: true },
    };

    if (req.user.role === UserRole.APPLICANT) user = await prisma.applicant.findUnique(findArgs)
    else if (req.user.role === UserRole.EMPLOYER) user = await prisma.employer.findUnique(findArgs)

    const roomUrl = await this.meetingService.createRoom(body.type, user!);
    const meeting = await prisma.meeting.create({
      data: {
        ...body,
        roomUrl,
        applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
        employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
      },
    });

    await this.meetingService.sendMeetingCreatedToAdminGroup(
      { name: body.name, id: meeting.id, dateTime: slot.dateTime },
      { name: slot.manager.name, id: slot.manager.id },
      { ...user!, id: req.user.id, role: req.user.role }
    );
    await this.meetingService.sendMeetingCreatedToEmail(
      user!.email,
      { name: body.name, link: roomUrl, dateTime: slot.dateTime },
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
  @Response<HttpErrorBody & {"error": "File not found" | "Meeting not found"}>(404)
  public async getPassport(
    @Request() req: ExpressRequest & JwtModel,
    @Path() id: string,
  ): Promise<Readable | any> {
    const fileName = await this.artifactService.getFullFileName(`meeting/${id}/`, "passport")
    const filePath = `meeting/${id}/${fileName}`
    
    const meeting = await prisma.meeting.findUnique({where: {id}})

    if (!meeting) throw new HttpError(404, "Meeting not found")
    if(fileName == null) throw new HttpError(404, "File not found")

    const response = req.res;
    if (response) {
      const [stream, fileOptions] = await this.artifactService.loadFile(filePath);

      if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
      response.setHeader("Content-Length", fileOptions.size.toString());

      stream.pipe(response)
      return stream
    }
  }

  @Put("{id}/passport")
  @Security("jwt", [UserRole.MANAGER])
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
      where: {id},
      include: {slot: true},
    });

    if (!meeting) throw new HttpError(404, "Meeting not found");
    if (req.user.id !== meeting?.slot.managerId) throw new HttpError(403, "Not enough rights to edit another applicant");

    await this.artifactService.validateFileAttributes(file, AVAILABLE_PASSPORT_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE);
    const oldPassportFileName = await this.artifactService.getFullFileName(passportDirectory, "passport");

    if (oldPassportFileName !== null) {
      this.artifactService.deleteFile(passportDirectory + oldPassportFileName);
    }
    
    await this.artifactService.saveFile(file, passportPath, AVAILABLE_PASSPORT_FILE_MIME_TYPES, MAX_IMAGE_FILE_SIZE);
  }

  @Get("{id}/video")
  @Security("jwt", [UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "File not found" | "Meeting not found"}>(404)
  public async getVideo(
    @Request() req: ExpressRequest & JwtModel,
    @Path() id: string,
  ): Promise<Readable | any> {
    const fileName = await this.artifactService.getFullFileName(`meeting/${id}/`, "video")
    const filePath = `meeting/${id}/${fileName}`

    if(fileName == null) throw new HttpError(404, "File not found")
    const meeting = await prisma.meeting.findUnique({where: {id}})

    if (!meeting) throw new HttpError(404, "Meeting not found")

    const response = req.res;
    if (response) {
      const [stream, fileOptions] = await this.artifactService.loadFile(filePath);

      if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
      response.setHeader("Content-Length", fileOptions.size.toString());

      stream.pipe(response)
      response.on("close", () => {
        try {
          stream.destroy();
        }
        catch (e) {
          console.log("Error:", e)
        }
      });
      return stream
    }
  }

  @Put("{id}/video")
  @Security("jwt", [UserRole.MANAGER])
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
      where: {id},
      include: {slot: true},
    })

    if (!meeting) throw new HttpError(404, "Meeting not found")
    if (req.user.id !== meeting?.slot.managerId) throw new HttpError(403, "Not enough rights to edit another applicant");

    const videoExtension = path.extname(file.originalname)
    const videoDirectory = `meeting/${id}/`
    const videoPath = videoDirectory + `video${videoExtension}`

    await this.artifactService.validateFileAttributes(file, AVAILABLE_VIDEO_FILE_MIME_TYPES, MAX_VIDEO_FILE_SIZE);
    const oldVideoFileName = await this.artifactService.getFullFileName(videoDirectory, "video");

    if (oldVideoFileName !== null) this.artifactService.deleteFile(videoDirectory + oldVideoFileName);
    
    await this.artifactService.saveVideoFile(file, videoPath);
  }

  @Delete("{id}")
  @Response<HttpErrorBody & {"error": "Meeting not found"}>(404)
  @Response<HttpErrorBody & {"error": "Not enough rights to delete another meeting"}>(403)
  @Security("jwt", [UserRole.MANAGER])
  public async deleteById(
    @Path() id: string,
    @Request() req: JwtModel,
  ): Promise<void> {
    const meeting = await prisma.meeting.findUnique({ where: { id }, include: { slot: true } })
    if(!meeting) throw new HttpError(404, "Meeting not found");

    if (req.user.id !== meeting?.slot.managerId) {
      throw new HttpError(403, "Not enough rights to delete another meeting")
    }

    await prisma.meeting.archive(id);
  }

  @Delete("me")
  @Security("jwt", [UserRole.EMPLOYER])
  public async deleteMe(
    @Request() req: JwtModel
  ): Promise<void> {
    await prisma.meeting.archive(req.user.id);
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
