import { injectable } from "tsyringe";
import {
  Controller,
  Get, Middlewares,
  Path,
  Put,
  Query,
  Request,
  Response,
  Route,
  Tags,
  UploadedFile,
} from "tsoa";
import { ResumeOcrService } from "./resume-ocr.service";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { artifactConfig } from "../../external/artifact/artifact.config";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { ResumeOcrJobInfo } from "./resume-ocr.dto";


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
  ): Promise<{jobId: string}> {
    await this.artifactService.validateFileAttributes(file, [PDF_MIME_TYPE], artifactConfig.MAX_IMAGE_FILE_SIZE);

    return {jobId: await this.resumeOcrService.enqueueRecognizingPdf({ file })};
  }

  @Get("{jobId}")
  @Response<HttpErrorBody & {"error": "Job not found"}>(404)
  public async getRecognizePdfInfo(
    @Path() jobId: string,
  ): Promise<ResumeOcrJobInfo> {
    const info = await this.resumeOcrService.getResumeOcrJobInfo(jobId);

    if (!info) {
      throw new HttpError(404, "Job not found")
    }

    return info
  }

}
