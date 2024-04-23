import { ApplicantAiChatMessage, } from "@prisma/client";
import { BasicApplicantAiChat, } from "../ai-chat.dto";
import * as yup from "yup";
import { yupUint32, } from "../../../infrastructure/validation/requests/int32.yup";


export type BasicApplicantAiChatMessage = Omit<
  ApplicantAiChatMessage,
  | "chat"
>;
export const BasicApplicantAiChatMessageSchema: yup.ObjectSchema<BasicApplicantAiChatMessage> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  prompt: yup.string().defined().trim().min(1,).max(65535,),
  response: yup.string().defined().trim().min(1,).max(65535,),
  promptTokens: yupUint32().defined(),
  completionTokens: yupUint32().defined(),
  chatId: yup.string().defined().length(36,),
},);

export type GetApplicantAiChatMessageResponse = BasicApplicantAiChatMessage & {
  chat?: BasicApplicantAiChat
};

export type CreateApplicantAiChatMessageRequest = Pick<BasicApplicantAiChatMessage,
  "chatId"
> & { question: string }

export const CreateApplicantAiChatMessageRequestSchema: yup.ObjectSchema<CreateApplicantAiChatMessageRequest> = BasicApplicantAiChatMessageSchema.pick(
  ["chatId",],
).shape({
  question: yup.string().trim().min(4,).max(4000,).defined(),
},);
