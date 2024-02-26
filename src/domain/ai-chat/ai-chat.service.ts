import { injectable, singleton } from "tsyringe";
import { ChatGPTService } from "../../external/chatgpt/chatgpt.service";
import { BasicApplicantAiChatMessage } from "./message/message.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { ApplicantAiChatMessage, Meeting, Resume } from "@prisma/client";
import { TemplateRendererService } from "../../external/template-renderer/template-renderer.service";
import { ChatCompletionMessageParam } from "openai/resources";
import { BasicApplicant } from "../applicant/applicant.dto";


@injectable()
@singleton()
export class ApplicantAiChatService {
  TEMPLATE_TYPE = "prompt-templates";
  TEMPLATE_EXTENSION = "txt";

  constructor(
    private readonly chatgptService: ChatGPTService,
    private readonly templateRendererService: TemplateRendererService,
  ) {}

  async generateMessage(
    question: string,
    chatId: string,
    history: ApplicantAiChatMessage[],
    applicant: BasicApplicant & {
      interviews: Meeting[],
      resume: Resume,
    },
  ): Promise<BasicApplicantAiChatMessage> {
    const renderedResume = this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "resume", this.TEMPLATE_EXTENSION, {
        applicant,
        resume: applicant.resume,
      }, true);

    const renderedInterviews = this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "interviews", this.TEMPLATE_EXTENSION, {
        interviews: applicant.interviews,
      }, true);

    const renderedPrompt = this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "applicant-ai-chat-question", this.TEMPLATE_EXTENSION, {
        resume: renderedResume,
        interviews: renderedInterviews,
        question,
      }, true);

    const completion = await this.chatgptService.generateChatCompletion(
      this.mapHistory(history), renderedPrompt
    );

    return prisma.applicantAiChatMessage.create({
      data: {
        chatId,
        prompt: question,
        response: completion.choices[0].message.content!,
        promptTokens: completion.usage!.prompt_tokens,
        completionTokens: completion.usage!.completion_tokens,
      },
    });
  }

  mapHistory(history: ApplicantAiChatMessage[]): ChatCompletionMessageParam[] {
    return history.flatMap(message => [
      { content: message.prompt, role: "user" },
      { content: message.response, role: "assistant" },
    ]);
  }
}