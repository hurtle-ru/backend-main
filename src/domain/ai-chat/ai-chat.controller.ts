import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { ApplicantAiChatService } from "./ai-chat.service";
import { BasicApplicantAiChat, CreateApplicantAiChatRequest, CreateApplicantAiChatRequestSchema, GetApplicantAiChatResponse } from "./ai-chat.dto";
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
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "Applicant not found"}>(404)
  @Response<HttpErrorBody & {
    "error":
    | "AI Chat already exists"
    | "Applicant resume not found or invisible to employers"
    | "Completed applicant interviews with transcript not found"
    | "Applicant can make AI chat only with himself resume"
  }>(409)
  public async create(
    @Request() req: JwtModel<UserRole.APPLICANT | UserRole.EMPLOYER>,
    @Body() body: CreateApplicantAiChatRequest,
  ): Promise<BasicApplicantAiChat> {
    body = CreateApplicantAiChatRequestSchema.validateSync(body);

    if (req.user.role === UserRole.APPLICANT && req.user.id !== body.applicantId) {
      throw new HttpError(409, "Applicant can make AI chat only with himself resume");
    }

    if (await prisma.applicantAiChat.exists(
      {
        applicantId: body.applicantId,
        employerId: {
          "APPLICANT": null,
          "EMPLOYER": req.user.id,
        }[req.user.role],
      },
    ))
      throw new HttpError(409, "AI Chat already exists");

    const applicant = await prisma.applicant.findUnique({
      where: { id: body.applicantId },
      include: {
        resume: true,
        meetings: true,
      },
    });

    if (!applicant) throw new HttpError(404, "Applicant not found");
    if (
      !applicant.resume || !(req.user.role === UserRole.APPLICANT || applicant.resume.isVisibleToEmployers)
    )
      throw new HttpError(409, "Applicant resume not found or invisible to employers");

    if (!this.applicantAiChatService.existCompletedMeetingsWithTranscript(applicant.meetings)) {
      throw new HttpError(409, "Completed applicant interviews with transcript not found");
    }

    return prisma.applicantAiChat.create({
      data: {
        applicantId: body.applicantId,
        employerId: {
          "APPLICANT": null,
          "EMPLOYER": req.user.id,
        }[req.user.role],
      },
    });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  @Response<HttpErrorBody & {"error": "AI Chat not found"}>(404)
  public async getById(
    @Request() req: JwtModel<UserRole.APPLICANT | UserRole.EMPLOYER | UserRole.MANAGER>,
    @Path() id: string,
    @Query() include?: ("applicant" | "employer" | "history")[],
  ): Promise<GetApplicantAiChatResponse> {
    const where = {
      "APPLICANT": { id, employerId: null },
      "EMPLOYER": { id, employerId: req.user.id },
      "MANAGER": { id },
    }[req.user.role];

    const chat = await prisma.applicantAiChat.findUnique({
      where,
      include: {
        applicant: include?.includes("applicant"),
        employer: req.user.role !== UserRole.APPLICANT && include?.includes("employer"),
        history: include?.includes("history") ? {
          orderBy: { createdAt: "asc" },
        } : undefined,
      },
    });

    if (!chat) throw new HttpError(404, "AI Chat not found");

    const meetings = await prisma.meeting.findMany({ where: { applicantId: chat.applicantId } });
    const canCreateMessage = this.applicantAiChatService.existCompletedMeetingsWithTranscript(meetings);

    return { ...chat, canCreateMessage };
  }
}
