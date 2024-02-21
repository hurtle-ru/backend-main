import { ApplicantAiChatMessage } from "@prisma/client";
import { BasicApplicantAiChat } from "../ai-chat.dto";


export type BasicApplicantAiChatMessage = Omit<
  ApplicantAiChatMessage,
  | "chat"
>

export type GetApplicantAiChatMessage = BasicApplicantAiChatMessage & {
  chat?: BasicApplicantAiChat
}