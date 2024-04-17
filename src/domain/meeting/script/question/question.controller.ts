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
import { MeetingScriptQuestionService } from "./question.service";
import {
  BasicMeetingScriptQuestion,
  CreateMeetingScriptQuestionRequest, CreateMeetingScriptQuestionRequestSchema, GetMeetingScriptQuestionResponse,
  PatchMeetingScriptQuestionRequest,
  PatchMeetingScriptQuestionRequestSchema,
} from "./question.dto";


@injectable()
@Route("api/v1/meetingScriptQuestion")
@Tags("Meeting Script Question")
export class MeetingScriptQuestionController extends Controller {
  constructor(private readonly scriptQuestionService: MeetingScriptQuestionService) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.MANAGER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateMeetingScriptQuestionRequest,
  ): Promise<BasicMeetingScriptQuestion> {
    body = CreateMeetingScriptQuestionRequestSchema.validateSync(body)

    return prisma.meetingScriptQuestion.create({
      data: body,
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptQuestion not found" }>(404)
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchMeetingScriptQuestionRequest,
  ): Promise<void> {
    body = PatchMeetingScriptQuestionRequestSchema.validateSync(body)
    const question = await prisma.meetingScriptQuestion.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!question) throw new HttpError(404, "MeetingScriptQuestion not found");

    await prisma.meetingScriptQuestion.update({
      where: { id },
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptQuestion not found" }>(404)
  @Response<HttpErrorBody & { "error": "MeetingScriptQuestion is in use by some answers" }>(409)
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const question = await prisma.meetingScriptQuestion.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!question) throw new HttpError(404, "MeetingScriptQuestion not found");

    const usesCount = await prisma.meetingScriptAnswer.count({
      where: { questionId: id },
    });

    if(usesCount > 0) throw new HttpError(409, "MeetingScriptQuestion is in use by some answers");

    await prisma.meetingScriptQuestion.delete({
      where: { id },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER])
  @Response<HttpErrorBody & { "error": "MeetingScriptQuestion not found" }>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("answers" | "templates")[]
  ): Promise<GetMeetingScriptQuestionResponse> {
    const question = await prisma.meetingScriptQuestion.findUnique({
      where: { id },
      include: {
        answers: include?.includes("answers"),
        templates: include?.includes("templates"),
      },
    });

    if(!question) throw new HttpError(404, "MeetingScriptQuestion not found");

    return question;
  }
}