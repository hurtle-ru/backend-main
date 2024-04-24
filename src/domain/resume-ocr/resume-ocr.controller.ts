import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Get, Middlewares,
  Path, Post,
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
import { artifactConfig, FILE_EXTENSION_MIME_TYPES } from "../../external/artifact/artifact.config";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { GetResumeOcrJobResponse } from "./resume-ocr.dto";


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

  @Put("recognize")
  @Middlewares(rateLimit({limit: 4, interval: 3600 * 24}))
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async recognizePdf(
    @Request() req: JwtModel,
    @UploadedFile("file") multerFile: Express.Multer.File,
  ): Promise<{ jobId: string }> {
    await this.artifactService.validateFileAttributes(multerFile, [FILE_EXTENSION_MIME_TYPES[".pdf"]], artifactConfig. MAX_DOCUMENT_FILE_SIZE);

    const fileName = await this.resumeOcrService.savePdf(multerFile);
    const { id } = await this.resumeOcrService.enqueueRecognizePdf({ fileName });

    return { jobId: id! };
  }

  @Post("recognizeAndImport")
  @Middlewares(rateLimit({limit: 4, interval: 3600 * 24}))
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async recognizeAndImport(
    @Request() req: JwtModel,
    @UploadedFile("file") multerFile: Express.Multer.File,
  ): Promise<{ jobId: string }> {
    await this.artifactService.validateFileAttributes(multerFile, [FILE_EXTENSION_MIME_TYPES[".pdf"]], artifactConfig. MAX_DOCUMENT_FILE_SIZE);

    const fileName = await this.resumeOcrService.savePdf(multerFile);
    const { id } = await this.resumeOcrService.enqueueRecognizePdf({ fileName });

    return { jobId: id! };
  }

  @Get("{jobId}")
  @Response<HttpErrorBody & {"error": "Job not found"}>(404)
  public async getResumeOcrJobById(
    @Path() jobId: string,
  ): Promise<GetResumeOcrJobResponse> {
    const job = await this.resumeOcrService.getJob(jobId);
    if (!job) throw new HttpError(404, "Job not found");

    return job;
  }
}
