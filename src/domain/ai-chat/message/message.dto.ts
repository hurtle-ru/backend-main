import { ApplicantAiChatMessage } from "@prisma/client";
import { BasicApplicantAiChat } from "../ai-chat.dto";
import * as yup from "yup";


export type BasicApplicantAiChatMessage = Omit<
  ApplicantAiChatMessage,
  | "chat"
>;

export type GetApplicantAiChatMessageResponse = BasicApplicantAiChatMessage & {
  chat?: BasicApplicantAiChat
};

export class CreateApplicantAiChatMessageRequest {
  static schema = yup.object({
    chatId: yup.string().required().min(1),
    question: yup.string().required().min(4).max(4000),
  });

  constructor(
    public chatId: string,
    public question: string,
  ) {}
}