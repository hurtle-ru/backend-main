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
import { GuestRole, JwtModel, UserRole } from "../../auth/auth.dto";
import { BasicMeetingSlot, CreateMeetingSlotRequest, GetMeetingSlotResponse, PutMeetingSlotRequest } from "./slot.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { MeetingType } from "@prisma/client";
import { MeetingSlotService } from "./slot.service";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";


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

  @Get("")
  @Security("jwt", [GuestRole, UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Only available slots are accessible to employers, applicants and guests"}>(403)
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 60,
    @Query() types?: MeetingType[],
    @Query() available: boolean = true,
    @Query() afterDateTime?: Date,
    @Query() beforeDateTime?: Date,
  ): Promise<PageResponse<BasicMeetingSlot>> {
    if(req.user.role !== UserRole.MANAGER && !available)
      throw new HttpError(403, "Only available slots are accessible to employers, applicants and guests");

    const where = {
      meeting: available ? null : undefined,
      types: types ? { hasSome: types } : undefined,
      dateTime: {
        ...(afterDateTime && { gte: afterDateTime }),
        ...(beforeDateTime && { lte: beforeDateTime }),
        ...(available && (!afterDateTime || afterDateTime < new Date()) && { gte: new Date() }),
      },
    }

    const [meetingSlots, meetingSlotsCount] = await Promise.all([
      prisma.meetingSlot.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.meetingSlot.count({ where }),
    ]);

    return new PageResponse(meetingSlots, page, size, meetingSlotsCount)
  }

  @Get("my")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  public async getMy(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 60,
    @Query() types?: MeetingType[],
    @Query() afterDateTime?: Date,
    @Query() beforeDateTime?: Date,
  ): Promise<PageResponse<BasicMeetingSlot>> {
    const where = {
      managerId: req.user.role === UserRole.MANAGER ? req.user.id : undefined,
      meeting: {
        employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
        applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
      },
      types: types ? { hasSome: types } : undefined,
      dateTime: {
        ...(afterDateTime && { gte: afterDateTime }),
        ...(beforeDateTime && { lte: beforeDateTime }),
      },
    };

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
  public async deleteById(
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
  public async patchById(
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

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "MeetingSlot not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("meeting" | "manager")[]
  ): Promise<GetMeetingSlotResponse> {
    const where = this.slotService.buildAccessWhereQuery(req.user.role as UserRole, req.user.id, id);

    const meetingSlot = await prisma.meetingSlot.findUnique({
      where,
      include: {
        meeting: include?.includes("meeting"),
        manager: include?.includes("manager"),
      },
    });

    if(!meetingSlot) throw new HttpError(404, "MeetingSlot not found");

    return meetingSlot;
  }
}