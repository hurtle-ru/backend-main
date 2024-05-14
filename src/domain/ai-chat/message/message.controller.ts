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
import { MeetingStatus, MeetingType, Prisma } from "@prisma/client";
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
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER])
  @Middlewares(rateLimit({limit: 10, interval: 20}))
  @Response<HttpErrorBody & {"error": "AI Chat not found"}>(404)
  @Response<HttpErrorBody & {"error":
    "Applicant resume not found"
    | "Completed applicant interviews with transcript not found"
  }>(409)
  @Response<HttpErrorBody & {"error": "External text generation service is unavailable"}>(503)
  public async create(
    @Request() req: ExpressRequest & JwtModel<UserRole.APPLICANT | UserRole.EMPLOYER>,
    @Body() body: CreateApplicantAiChatMessageRequest,
  ): Promise<BasicApplicantAiChatMessage> {
    body = CreateApplicantAiChatMessageRequestSchema.validateSync(body);

    const where: Prisma.ApplicantAiChatWhereUniqueInput = {
      id: body.chatId,
      ...{
        "APPLICANT": { applicantId: req.user.id, employerId: null },
        "EMPLOYER": { employerId: req.user.id },
      }[req.user.role]
    }

    const chat = await prisma.applicantAiChat.findUnique({
      where,
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

    if (!chat) throw new HttpError(404, "AI Chat not found");
    if (!chat.applicant.resume) throw new HttpError(409, "Applicant resume not found");

    if (!this.applicantAiChatService.existCompletedMeetingsWithTranscript(chat.applicant.meetings)) {
      throw new HttpError(409, "Completed applicant interviews with transcript not found");
    }

    const systemPrompt = this.applicantAiChatService.getSystemPrompt({
      ...chat.applicant,
      interviews: chat.applicant.meetings,
      resume: chat.applicant.resume,
    });

    try {
      return await this.applicantAiChatService.createMessage(body.question, systemPrompt, chat);
    } catch (e) {
      throw new HttpError(503, "External text generation service is unavailable");
    }
  }
}
