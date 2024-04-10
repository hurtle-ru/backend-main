import * as yup from 'yup'


import { MeetingScriptQuestion } from "@prisma/client";
import { BasicMeetingScriptTemplate } from "../template/template.dto";
import { BasicMeetingScriptAnswer } from "../answer/answer.dto";


export type BasicMeetingScriptQuestion = Omit<
  MeetingScriptQuestion,
  | "answers"
  | "template"
>;

export const BasicMeetingScriptQuestionSchema: yup.ObjectSchema<BasicMeetingScriptQuestion> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  text: yup.string().defined().max(300),
  answerOptions: yup.array(yup.string().defined().max(300)).defined(),
})

export type CreateMeetingScriptQuestionRequest = Pick<
  MeetingScriptQuestion,
  | "text"
  | "answerOptions"
>;

export const CreateMeetingScriptQuestionRequestSchema: yup.ObjectSchema<CreateMeetingScriptQuestionRequest> = BasicMeetingScriptQuestionSchema.pick([
  "text",
  "answerOptions"
])

export type PatchMeetingScriptQuestionRequest = Partial<CreateMeetingScriptQuestionRequest>;
export const PatchMeetingScriptQuestionRequestSchema: yup.ObjectSchema<PatchMeetingScriptQuestionRequest> = BasicMeetingScriptQuestionSchema.pick([
  "text",
  "answerOptions"
]).partial()

export type GetMeetingScriptQuestionResponse = BasicMeetingScriptQuestion & {
  answers?: BasicMeetingScriptAnswer[];
  template?: BasicMeetingScriptTemplate;
};
