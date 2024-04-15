import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Get, Middlewares,
  Patch,
  Path, Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";
import { ResumeOcrService } from "./resume-ocr.service";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { artifactConfig, AVAILABLE_IMAGE_FILE_MIME_TYPES } from "../../external/artifact/artifact.config";
import { ArtifactService } from "../../external/artifact/artifact.service";


const PDF_MIME_TYPE = "application/pdf";

@injectable()
@Route("api/v1/resumes-ocr")
@Tags("Resume OCR")
export class ResumeOcrController extends Controller {
  constructor(
    private readonly resumeOcrService: ResumeOcrService,
    private readonly artifactService: ArtifactService
  ) {
    super();
  }

  @Put("pdf")
  @Middlewares(rateLimit({limit: 4, interval: 3600 * 24}))
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async recognizePdf(
    @Request() req: JwtModel,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    await this.artifactService.validateFileAttributes(file, [PDF_MIME_TYPE], artifactConfig.MAX_IMAGE_FILE_SIZE);
    return await this.resumeOcrService.recognizePdf(file);
  }
}
