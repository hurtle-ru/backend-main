import * as yup from 'yup'

import { MeetingScriptAnswer } from "@prisma/client";
import { BasicMeetingScriptQuestion } from "../question/question.dto";
import { BasicMeetingScriptProtocol } from "../protocol/protocol.dto";


export type BasicMeetingScriptAnswer = Omit<
  MeetingScriptAnswer,
  | "protocol"
  | "question"
>;

export const BasicMeetingScriptAnswerSchema: yup.ObjectSchema<BasicMeetingScriptAnswer> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  text: yup.string().defined().trim().min(1).max(1000),
  protocolId: yup.string().defined().length(36),
  questionId: yup.string().defined().length(36),
})

export type CreateMeetingScriptAnswerRequest = Pick<
  MeetingScriptAnswer,
  | "text"
  | "protocolId"
  | "questionId"
>;

export const CreateMeetingScriptAnswerRequestSchema: yup.ObjectSchema<CreateMeetingScriptAnswerRequest> = BasicMeetingScriptAnswerSchema.pick([
  "text",
  "protocolId",
  "questionId",
])


export type PatchMeetingScriptAnswerRequest = Partial<CreateMeetingScriptAnswerRequest>;

export const PatchMeetingScriptAnswerRequestSchema: yup.ObjectSchema<PatchMeetingScriptAnswerRequest> = BasicMeetingScriptAnswerSchema.pick([
  "text",
  "protocolId",
  "questionId",
]).partial()

export type GetMeetingScriptAnswerResponse = BasicMeetingScriptAnswer & {
  protocol?: BasicMeetingScriptProtocol;
  question?: BasicMeetingScriptQuestion;
};