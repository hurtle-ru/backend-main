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
import { ApplicantAiChatService } from "../ai-chat.service";


@injectable()
@Route("api/v1/applicantAiChatMessages")
@Tags("Applicant AI Chat Message")
export class ApplicantAiChatMessageController extends Controller {
  constructor(
    private readonly applicantAiChatService: ApplicantAiChatService,
  ) {
    super();
  }
}
