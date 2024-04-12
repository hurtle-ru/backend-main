import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Middlewares,
  Post,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { ApplicantAiChatService } from "../ai-chat.service";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import {
  BasicApplicantAiChatMessage,
  CreateApplicantAiChatMessageRequest,
  CreateApplicantAiChatMessageRequestSchema,
} from "./message.dto";
import { MeetingStatus, MeetingType } from "@prisma/client";
import { routeRateLimit as rateLimit } from "../../../infrastructure/rate-limiter/rate-limiter.middleware";
import { Request as ExpressRequest } from "express";


@injectable()
@Route("api/v1/applicantAiChatMessages")
@Tags("Applicant AI Chat Message")
export class ApplicantAiChatMessageController extends Controller {
  constructor(
    private readonly applicantAiChatService: ApplicantAiChatService,
  ) {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.EMPLOYER])
  @Middlewares(rateLimit({limit: 10, interval: 20}))
  @Response<HttpErrorBody & {"error": "AI Chat not found"}>(404)
  @Response<HttpErrorBody & {"error": "Applicant resume not found"}>(409)
  @Response<HttpErrorBody & {"error": "Completed applicant interviews with transcript not found"}>(409)
  @Response<HttpErrorBody & {"error": "External text generation service is unavailable"}>(503)
  public async create(
    @Request() req: ExpressRequest & JwtModel,
    @Body() body: CreateApplicantAiChatMessageRequest
  ): Promise<BasicApplicantAiChatMessage> {
    CreateApplicantAiChatMessageRequestSchema.validateSync(body);

    const chat = await prisma.applicantAiChat.findUnique({
      where: { id: body.chatId, employerId: req.user.id },
      include: {
        history: true,
        applicant: {
          include: {
            meetings: true,
            resume: true,
          },
        },
      },
    });

    if(!chat) throw new HttpError(404, "AI Chat not found");
    if(!chat.applicant.resume) throw new HttpError(409, "Applicant resume not found");

    const applicantInterviews = chat.applicant.meetings.filter(m =>
      m.type === MeetingType.INTERVIEW
      && m.status === MeetingStatus.COMPLETED
      && m.transcript
      && m.transcript.trim().length > 0,
    );

    if(applicantInterviews.length === 0) throw new HttpError(409, "Completed applicant interviews with transcript not found");

    const systemPrompt = this.applicantAiChatService.getSystemPrompt({
      ...chat.applicant,
      interviews: chat.applicant.meetings,
      resume: chat.applicant.resume,
    });

    try {
      return await this.applicantAiChatService.createMessage(body.question, systemPrompt, chat);
    } catch(e) {
      throw new HttpError(503, "External text generation service is unavailable");
    }
  }
}
