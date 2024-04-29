import { injectable, singleton } from "tsyringe";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HttpError } from "../../../infrastructure/error/http.error";
import { VacancyStatus } from "@prisma/client";
import { ResumeToCheckIsFilled } from "../../resume/resume.prisma-extension";
import { ResumeOcrService } from "../../../external/resume-ocr/resume-ocr.service";
import {
  GetRecognizedResumeResponse,
  GetResumeOcrJobResponse,
  RESUME_OCR_QUEUE_NAME,
} from "../../../external/resume-ocr/resume-ocr.dto";
import {
  MetadataCreateGuestVacancyResponse,
  PatchGuestVacancyResponseQueuedWithOcrRequest,
} from "./guest-response.dto";
import { Job, QueueEvents } from "bullmq";
import { logger } from "../../../infrastructure/logger/logger";
import redis from "../../../infrastructure/mq/redis.provider";
import path from "path";
import { ArtifactService } from "../../../external/artifact/artifact.service";
import { Readable } from "stream";
import { Request } from "express";


@injectable()
@singleton()
export class GuestResponseService {
  public static readonly ARTIFACT_DIR = "guest-response";
  public static readonly RESUME_FILE_NAME = "resume";

  constructor(
    private readonly resumeOcrService: ResumeOcrService,
    private readonly artifactService: ArtifactService,
  ) {
  }

  public async validateVacancyBeforeCreation(vacancyId: string) {
    const vacancy = await prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new HttpError(404, "Vacancy does not exist");

    if (vacancy.status !== VacancyStatus.PUBLISHED || vacancy.isHidden) {
      throw new HttpError(409, "Vacancy is unpublished or hidden");
    }
  }

  public async validateResumeBeforeCreation(resume: ResumeToCheckIsFilled) {
    if (!resume || !prisma.resume.isFilled(resume)) {
      throw new HttpError(409, "Applicant resume is unfilled or does not exist");
    }
  }

  public async saveResumeFile(multerFile: Express.Multer.File, id: string) {
    const extension = path.extname(multerFile.originalname);
    await this.artifactService.saveDocumentFile(multerFile, this.getResumeFilePath(id, extension));
  }

  public async getResumeFile(req: Request, id: string): Promise<Readable | null> {
    const savedResumeFileName = await this.artifactService.getFullFileName(
      `${GuestResponseService.ARTIFACT_DIR}/${id}/`,
      GuestResponseService.RESUME_FILE_NAME,
    );

    if (savedResumeFileName == null) throw new HttpError(404, "File not found");
    const filePath = `${GuestResponseService.ARTIFACT_DIR}/${id}/${savedResumeFileName}`;

    const response = req.res;
    if (response) {
      req.log.trace("File path: ", filePath);
      const [stream, fileOptions] = await this.artifactService.loadFile(filePath);

      if (fileOptions.mimeType) response.setHeader("Content-Type", fileOptions.mimeType);
      response.setHeader("Content-Length", fileOptions.size.toString());

      stream.pipe(response);
      return stream;
    }

    return null;
  }

  public async enqueueCreationWithOcr(multerFile: Express.Multer.File, vacancyId: string) {
    const fileName = await this.resumeOcrService.savePdf(multerFile);
    const job = await this.resumeOcrService.enqueueRecognizePdf({
      fileName,
      metadata: {
        callback: "create-guest-vacancy-response",
        vacancyId,
        guestResponseId: null,
        errorDuringCreation: null,
      },
    });

    const queueEvents = new QueueEvents(RESUME_OCR_QUEUE_NAME, {
      // redis/redislabs.com bug; reference: https://github.com/taskforcesh/bullmq/issues/173
      connection: redis.duplicate(),
    });

    queueEvents.on("completed", async (args: {
      jobId: string;
      returnvalue: string;
      prev?: string;
    }, id: string) => {
      const job = await this.getQueuedWithOcrJob(args.jobId);

      if (job?.data?.metadata?.callback === "create-guest-vacancy-response") {
        const { metadata } = job.data;
        let guestResponse;

        try {
          guestResponse = await this.processCreationWithOcr(job.data);
        } catch (e) {
          logger.error({
            job,
          }, "Error during creation guest response after resume OCR");
        }

        await this.resumeOcrService.patchJobData(job.id, {
          metadata: {
            ...metadata,
            guestResponseId: guestResponse ? guestResponse.id : null,
            errorDuringCreation: !guestResponse,
          },
        });
      }
    });

    return job;
  }

  public async processCreationWithOcr(data: GetResumeOcrJobResponse["data"]) {
    let resume = data.mappedResume!;
    const { vacancyId, overwriteResumeFields } = data.metadata as MetadataCreateGuestVacancyResponse;

    if (overwriteResumeFields) {
      resume = this.createOverwrittenResume(overwriteResumeFields, resume);
    }

    const {
      firstName,
      lastName,
      middleName,
      isReadyToRelocate,
      ...resumeData
    } = resume;

    await this.validateVacancyBeforeCreation(vacancyId);
    await this.validateResumeBeforeCreation(resumeData);

    return await prisma.guestVacancyResponse.create({
      data: {
        vacancyId: vacancyId,
        text: null,
        firstName,
        lastName,
        middleName,
        isReadyToRelocate,
        resume: resumeData,
      },
    });
  }

  public async getQueuedWithOcrJob(jobId: string): Promise<GetResumeOcrJobResponse | null> {
    return this.resumeOcrService.getJob(jobId);
  }

  public async patchQueuedWithOcrJob(job: GetResumeOcrJobResponse, body: PatchGuestVacancyResponseQueuedWithOcrRequest) {
    const { overwriteResumeFields } = body;
    const { id, data } = job;

    if (overwriteResumeFields) {
      const metadata = data.metadata as MetadataCreateGuestVacancyResponse;
      const guestResponseId = metadata.guestResponseId;
      const updatedResume = overwriteResumeFields && data.mappedResume
        ? this.createOverwrittenResume(overwriteResumeFields, data.mappedResume)
        : null;

      await this.resumeOcrService.patchJobData(id, {
        metadata: {
          ...metadata,
          overwriteResumeFields,
        },
        ...(updatedResume ? { mappedResume: updatedResume } : {}),
      });

      if (guestResponseId) {
        await prisma.guestVacancyResponse.update({
          where: { id: guestResponseId },
          data: {
            ...(updatedResume ? { resume: updatedResume } : {}),
          },
        });
      }
    }
  }

  public getResumeFilePath(responseId: string, extension: string) {
    return path.join(
      GuestResponseService.ARTIFACT_DIR,
      responseId,
      GuestResponseService.RESUME_FILE_NAME  + extension,
    );
  }

  private createOverwrittenResume(
    overwriteResumeFields: Required<PatchGuestVacancyResponseQueuedWithOcrRequest>["overwriteResumeFields"],
    resume: GetRecognizedResumeResponse,
  ): GetRecognizedResumeResponse {
    if (!overwriteResumeFields.contacts) return resume;

    const typesToOverwrite = new Set(overwriteResumeFields.contacts.map(c => c.type));

    return {
      ...resume,
      contacts: [
        ...resume.contacts.filter(c => !typesToOverwrite.has(c.type)),
        ...overwriteResumeFields.contacts,
      ],
    };
  }
}