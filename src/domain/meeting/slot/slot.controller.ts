import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { BasicMeetingSlot, CreateMeetingSlotRequest, PutMeetingSlotRequest, UtcDate } from "./slot.dto";
import { prisma } from "../../../infrastructure/database/prismaClient";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/httpError";
import { PageResponse } from "../../../infrastructure/controller/page.response";
import { MeetingType } from "@prisma/client";
import { MeetingSlotService } from "./slot.service";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/page.dto";


@injectable()
@Route("api/v1/meetingSlots")
@Tags("Meeting Slot")
export class MeetingSlotController extends Controller {
  constructor(private readonly slotService: MeetingSlotService) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.MANAGER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingSlotRequest,
  ): Promise<BasicMeetingSlot> {
    return prisma.meetingSlot.create({
      data: {
        ...body,
        managerId: req.user.id,
      },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "MeetingSlot not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("meeting" | "manager")[]
  ): Promise<BasicMeetingSlot> {
    let where;
    if(req.user.role === UserRole.MANAGER) where = { id };
    else if(req.user.role === UserRole.EMPLOYER) where = { id, meeting: { employerId: req.user.id } };
    else if(req.user.role === UserRole.APPLICANT) where = { id, meeting: { applicantId: req.user.id }};

    const meetingSlot = await prisma.meetingSlot.findUnique({
      where: where!,
      include: {
        meeting: include?.includes("meeting"),
        manager: include?.includes("manager"),
      },
    });

    if(!meetingSlot) throw new HttpError(404, "MeetingSlot not found");

    return meetingSlot;
  }


  @Get("")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Only available slots are accessible to employers and applicants"}>(403)
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 60,
    @Query() available: boolean = true,
    @Query() types?: MeetingType[],
    @Query() date?: UtcDate,
  ): Promise<PageResponse<BasicMeetingSlot>> {
    if(!available && req.user.role !== UserRole.MANAGER)
      throw new HttpError(403, "Only available slots are accessible to employers and applicants");

    const where = {
      meeting: available ? null : undefined,
      types: types ? { hasSome: types } : undefined,
      dateTime: date ? this.slotService.createFullDayUtcDateRange(date) : undefined,
    }

    const [meetingSlots, meetingSlotsCount] = await Promise.all([
      prisma.meetingSlot.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.meetingSlot.count({ where }),
    ])

    return new PageResponse(meetingSlots, page, size, meetingSlotsCount)
  }

  @Get("my")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  public async getMy(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 60,
    @Query() types?: MeetingType[],
    @Query() date?: UtcDate,
  ): Promise<PageResponse<BasicMeetingSlot>> {
    const where = {
      managerId: req.user.role === UserRole.MANAGER ? req.user.id : undefined,
      meeting: {
        employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
        applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
      },
      types: types ? { hasSome: types } : undefined,
      dateTime: date ? this.slotService.createFullDayUtcDateRange(date) : undefined,
    }

    const [meetingSlots, meetingSlotsCount] = await Promise.all([
      prisma.meetingSlot.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.meetingSlot.count({ where }),
    ])

    return new PageResponse(meetingSlots, page, size, meetingSlotsCount)
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "MeetingSlot not found"}>(404)
  public async delete(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      managerId: req.user.id,
    }

    const meetingSlot = await prisma.meetingSlot.findUnique({ where });
    if(!meetingSlot) throw new HttpError(404, "MeetingSlot not found");

    await prisma.meetingSlot.delete({ where });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "MeetingSlot not found"}>(404)
  public async patch(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutMeetingSlotRequest>,
  ): Promise<BasicMeetingSlot> {
    const where = {
      id,
      managerId: req.user.id,
    }

    const meetingSlot = await prisma.meetingSlot.findUnique({ where });
    if(!meetingSlot) throw new HttpError(404, "MeetingSlot not found");

    return prisma.meetingSlot.update({
      where,
      data: body,
    });
  }
}