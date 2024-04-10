import * as yup from 'yup'

import { MeetingScriptTemplate } from "@prisma/client";
import { BasicMeetingScriptQuestion } from "../question/question.dto";
import { BasicMeetingScriptProtocol } from "../protocol/protocol.dto";


export type BasicMeetingScriptTemplate = Omit<
  MeetingScriptTemplate,
  | "protocols"
  | "questions"
>;

export const BasicMeetingScriptTemplateSchema: yup.ObjectSchema<BasicMeetingScriptTemplate> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  title: yup.string().defined().max(100),
  description: yup.string().defined().max(300),
  answerOptions: yup.array(yup.string().defined().max(300)).defined(),
})

export type CreateMeetingScriptTemplateRequest = Pick<
  MeetingScriptTemplate,
  | "title"
  | "description"
>;
export const CreateMeetingScriptTemplateRequestSchema: yup.ObjectSchema<CreateMeetingScriptTemplateRequest> = BasicMeetingScriptTemplateSchema.pick([
  "title",
  "description"
])


export type PatchMeetingScriptTemplateRequest = Partial<CreateMeetingScriptTemplateRequest>;
export const PatchMeetingScriptTemplateRequestSchema: yup.ObjectSchema<PatchMeetingScriptTemplateRequest> = BasicMeetingScriptTemplateSchema.pick([
  "title",
  "description"
]).partial()


export type GetMeetingScriptTemplateResponse = BasicMeetingScriptTemplate & {
  protocols?: BasicMeetingScriptProtocol[];
  questions?: BasicMeetingScriptQuestion[];
}
