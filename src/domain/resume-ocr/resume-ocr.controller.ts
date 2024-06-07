import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Get, Middlewares, Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags, UploadedFile,
} from "tsoa";
import {
  CreateQueuedImportWithOcrResponse,
  PatchImportResumeWithOcrQueuedRequest,
  PatchImportResumeWithOcrQueuedRequestSchema,
} from "./resume-ocr.dto";
import { JwtModel, UserRole } from "../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../infrastructure/error/http.error";
import { ResumeOcrService } from "./resume-ocr.service";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { routeRateLimit as rateLimit } from "../../infrastructure/rate-limiter/rate-limiter.middleware";
import { artifactConfig, FILE_EXTENSION_MIME_TYPES } from "../../external/artifact/artifact.config";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { GetResumeOcrJobResponse } from "../../external/resume-ocr/resume-ocr.dto";


@injectable()
@Route("api/v1/resumeOcr")
@Tags("ResumeOcr")
export class ResumeOcrController extends Controller {
  public static readonly RESUME_FILE_MIME_TYPE = "application/pdf";

  constructor(
    private readonly artifactService: ArtifactService,
    private readonly resumeOcrService: ResumeOcrService,
  ) {
    super();
  }

  @Post("queuedImportWithOcr")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Middlewares(rateLimit({ limit: 4, interval: 3600 * 24 }))
  @Response<HttpErrorBody & {"error": "Manager must provide applicant id"}>(422)
  @Response<HttpErrorBody & {"error": "Applicant does not exist"}>(404)
  @Response<HttpErrorBody & {"error": "Applicant resume is unfilled or does not exist"}>(409)
  @Response<HttpErrorBody & {"error": "File is too large"}>(413)
  @Response<HttpErrorBody & {"error": "Invalid file mime type"}>(415)
  public async createQueuedWithOcr(
    @Request() req: JwtModel,
    @UploadedFile("file") multerFile: Express.Multer.File,
    @Query() applicantId?: string,
  ): Promise<CreateQueuedImportWithOcrResponse> {
    await this.artifactService.validateFileAttributes(multerFile, [FILE_EXTENSION_MIME_TYPES[".pdf"]], artifactConfig. MAX_DOCUMENT_FILE_SIZE);

    if (req.user.role === UserRole.MANAGER) {
      if (!applicantId) { throw new HttpError(422, "Manager must provide applicant id"); }

      if (!await prisma.applicant.exists({ id: applicantId })) {
        throw new HttpError(404, "Applicant does not exist");
      }
    } else {
      applicantId = req.user.id;
    }

    const { id } = await this.resumeOcrService.enqueueImportWithOcr(multerFile, applicantId!);
    return { jobId: id! };
  }

  @Patch("queuedImportWithOcr/{jobId}/resume")
  @Middlewares(rateLimit({ limit: 100, interval: 3600 * 24 }))
  @Response<HttpErrorBody & {"error": "Job not found"}>(404)
  public async patchQueuedWithOcrById(
    @Request() req: JwtModel,
    @Path() jobId: string,
    @Body() body: PatchImportResumeWithOcrQueuedRequest,
  ) {
    body = PatchImportResumeWithOcrQueuedRequestSchema.validateSync(body);

    const job = await this.resumeOcrService.getQueuedWithOcrJob(jobId);
    if (!job) throw new HttpError(404, "Job not found");

    await this.resumeOcrService.patchQueuedWithOcrJob(job, body);
  }

  @Get("queuedImportWithOcr/{jobId}")
  @Middlewares(rateLimit({ limit: 50, interval: 3600 }))
  @Response<HttpErrorBody & {"error": "Job not found"}>(404)
  public async getQueuedWithOcrById(
    @Request() req: JwtModel,
    @Path() jobId: string,
  ): Promise<GetResumeOcrJobResponse> {
    const job = await this.resumeOcrService.getQueuedWithOcrJob(jobId);

    if (!job) throw new HttpError(404, "Job not found");

    return job;
  }
}
