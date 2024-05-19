import { injectable, singleton } from "tsyringe";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { HttpError } from "../../infrastructure/error/http.error";
import { ResumeOcrService as ExternalResumeOcrService } from "../../external/resume-ocr/resume-ocr.service";
import {
  GetRecognizedResumeResponse,
  GetResumeOcrJobResponse,
  RESUME_OCR_QUEUE_NAME,
} from "../../external/resume-ocr/resume-ocr.dto";
import {
  MetadataImportResumeWithOcr,
  MetadataImportResumeWithOcrCallbackName,
  OcrMappedResumeSchema,
  PatchImportResumeWithOcrQueuedRequest,
} from "./resume-ocr.dto";
import { Job, QueueEvents } from "bullmq";
import { logger } from "../../infrastructure/logger/logger";
import path from "path";
import { ArtifactService } from "../../external/artifact/artifact.service";
import { Readable } from "stream";
import { Request } from "express";


@injectable()
@singleton()
export class ResumeOcrService {
  public static readonly ARTIFACT_DIR = "guest-response";
  public static readonly RESUME_FILE_NAME = "resume";

  private readonly queueEventsCallback = new QueueEvents(RESUME_OCR_QUEUE_NAME).on("completed", async (args: {
    jobId: string;
    returnvalue: string;
    prev?: string;
  }, id: string) => {
    const job = await this.getQueuedWithOcrJob(args.jobId);

    if (job?.data?.metadata?.callback === MetadataImportResumeWithOcrCallbackName) {
      try {
        await this.processCreationWithOcr(job.data);
      } catch (e) {
        logger.error({
          job,
          error: e,
        }, "Error during process after import resume OCR");
      }
    }
  });

  constructor(
    private readonly externalResumeOcrService: ExternalResumeOcrService,
    private readonly artifactService: ArtifactService,
  ) {}

  public async saveResumeFile(multerFile: Express.Multer.File, id: string) {
    const extension = path.extname(multerFile.originalname);
    await this.artifactService.saveDocumentFile(multerFile, this.getResumeFilePath(id, extension));
  }

  public async getResumeFile(req: Request, id: string): Promise<Readable | null> {
    const savedResumeFileName = await this.artifactService.getFullFileName(
      `${ResumeOcrService.ARTIFACT_DIR}/${id}/`,
      ResumeOcrService.RESUME_FILE_NAME,
    );

    if (savedResumeFileName == null) throw new HttpError(404, "File not found");
    const filePath = `${ResumeOcrService.ARTIFACT_DIR}/${id}/${savedResumeFileName}`;

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

  public async enqueueImportWithOcr(multerFile: Express.Multer.File, applicantId: string) {
    const fileName = await this.externalResumeOcrService.savePdf(multerFile);
    const job = await this.externalResumeOcrService.enqueueRecognizePdf({
      fileName,
      metadata: {
        callback: MetadataImportResumeWithOcrCallbackName,
        applicantId,
        errorDuringImport: null,
      },
    });

    return job;
  }

  public async processCreationWithOcr(data: GetResumeOcrJobResponse["data"]) {
    let resume = data.mappedResume!;
    const { applicantId, overwriteResumeFields } = data.metadata as MetadataImportResumeWithOcr;

    if (overwriteResumeFields) {
      resume = this.createOverwrittenResume(overwriteResumeFields, resume);
    }

    const {
      // unused
      firstName, middleName, lastName, birthDate, country,

      certificates, contacts, education, experience, languages, isReadyToRelocate,
      ...resumeScalar
    } = resume;

    const validatedResumeData = OcrMappedResumeSchema.validateSync({
      certificates, contacts, education, experience, languages, isReadyToRelocate,
      ...resumeScalar,
    });

    const resumeData = {
      createdAt: validatedResumeData.createdAt,
      importedFrom: validatedResumeData.importedFrom,
      importedId: validatedResumeData.importedId,
      title: validatedResumeData.title,
      summary: validatedResumeData.summary,
      city: validatedResumeData.city,
      skills: validatedResumeData.skills,
      desiredSalary: validatedResumeData.desiredSalary,
      desiredSalaryCurrency: validatedResumeData.desiredSalaryCurrency,

      certificates: {
        createMany: {
          data: validatedResumeData.certificates,
        },
      },
      contacts: {
        createMany: {
          data: validatedResumeData.contacts,
        },
      },
      education: {
        createMany: {
          data: validatedResumeData.education,
        },
      },
      experience: {
        createMany: {
          data: validatedResumeData.experience,
        },
      },
      languages: {
        createMany: {
          data: validatedResumeData.languages,
        },
      },
    };

    await prisma.resume.deleteMany({ where: { applicantId }});
    const created = await prisma.resume.create({
      data: { applicantId, ...resumeData },
    });
    logger.info({ applicantId }, "Success import resume with Ocr");
    return created;
  }

  public async getQueuedWithOcrJob(jobId: string): Promise<GetResumeOcrJobResponse | null> {
    return this.externalResumeOcrService.getJob(jobId);
  }

  public async patchQueuedWithOcrJob(job: GetResumeOcrJobResponse, body: PatchImportResumeWithOcrQueuedRequest) {
    const { overwriteResumeFields } = body;
    const { id, data } = job;

    if (overwriteResumeFields) {
      const metadata = data.metadata as MetadataImportResumeWithOcr;
      const updatedResume = overwriteResumeFields && data.mappedResume
        ? this.createOverwrittenResume(overwriteResumeFields, data.mappedResume)
        : null;

      await this.externalResumeOcrService.patchJobData(id, {
        metadata: {
          ...metadata,
          overwriteResumeFields,
        },
        ...(updatedResume ? { mappedResume: updatedResume } : {}),
      });
    }
  }

  public getResumeFilePath(responseId: string, extension: string) {
    return path.join(
      ResumeOcrService.ARTIFACT_DIR,
      responseId,
      ResumeOcrService.RESUME_FILE_NAME  + extension,
    );
  }

  private createOverwrittenResume(
    overwriteResumeFields: Required<PatchImportResumeWithOcrQueuedRequest>["overwriteResumeFields"],
    resume: GetRecognizedResumeResponse,
  ): GetRecognizedResumeResponse {
    if (!overwriteResumeFields.contacts) return resume;

    const typesToOverwrite = new Set(overwriteResumeFields.contacts.map((c: { type: any; }) => c.type));

    return {
      ...resume,
      contacts: [
        ...resume.contacts.filter(c => !typesToOverwrite.has(c.type)),
        ...overwriteResumeFields.contacts,
      ],
    };
  }
}
