import * as yup from "yup";
import { ResumeExperience } from "@prisma/client";


export type BasicResumeExperience = Omit<
  ResumeExperience,
  | "resume"
>;


export const BasicResumeExperienceSchema: yup.ObjectSchema<BasicResumeExperience> = yup.object({
  id: yup.string().defined().length(36),
  company: yup.string().defined().trim().min(0).max(256).nullable(),
  position: yup.string().defined().trim().max(255),
  startMonth: yup.number().defined().max(12).nullable(),
  startYear: yup.number().defined().max(9999).nullable(),
  endMonth: yup.number().defined().max(12).nullable(),
  endYear: yup.number().defined().max(9999).nullable(),
  description: yup.string().defined().trim().min(0).max(3000).nullable(),
  resumeId: yup.string().defined().length(36),
});

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
]);

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
]).partial();
