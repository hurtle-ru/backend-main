import * as yup from "yup"
import { ResumeEducation } from "@prisma/client";


export type BasicResumeEducation = Omit<
  ResumeEducation,
  | "resume"
>;

const BasicResumeEducationSchema: yup.ObjectSchema<BasicResumeEducation> = yup.object({
  id: yup.string().defined().length(36),
  name: yup.string().defined().trim().min(3).max(50),
  description: yup.string().defined().trim().min(3).max(255).nullable(),
  degree: yup.string().defined().trim().min(3).max(50),
  startYear: yup.number().defined().min(1970).max(new Date().getFullYear()).nullable(),
  endYear: yup.number().defined().min(1970).max(new Date().getFullYear())
    .when("startYear", (startYear: any, schema: any) => {
      return schema.test({
        test: (endYear: any) => {
          return !startYear || endYear > startYear;
        },
        message: "The start date must be earlier than the end date",
      })
    }),
  resumeId: yup.string().defined().length(36),
})


export type CreateResumeEducationRequest = Pick<BasicResumeEducation,
  | "name"
  | "description"
  | "degree"
  | "startYear"
  | "endYear"
  | "resumeId"
>

export const CreateResumeEducationRequestSchema: yup.ObjectSchema<CreateResumeEducationRequest> = BasicResumeEducationSchema.pick([
  "name",
  "description",
  "degree",
  "startYear",
  "endYear",
  "resumeId",
])


export type PatchResumeEducationRequest = Partial<Pick<BasicResumeEducation,
  | "name"
  | "description"
  | "degree"
  | "startYear"
  | "endYear"
>>

export const PatchResumeEducationRequestSchema: yup.ObjectSchema<PatchResumeEducationRequest> = BasicResumeEducationSchema.pick([
  "name",
  "description",
  "degree",
  "startYear",
  "endYear",
])
