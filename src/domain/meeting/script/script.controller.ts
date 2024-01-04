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
import { MeetingScriptService } from "./script.service";


@injectable()
@Route("api/v1/meetingScripts")
@Tags("Meeting Script")
export class MeetingScriptController extends Controller {
  constructor(private readonly scriptService: MeetingScriptService) {
    super();
  }
}