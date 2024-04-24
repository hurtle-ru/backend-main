import { injectable, singleton } from "tsyringe";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HttpError } from "../../../infrastructure/error/http.error";
import { VacancyStatus } from "@prisma/client";
import { ResumeToCheckIsFilled } from "../../resume/resume.prisma-extension";
import { ResumeOcrService } from "../../resume-ocr/resume-ocr.service";
import {
  GetRecognizedResumeResponse,
  GetResumeOcrJobResponse,
  RESUME_OCR_QUEUE_NAME,
} from "../../resume-ocr/resume-ocr.dto";
import {
  MetadataCreateGuestVacancyResponse,
  PatchGuestVacancyResponseQueuedWithOcrRequest,
} from "./guest-response.dto";
import { Job, QueueEvents } from "bullmq";
import { logger } from "../../../infrastructure/logger/logger";
import redis from "../../../infrastructure/mq/redis.provider";


@injectable()
@singleton()
export class GuestResponseService {
  constructor(
    private readonly resumeOcrService: ResumeOcrService,
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

      if(job?.data?.metadata?.callback === "create-guest-vacancy-response") {
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
        })
      }
    });

    return job;
  }

  public async processCreationWithOcr(data: GetResumeOcrJobResponse["data"]) {
    let resume = data.mappedResume!;
    const { vacancyId, overwriteResumeFields } = data.metadata as MetadataCreateGuestVacancyResponse;

    if(overwriteResumeFields) {
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

  async patchQueuedWithOcrJob(job: GetResumeOcrJobResponse, body: PatchGuestVacancyResponseQueuedWithOcrRequest) {
    const { overwriteResumeFields } = body;
    const { id, data } = job;

    if(overwriteResumeFields) {
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

      if(guestResponseId) {
        await prisma.guestVacancyResponse.update({
          where: { id: guestResponseId },
          data: {
            ...(updatedResume ? { resume: updatedResume } : {}),
          },
        })
      }
    }
  }

  private createOverwrittenResume(
    overwriteResumeFields: Required<PatchGuestVacancyResponseQueuedWithOcrRequest>["overwriteResumeFields"],
    resume: GetRecognizedResumeResponse
  ): GetRecognizedResumeResponse {
    if(!overwriteResumeFields.contacts) return resume;

    const typesToOverwrite = new Set(overwriteResumeFields.contacts.map(c => c.type));

    return {
      ...resume,
      contacts: [
        ...resume.contacts.filter(c => !typesToOverwrite.has(c.type)),
        ...overwriteResumeFields.contacts,
      ],
    }
  };
}