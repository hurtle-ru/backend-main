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
import { GUEST_ROLE, JwtModel, UserRole } from "../../auth/auth.dto";
import {
  AvailableDaysDictionary,
  BasicMeetingSlot,
  CreateMeetingSlotRequest, CreateMeetingSlotRequestSchema, CreateMeetingSlotsWithinRangeRequest, CreateMeetingSlotsWithinRangeResponse,
  GetMeetingSlotResponse,
  PatchMeetingSlotRequest, PatchMeetingSlotRequestSchema, SlotPageSizeNumber,
} from "./slot.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { PageResponse } from "../../../infrastructure/controller/pagination/page.response";
import { MeetingPaymentStatus, MeetingSlot, MeetingType, Prisma } from "@prisma/client";
import { MeetingSlotService } from "./slot.service";
import { PageNumber, PageSizeNumber } from "../../../infrastructure/controller/pagination/page.dto";
import { CreateSlotsWithinRangeMaximum } from "../meeting.config";
import moment from "moment";


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
    body = CreateMeetingSlotRequestSchema.validateSync(body);

    return prisma.meetingSlot.create({
      data: {
        ...body,
        managerId: req.user.id,
      },
    });
  }

  @Post("withinRange")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error":
      | "startDate must be less than endDate"
      | "Interval must be greater than 0"
      | "Given range goes beyond the limit of the maximum number of slots possible to create in a single request"
  }>(422)
  public async createWithinRange(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingSlotsWithinRangeRequest,
  ): Promise<CreateMeetingSlotsWithinRangeResponse> {
    if (body.startDate >= body.endDate) throw new HttpError(422, "startDate must be less than endDate");

    const startMinutes = body.startDate.getTime();
    const endMinutes = body.endDate.getTime();

    const intervalMilliseconds = body.interval * 60 * 1000;
    if (intervalMilliseconds <= 0) throw new HttpError(422, "Interval must be greater than 0");

    const slotsToCreate: Prisma.MeetingSlotCreateManyInput[] = [];
    for (let slotDateTime = startMinutes; slotDateTime <= endMinutes; slotDateTime += intervalMilliseconds) {
      slotsToCreate.push({
        managerId: req.user.id,
        types: body.types,
        dateTime: new Date(slotDateTime),
      });

      if (slotsToCreate.length >= CreateSlotsWithinRangeMaximum) {
        throw new HttpError(422, "Given range goes beyond the limit of the maximum number of slots possible to create in a single request");
      }
    }

    return prisma.meetingSlot.createMany({
      data: slotsToCreate,
    });
  }

  @Get("")
  @Security("jwt", [GUEST_ROLE, UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  @Response<HttpErrorBody & {"error": "Only available slots are accessible to employers, applicants and guests"}>(403)
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 800,
    @Query() types?: MeetingType[],
    @Query() available = true,
    @Query() afterDateTime?: Date,
    @Query() beforeDateTime?: Date,
  ): Promise<PageResponse<BasicMeetingSlot>> {
    if (req.user.role !== UserRole.MANAGER && !available)
      throw new HttpError(403, "Only available slots are accessible to employers, applicants and guests");

    const currentDate = new Date();
    const where: Prisma.MeetingSlotWhereInput = {
      meeting: available ? null : undefined,
      types: types ? { hasSome: types } : undefined,
      dateTime: {
        ...(afterDateTime && { gte: afterDateTime }),
        ...(beforeDateTime && { lte: beforeDateTime }),
        ...(available && (!afterDateTime || afterDateTime < currentDate) && { gte: currentDate }),
      },
      ...(available && {
        OR: [
          { payments: { none: {} } }, // No payments at all
          { payments: { every: { status: MeetingPaymentStatus.PENDING, dueDate: { lte: currentDate } } } }, // All payments are expired
          { payments: { every: { status: MeetingPaymentStatus.FAIL } } }, // All payments are failed
        ],
      }),
    };

    // TODO: fix pagination, slots count
    const [fetchedMeetingSlots, fetchedMeetingSlotsCount] = await Promise.all([
      prisma.meetingSlot.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { dateTime: "asc" },
      }),
      prisma.meetingSlot.count({ where }),
    ]);

    const uniqueDateTimeSlotsMap = new Map();
    for (const slot of fetchedMeetingSlots) {
      const dateTimeStr = slot.dateTime.toISOString();
      if (!uniqueDateTimeSlotsMap.has(dateTimeStr)) {
        uniqueDateTimeSlotsMap.set(dateTimeStr, slot);
      }
    }

    const meetingSlots = Array.from(uniqueDateTimeSlotsMap.values());

    return new PageResponse(meetingSlots, page, size, meetingSlots.length);
  }

  @Get("my")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT])
  public async getMy(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: SlotPageSizeNumber = 60,
    @Query() types?: MeetingType[],
    @Query() afterDateTime?: Date,
    @Query() beforeDateTime?: Date,
    @Query() available = false,
  ): Promise<PageResponse<BasicMeetingSlot>> {
    if (req.user.role !== UserRole.MANAGER && available)
      throw new HttpError(403, "Only managers have access to see available slots with this method");

    const currentDate = new Date();
    const where = {
      managerId: req.user.role === UserRole.MANAGER ? req.user.id : undefined,
      meeting: available ? null : {
        employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
        applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
      },
      types: types ? { hasSome: types } : undefined,
      dateTime: {
        ...(afterDateTime && { gte: afterDateTime }),
        ...(beforeDateTime && { lte: beforeDateTime }),
        ...(available && (!afterDateTime || afterDateTime < currentDate) && { gte: currentDate }),
      },
    };

    const [meetingSlots, meetingSlotsCount] = await Promise.all([
      prisma.meetingSlot.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        ...(req.user.role === UserRole.MANAGER && {
          include: {
            meeting: true,
          },
        }),
      }),
      prisma.meetingSlot.count({ where }),
    ]);

    return new PageResponse(meetingSlots, page, size, meetingSlotsCount);
  }

  @Get("/availableDays")
  @Response<HttpErrorBody & {
    "error": "Invalid timezone" | "The provided year and month must not be in the past",
  }>(422)
  public async getAvailableDays(
    @Query() year: number,
    @Query() month: number,
    @Query() timezone: string,
    @Query() types?: MeetingType[],
  ): Promise<AvailableDaysDictionary> {
    const now = moment();
    const inputDate = moment({ year, month: month - 1 });

    if (!moment.tz.zone(timezone)) {
      throw new HttpError(422, "Invalid timezone");
    }
    if (inputDate.isBefore(now, 'month')) {
      throw new HttpError(422, "The provided year and month must not be in the past");
    }

    const daysInMonth = inputDate.daysInMonth();

    const slots = await prisma.meetingSlot.findMany({
      where: {
        dateTime: {
          gte: inputDate.startOf('month').toDate(),
          lt: inputDate.add(1, 'month').startOf('month').toDate(),
        },
        types: types ? { hasSome: types } : undefined,
        meeting: null,
      },
    });

    const dictionary: AvailableDaysDictionary = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dictionary[day.toString()] = slots.some((slot) =>
        moment(slot.dateTime).tz(timezone).date() === day
      );
    }

    return dictionary;
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
    };

    const meetingSlot = await prisma.meetingSlot.findUnique({ where });
    if (!meetingSlot) throw new HttpError(404, "MeetingSlot not found");

    await prisma.meetingSlot.delete({ where });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "MeetingSlot not found"}>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchMeetingSlotRequest,
  ): Promise<BasicMeetingSlot> {
    body = PatchMeetingSlotRequestSchema.validateSync(body);

    const where = {
      id,
      managerId: req.user.id,
    };

    const meetingSlot = await prisma.meetingSlot.findUnique({ where });
    if (!meetingSlot) throw new HttpError(404, "MeetingSlot not found");

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
    @Query() include?: ("meeting" | "manager")[],
  ): Promise<GetMeetingSlotResponse> {
    const where = this.slotService.buildAccessWhereQuery(req.user.role as UserRole, req.user.id, id);

    const meetingSlot = await prisma.meetingSlot.findUnique({
      where,
      include: {
        meeting: include?.includes("meeting"),
        manager: include?.includes("manager"),
      },
    });

    if (!meetingSlot) throw new HttpError(404, "MeetingSlot not found");

    return meetingSlot;
  }
}