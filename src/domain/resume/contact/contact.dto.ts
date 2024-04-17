import * as yup from 'yup'
import { ResumeContact, ContactType } from "@prisma/client";
import { yupOneOfEnum } from '../../../infrastructure/validation/requests/enum.yup';


export type BasicResumeContact = Omit<
  ResumeContact,
  | "resume"
>;


export const BasicResumeContactSchema: yup.ObjectSchema<BasicResumeContact> = yup.object({
  id: yup.string().defined().length(36),
  name: yup.string().defined().trim().min(0).max(255).nullable(),
  type: yupOneOfEnum(ContactType).defined(),
  value: yup.string().defined().trim().min(0).max(255),
  preferred: yup.boolean().defined(),
  resumeId: yup.string().defined().length(36),
})


export type CreateResumeContactRequest = Pick<BasicResumeContact,
  | "name"
  | "type"
  | "value"
  | "preferred"
  | "resumeId"
>

export const CreateResumeContactRequestSchema: yup.ObjectSchema<CreateResumeContactRequest> = BasicResumeContactSchema.pick([
  "name",
  "type",
  "value",
  "preferred",
  "resumeId",
])

export type PatchResumeContactRequest = Partial<Pick<BasicResumeContact,
  | "name"
  | "type"
  | "value"
  | "preferred"
  | "resumeId"
>>

export const PatchResumeContactRequestSchema: yup.ObjectSchema<PatchResumeContactRequest> = BasicResumeContactSchema.pick([
  "name",
  "type",
  "value",
  "preferred",
  "resumeId",
]).partial()
