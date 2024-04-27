import { ArtifactService } from "../artifact/artifact.service";

// Hack to fix lib "pdf-text-reader"
declare global {
  export type SVGGraphics = any;
}

import { injectable, singleton } from "tsyringe";
import { ChatGPTService } from "../chatgpt/chatgpt.service";
import { resumeOcrConfig } from "./resume-ocr.config";
import { TemplateRendererService } from "../template-renderer/template-renderer.service";
import { GetResumeOcrJobResponse, ResumeOcrJobData } from "./resume-ocr.dto";
import { Job, JobsOptions } from "bullmq";
import { ResumeOcrQueue } from "./mq/resume-ocr.queue";
import { randomUUID } from "crypto";
import {readPdfText} from "pdf-text-reader";
import * as path from "path";
import * as streamConsumers from "node:stream/consumers";
import { jsonrepair } from "jsonrepair";
import { logger } from "../../infrastructure/logger/logger";
import { Threads } from "openai/resources/beta";
import TextContentBlock = Threads.TextContentBlock;


@injectable()
@singleton()
export class ResumeOcrService {
  public static TEMPLATE_TYPE = "prompt-templates";

  public static TEMPLATE_EXTENSION = "txt";

  public static TEMPLATE_RECOGNIZE_PDF_NAME = "resume-ocr-recognize-pdf";

  public static ARTIFACT_DIR = "resume-ocr";

  constructor(
    private readonly queue: ResumeOcrQueue,
    private readonly chatgptService: ChatGPTService,
    private readonly templateRendererService: TemplateRendererService,
    private readonly artifactService: ArtifactService,
  ) {}

  async savePdf(multerFile: Express.Multer.File): Promise<string> {
    const fileName = randomUUID();
    const fileFullName = fileName + ".pdf";
    const filePath = path.join(ResumeOcrService.ARTIFACT_DIR, fileFullName);

    await this.artifactService.saveDocumentFile(multerFile, filePath);
    return fileName;
  }

  async enqueueRecognizePdf(
    jobData: ResumeOcrJobData,
  ): Promise<Job<ResumeOcrJobData>> {
    return await this.queue.enqueueRecognizePdf(jobData);
  }

  async recognizePdf({ fileName }: ResumeOcrJobData) {
    const fullFileName = fileName + ".pdf";
    const filePath = path.join(ResumeOcrService.ARTIFACT_DIR, fullFileName);

    const [stream, fileOptions] = await this.artifactService.loadFile(filePath);
    const buffer = await streamConsumers.arrayBuffer(stream);
    const file = this.bufferToFile(buffer, fullFileName, fileOptions.mimeType, "CV.pdf");

    const renderedPrompt = this.templateRendererService.renderTemplate(
      ResumeOcrService.TEMPLATE_TYPE,
      ResumeOcrService.TEMPLATE_RECOGNIZE_PDF_NAME,
      ResumeOcrService.TEMPLATE_EXTENSION,
      {},
      true,
    );

    const response = await this.chatgptService.generatePromptCompletionWithFile(
      renderedPrompt,
      file,
      resumeOcrConfig.RESUME_OCR_ASSISTANT_ID,
    ) as TextContentBlock[];

    try {
      const responseText = response[0].text.value;
      return JSON.parse(this.cleanUpCompletion(responseText));
    } catch (e) {
      logger.error({
        response,
      }, "Error occurred during parsing response");
      throw e;
    }
  }

  async patchJobData(jobId: string, data: Partial<ResumeOcrJobData>) {
    return this.queue.patchJobData(jobId, data);
  }

  async getJob(jobId: string): Promise<GetResumeOcrJobResponse | null> {
    return this.queue.getJob(jobId);
  }

  async recognizePlainTextFromPdf(buffer: ArrayBuffer): Promise<string> {
    return await readPdfText({ data: buffer });
  }

  private bufferToFile(buffer: ArrayBuffer, originalName: string, mimeType: string | null, newName?: string): File {
    return new File(
      [buffer],
      newName ? newName : originalName,
      { type: mimeType ?? undefined },
    );
  }

  private cleanUpCompletion(completion: string): string {
    completion = completion.substring(completion.indexOf("{"), completion.lastIndexOf("}") + 1);
    return jsonrepair(completion);
  }
}