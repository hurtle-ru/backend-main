import { injectable, singleton } from "tsyringe";
import { ChatGPTService } from "../../external/chatgpt/chatgpt.service";
import { BasicApplicantAiChatMessage } from "./message/message.dto";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { ApplicantAiChatMessage, Meeting, MeetingStatus, MeetingType, Resume } from "@prisma/client";
import { TemplateRendererService } from "../../external/template-renderer/template-renderer.service";
import { ChatCompletionMessageParam } from "openai/resources";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicMeeting } from "../meeting/meeting.dto";


@injectable()
@singleton()
export class ApplicantAiChatService {
  TEMPLATE_TYPE = "prompt-templates";

  TEMPLATE_EXTENSION = "txt";

  constructor(
    private readonly chatgptService: ChatGPTService,
    private readonly templateRendererService: TemplateRendererService,
  ) {}

  async createMessage(
    question: string,
    systemPrompt: string,
    chat: {
      id: string,
      history: ApplicantAiChatMessage[],
    },
  ): Promise<BasicApplicantAiChatMessage> {
    const completion = await this.chatgptService.generateChatCompletion(
      question, [
        { content: systemPrompt, role: "system" },
        ...this.mapHistory(chat.history),
      ],
    );

    return prisma.applicantAiChatMessage.create({
      data: {
        chatId: chat.id,
        prompt: question,
        response: completion.choices[0].message.content!,
        promptTokens: completion.usage!.prompt_tokens,
        completionTokens: completion.usage!.completion_tokens,
      },
    });
  }

  getSystemPrompt(
    applicant: BasicApplicant & {
      interviews: Meeting[],
      resume: Resume,
    },
  ): string {
    const renderedResume = this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "resume", this.TEMPLATE_EXTENSION, {
        applicant,
        resume: applicant.resume,
      }, true,
    );

    const renderedInterviews = this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "interviews", this.TEMPLATE_EXTENSION, {
        interviews: applicant.interviews,
      }, true,
    );

    return this.templateRendererService.renderTemplate(
      this.TEMPLATE_TYPE, "applicant-ai-chat-question", this.TEMPLATE_EXTENSION, {
        resume: renderedResume,
        interviews: renderedInterviews,
      }, true,
    );
  }

  existCompletedMeetingsWithTranscript(meetings: BasicMeeting[],): boolean {
    return meetings.filter((m) =>
      m.type === MeetingType.INTERVIEW
      && m.status === MeetingStatus.COMPLETED
      && m.transcript
      && m.transcript.trim().length > 0,
    ).length !== 0;
  }

  private mapHistory(history: ApplicantAiChatMessage[]): ChatCompletionMessageParam[] {
    return history.flatMap((message) => [
      { content: message.prompt, role: "user" },
      { content: message.response, role: "assistant" },
    ]);
  }
}