import * as yup from "yup";

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
export const BasicApplicantAiChatSchema: yup.ObjectSchema<ApplicantAiChat> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  applicantId: yup.string().defined().length(36),
  employerId: yup.string().defined().length(36),
});

export type CreateApplicantAiChatRequest = Pick<
  ApplicantAiChat,
  | "applicantId"
>;

export const CreateApplicantAiChatRequestSchema = BasicApplicantAiChatSchema.pick([
  "applicantId",
]);

export type GetApplicantAiChatResponse = BasicApplicantAiChat & {
  applicant?: BasicApplicant,
  employer?: BasicEmployer,
  history?: BasicApplicantAiChatMessage[];
}
