import * as yup from 'yup'
import { ResumeContact, ContactType } from "@prisma/client";
import { yupOneOfEnum } from '../../../infrastructure/validation/requests/enum.yup';


export type BasicResumeContact = Omit<
  ResumeContact,
  | "resume"
>;



const BasicResumeContactSchema = yup.object({
  name: yup.string().trim().min(3).max(50).optional(),
  type: yupOneOfEnum(ContactType),
  value: yup.string().trim().min(3).max(255),
  preferred: yup.boolean(),
  resumeId: yup.string().length(36),
})

export class CreateResumeContactRequest {
  static schema = BasicResumeContactSchema.pick([
    "name",
    "type",
    "value",
    "preferred",
    "resumeId",
  ])

  constructor (
    public name: string,
    public type: keyof typeof ContactType,
    public value: string,
    public preferred: boolean,
    public resumeId: string,
  ) {}
}

export class PutResumeContactRequest {
  static schema = BasicResumeContactSchema.pick([
    "name",
    "type",
    "value",
    "preferred",
    "resumeId",
  ])

  constructor (
    public name: string,
    public type: keyof typeof ContactType,
    public value: string,
    public preferred: boolean,
    public resumeId: string,
  ) {}
}