import { injectable, } from "tsyringe";
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
import { JwtModel, UserRole, } from "../../auth/auth.dto";
import { MeetingFeedbackService, } from "./feedback.service";
import {
  BasicMeetingFeedback,
  CreateMeetingFeedbackRequest,
  CreateMeetingFeedbackRequestSchema,
  GetMeetingFeedbackResponse,
  PatchMeetingFeedbackRequest,
  PatchMeetingFeedbackRequestSchema,
} from "./feedback.dto";
import { prisma, } from "../../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody, } from "../../../infrastructure/error/http.error";
import { PageNumber, PageSizeNumber, } from "../../../infrastructure/controller/pagination/page.dto";
import { PageResponse, } from "../../../infrastructure/controller/pagination/page.response";


@injectable()
@Route("api/v1/meetingFeedback",)
@Tags("Meeting Feedback",)
export class MeetingFeedbackController extends Controller {
  constructor(private readonly feedbackService: MeetingFeedbackService,) {
    super();
  }

  @Post("",)
  @Response<HttpErrorBody & { "error": "Meeting not found" }>(404,)
  @Security("jwt", [UserRole.MANAGER,],)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingFeedbackRequest,
  ): Promise<BasicMeetingFeedback> {
    body = CreateMeetingFeedbackRequestSchema.validateSync(body,);

    const meeting = await prisma.meeting.findUnique({
      where: { id: body.meetingId, },
      select: { id: true, },
    },);

    if (!meeting) throw new HttpError(404, "Meeting not found",);

    return prisma.meetingFeedback.create({
      data: {
        ...body,
      },
    },);
  }

  @Get("my",)
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT,],)
  public async getMy(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 60,
    @Query() include?: ("meeting")[],
  ): Promise<PageResponse<GetMeetingFeedbackResponse>> {
    const where = {
      meeting: {
        slot: req.user.role === UserRole.MANAGER ? { managerId: req.user.id, } : undefined,
        employerId: req.user.role === UserRole.EMPLOYER ? req.user.id : undefined,
        applicantId: req.user.role === UserRole.APPLICANT ? req.user.id : undefined,
      },
    };

    const [meetingFeedback, meetingFeedbackCount,] = await Promise.all([
      prisma.meetingFeedback.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        include: {
          meeting: include?.includes("meeting",),
        },
      },),
      prisma.meetingFeedback.count({ where, },),
    ],);

    return new PageResponse(meetingFeedback, page, size, meetingFeedbackCount,);
  }

  @Get("",)
  @Security("jwt", [UserRole.MANAGER,],)
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 60,
    @Query() include?: ("meeting")[],
  ): Promise<PageResponse<GetMeetingFeedbackResponse>> {
    const where = {};

    const [meetingFeedback, meetingFeedbackCount,] = await Promise.all([
      prisma.meetingFeedback.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        include: {
          meeting: include?.includes("meeting",),
        },
      },),
      prisma.meetingFeedback.count({ where, },),
    ],);

    return new PageResponse(meetingFeedback, page, size, meetingFeedbackCount,);
  }

  @Delete("{id}",)
  @Security("jwt", [UserRole.MANAGER,],)
  @Response<HttpErrorBody & {"error": "MeetingFeedback not found"}>(404,)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      meeting: { slot: { managerId: req.user.id,  }, },
    };

    const meetingFeedback = await prisma.meetingFeedback.findUnique({ where, },);
    if (!meetingFeedback) throw new HttpError(404, "MeetingFeedback not found",);

    await prisma.meetingFeedback.delete({ where, },);
  }

  @Patch("{id}",)
  @Security("jwt", [UserRole.MANAGER,],)
  @Response<HttpErrorBody & {"error": "MeetingFeedback not found"}>(404,)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchMeetingFeedbackRequest,
  ): Promise<BasicMeetingFeedback> {
    body = PatchMeetingFeedbackRequestSchema.validateSync(body,);

    const where = {
      id,
      meeting: { slot: { managerId: req.user.id,  }, },
    };

    const meetingFeedback = await prisma.meetingFeedback.findUnique({ where, },);
    if (!meetingFeedback) throw new HttpError(404, "MeetingFeedback not found",);

    return prisma.meetingFeedback.update({
      where,
      data: body,
    },);
  }

  @Get("{id}",)
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER, UserRole.APPLICANT,],)
  @Response<HttpErrorBody & {"error": "MeetingFeedback not found"}>(404,)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("meeting")[],
  ): Promise<GetMeetingFeedbackResponse> {
    let where;
    if (req.user.role === UserRole.MANAGER) where = { id, };
    else if (req.user.role === UserRole.EMPLOYER) where = { id, meeting: { employerId: req.user.id, }, };
    else if (req.user.role === UserRole.APPLICANT) where = { id, meeting: { applicantId: req.user.id, }, };

    const meetingFeedback = await prisma.meetingFeedback.findUnique({
      where: where!,
      include: {
        meeting: include?.includes("meeting",),
      },
    },);

    if (!meetingFeedback) throw new HttpError(404, "MeetingFeedback not found",);

    return meetingFeedback;
  }
}