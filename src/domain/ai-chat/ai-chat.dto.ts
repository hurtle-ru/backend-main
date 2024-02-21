import { ApplicantAiChat } from "@prisma/client";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicApplicantAiChatMessage } from "./message/message.dto";


export type BasicApplicantAiChat = Omit<
  ApplicantAiChat,
  | "applicant"
  | "employer"
  | "history"
>

export type CreateApplicantAiChatRequest = Pick<
  ApplicantAiChat,
  | "applicantId"
>

export type GetApplicantAiChatResponse = BasicApplicantAiChat & {
  applicant?: BasicApplicant,
  employer?: BasicEmployer,
  history?: BasicApplicantAiChatMessage[];
}