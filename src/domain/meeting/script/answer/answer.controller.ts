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
import { JwtModel, UserRole } from "../../../auth/auth.dto";
import { prisma } from "../../../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../../../infrastructure/error/http.error";
import { MeetingScriptAnswerService } from "./answer.service";
import {
  BasicMeetingScriptAnswer,
  CreateMeetingScriptAnswerRequest, GetMeetingScriptAnswerResponse,
  PutMeetingScriptAnswerRequest,
} from "./answer.dto";
import { PageNumber, PageSizeNumber } from "../../../../infrastructure/controller/pagination/page.dto";
import { PageResponse } from "../../../../infrastructure/controller/pagination/page.response";
import { GetMeetingScriptTemplateResponse } from "../template/template.dto";


@injectable()
@Route("api/v1/meetingScriptAnswer")
@Tags("Meeting Script Answer")
export class MeetingScriptAnswerController extends Controller {
  constructor(private readonly scriptAnswerService: MeetingScriptAnswerService) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.MANAGER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingScriptAnswerRequest,
  ): Promise<BasicMeetingScriptAnswer> {
    return prisma.meetingScriptAnswer.create({
      data: body,
    });
  }

  @Get("")
  @Security("jwt", [UserRole.MANAGER])
  public async getAll(
    @Request() req: JwtModel,
    @Query() page: PageNumber = 1,
    @Query() size: PageSizeNumber = 20,
    @Query() include?: ("protocol" | "question")[],
    @Query() protocolId?: string,
    @Query() questionId?: string,
  ): Promise<PageResponse<GetMeetingScriptAnswerResponse>> {
    const where = {
      protocolId: protocolId ?? undefined,
      questionId: questionId ?? undefined,
    }

    const [answers, answersCount] = await Promise.all([
      prisma.meetingScriptAnswer.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        include: {
          protocol: include?.includes("protocol"),
          question: include?.includes("question"),
        },
      }),
      prisma.meetingScriptAnswer.count({ where }),
    ])

    return new PageResponse(answers, page, size, answersCount);
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptAnswer not found" }>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: Partial<PutMeetingScriptAnswerRequest>,
  ): Promise<void> {
    const answer = await prisma.meetingScriptAnswer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!answer) throw new HttpError(404, "MeetingScriptAnswer not found");

    await prisma.meetingScriptAnswer.update({
      where: { id },
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptAnswer not found" }>(404)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const answer = await prisma.meetingScriptAnswer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!answer) throw new HttpError(404, "MeetingScriptAnswer not found");

    await prisma.meetingScriptAnswer.delete({
      where: { id },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptAnswer not found" }>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("protocol" | "question")[]
  ): Promise<GetMeetingScriptAnswerResponse> {
    const answer = await prisma.meetingScriptAnswer.findUnique({
      where: { id },
      include: {
        protocol: include?.includes("protocol"),
        question: include?.includes("question"),
      },
    });

    if(!answer) throw new HttpError(404, "MeetingScriptAnswer not found");

    return answer;
  }
}