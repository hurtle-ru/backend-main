import { injectable } from "tsyringe";
import { Body, Controller, Get, Path, Post, Query, Request, Response, Route, Security, Tags } from "tsoa";
import { MeetingService } from "./meeting.service";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { BasicMeeting, CreateMeetingRequest, GetMeetingResponse } from "./meeting.dto";
import { prisma } from "../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/httpError";
import { PageResponse } from "../../infrastructure/controller/pagination/page.response";
import { PageNumber, PageSizeNumber } from "../../infrastructure/controller/pagination/page.dto";


@injectable()
@Route("api/v1/meetings")
@Tags("Meeting")
export class MeetingController extends Controller {
  constructor(private readonly meetingService: MeetingService) {
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