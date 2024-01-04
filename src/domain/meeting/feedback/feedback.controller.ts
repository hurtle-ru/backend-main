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
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { MeetingFeedbackService } from "./feedback.service";


@injectable()
@Route("api/v1/meetingFeedback")
@Tags("Meeting Feedback")
export class MeetingFeedbackController extends Controller {
  constructor(private readonly feedbackService: MeetingFeedbackService) {
    super();
  }
}