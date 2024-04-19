import { injectable, singleton } from "tsyringe";
import { ChatGPTService } from "../../external/chatgpt/chatgpt.service";
import { resumeOcrConfig } from "./resume-ocr.config";
import { FileLike } from "openai/uploads";
import { TemplateRendererService } from "../../external/template-renderer/template-renderer.service";
import { TextContentBlock } from "openai/src/resources/beta/threads/messages/messages";
import { ResumeOcrJobData, ResumeOcrJobInfo } from "./resume-ocr.dto";
import { JobsOptions } from "bullmq";
import { ResumeOcrQueue } from "./mq/resume-ocr.queue";
import { randomUUID } from "crypto";


@injectable()
@singleton()
export class ResumeOcrService {
  TEMPLATE_TYPE = "prompt-templates";
  TEMPLATE_EXTENSION = "txt";

  constructor(
    private readonly queue: ResumeOcrQueue,
    private readonly chatgptService: ChatGPTService,
    private readonly templateRendererService: TemplateRendererService,
  ) {}

  async enqueueRecognizingPdf( data: ResumeOcrJobData, opts?: JobsOptions ): Promise<string> {
    return await this.queue.enqueueResumeOcr(data, {...opts, jobId: randomUUID()})
  }

  async recognizePdf({ file }: ResumeOcrJobData) {
    const renderedPrompt = this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "resume-ocr-import", this.TEMPLATE_EXTENSION, true
    );

    const response = await this.chatgptService.generatePromptCompletionWithFile(
      renderedPrompt,
      this.multerFileToFile(file),
      resumeOcrConfig.RESUME_OCR_ASSISTANT_ID
    ) as TextContentBlock[];

    const responseText = response[0].text.value;
    const responseJson = JSON.parse(responseText.substring(responseText.indexOf("{"), responseText.lastIndexOf("}") + 1));

    return responseJson;
  }

  async getResumeOcrJobInfo(jobId: string): Promise<ResumeOcrJobInfo | undefined> {
    return this.queue.getJobInfo(jobId)
  }

  multerFileToFile(multerFile: Express.Multer.File): FileLike {
    const { buffer, originalname, mimetype } = multerFile;
    return new File([buffer], originalname, { type: mimetype });
  }
}
