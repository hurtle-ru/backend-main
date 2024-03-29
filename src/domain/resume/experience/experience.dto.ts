import * as yup from "yup"
import { ResumeExperience } from "@prisma/client";
import { start } from "repl";


export type BasicResumeExperience = Omit<
  ResumeExperience,
  | "resume"
>;


const BasicResumeExperienceSchema: yup.ObjectSchema<BasicResumeExperience> = yup.object({
  id: yup.string().defined().length(36),
  company: yup.string().defined().trim().min(3).max(256).nullable(),
  position: yup.string().defined().trim().max(100),
  startMonth: yup.number().defined().min(0).max(12),
  endMonth: yup.number().defined().min(0).max(12).nullable(),
  endYear: yup.number().defined().min(1970).max(new Date().getFullYear()),
  startYear: yup.number().defined().min(1970).max(new Date().getFullYear())
  .test({name: "datesTest", message: "The start date must be earlier than the end date", test: function (item) {
    const startDate = new Date(this.parent.startYear, this.parent.startMonth)
    const endDate = new Date(this.parent.endYear, this.parent.endMonth)

    return startDate < endDate
  }}),
  description: yup.string().defined().min(3).max(3000).nullable(),
  resumeId: yup.string().defined().length(36),
})

export type CreateResumeExperienceRequest = Pick<BasicResumeExperience,
  | "company"
  | "position"
  | "startMonth"
  | "startYear"
  | "endMonth"
  | "endYear"
  | "description"
  | "resumeId"
>

export const CreateResumeExperienceRequestSchema: yup.ObjectSchema<CreateResumeExperienceRequest> = BasicResumeExperienceSchema.pick([
  "company",
  "position",
  "startMonth",
  "startYear",
  "endMonth",
  "endYear",
  "description",
  "resumeId",
])

export type PatchResumeExperienceRequest = Partial<Pick<BasicResumeExperience,
  | "company"
  | "position"
  | "startMonth"
  | "startYear"
  | "endMonth"
  | "endYear"
  | "description"
  | "resumeId"
>>

export const PatchResumeExperienceRequestSchema: yup.ObjectSchema<PatchResumeExperienceRequest> = BasicResumeExperienceSchema.pick([
  "company",
  "position",
  "startMonth",
  "startYear",
  "endMonth",
  "endYear",
  "description",
  "resumeId",
]).partial()
