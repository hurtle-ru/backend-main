import { injectable, singleton } from "tsyringe";
import { ChatGPTService } from "../../external/chatgpt/chatgpt.service";
import { resumeOcrConfig } from "./resume-ocr.config";
import { FileLike } from "openai/uploads";
import { TemplateRendererService } from "../../external/template-renderer/template-renderer.service";
import { MessageContent, TextContentBlock } from "openai/src/resources/beta/threads/messages/messages";


@injectable()
@singleton()
export class ResumeOcrService {
  TEMPLATE_TYPE = "prompt-templates";
  TEMPLATE_EXTENSION = "txt";

  constructor(
    private readonly chatgptService: ChatGPTService,
    private readonly templateRendererService: TemplateRendererService,
  ) {}

  async recognizePdf(file: Express.Multer.File) {
    const renderedPrompt = this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "resume-ocr-import", this.TEMPLATE_EXTENSION, true
    );

    const response= await this.chatgptService.generatePromptCompletionWithFile(
      renderedPrompt,
      this.multerFileToFile(file),
      resumeOcrConfig.RESUME_OCR_ASSISTANT_ID
    ) as TextContentBlock[];

    const responseText = response[0].text.value;
    const responseJson = JSON.parse(responseText.substring(responseText.indexOf("{"), responseText.lastIndexOf("}") + 1));

    return responseJson;
  }

  multerFileToFile(multerFile: Express.Multer.File): FileLike {
    const { buffer, originalname, mimetype } = multerFile;
    return new File([buffer], originalname, { type: mimetype });
  }
}