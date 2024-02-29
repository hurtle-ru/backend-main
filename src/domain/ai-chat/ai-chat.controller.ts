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
import { GUEST_ROLE, JwtModel, UserRole } from "../auth/auth.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { ApplicantAiChatService } from "./ai-chat.service";
import { BasicApplicantAiChat, CreateApplicantAiChatRequest, GetApplicantAiChatResponse } from "./ai-chat.dto";
import { MeetingStatus, MeetingType } from "@prisma/client";


@injectable()
@Route("api/v1/applicantAiChats")
@Tags("Applicant AI Chat")
export class ApplicantAiChatController extends Controller {
  constructor(
    private readonly applicantAiChatService: ApplicantAiChatService,
  ) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "AI Chat already exists"}>(409)
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Response<HttpErrorBody & {"error": "Applicant resume not found or invisible to employers"}>(409)
  @Response<HttpErrorBody & {"error": "Completed applicant interviews with transcript not found"}>(409)
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateApplicantAiChatRequest
  ): Promise<BasicApplicantAiChat> {
    if(await prisma.applicantAiChat.exists({ applicantId: body.applicantId }))
      throw new HttpError(409, "AI Chat already exists");

    const applicant = await prisma.applicant.findUnique({
      where: { id: body.applicantId },
      include: {
        resume: true,
        meetings: true,
      },
    });

    if(!applicant) throw new HttpError(404, "Applicant not found");
    if(!applicant.resume || !applicant.resume.isVisibleToEmployers)
      throw new HttpError(409, "Applicant resume not found or invisible to employers");

    const applicantInterviews = applicant.meetings.filter(m =>
      m.type === MeetingType.INTERVIEW
      && m.status === MeetingStatus.COMPLETED
      && m.transcript
      && m.transcript.trim().length > 0,
    );

    if(applicantInterviews.length === 0) throw new HttpError(409, "Completed applicant interviews with transcript not found");

    return prisma.applicantAiChat.create({
      data: {
        applicantId: body.applicantId,
        employerId: req.user.id,
      },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.MANAGER, UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "AI Chat not found"}>(404)
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Query() include?: ("applicant" | "employer" | "history")[]
  ): Promise<GetApplicantAiChatResponse> {
    const chat = await prisma.applicantAiChat.findUnique({
      where: {
        id,
        ...(req.user.role === UserRole.EMPLOYER && { employerId: req.user.id }),
      },
      include: {
        applicant: include?.includes("applicant"),
        employer: include?.includes("employer"),
        history: include?.includes("history"),
      },
    });

    if(!chat) throw new HttpError(404, "AI Chat not found");

    return chat;
  }
}
