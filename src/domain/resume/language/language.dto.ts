import * as yup from "yup";
import { ResumeLanguage } from "@prisma/client";


export type BasicResumeLanguage = Omit<
  ResumeLanguage,
  | "resume"
>;


export const BasicResumeLanguageSchema: yup.ObjectSchema<BasicResumeLanguage> = yup.object({
  id: yup.string().defined().length(36),
  name: yup.string().defined().trim().max(100),
  level: yup.string().defined().trim().max(100).nullable(),
  resumeId: yup.string().defined().length(36),
});

export type CreateResumeLanguageRequest = Pick<BasicResumeLanguage,
  | "name"
  | "level"
  | "resumeId"
>

export const CreateResumeLanguageRequestSchema: yup.ObjectSchema<CreateResumeLanguageRequest> = BasicResumeLanguageSchema.pick([
  "name",
  "level",
  "resumeId",
]);

export type PatchResumeLanguageRequest = Partial<Pick<BasicResumeLanguage,
  | "name"
  | "level"
  | "resumeId"
>>

export const PatchResumeLanguageRequestSchema: yup.ObjectSchema<PatchResumeLanguageRequest> = BasicResumeLanguageSchema.pick([
  "name",
  "level",
  "resumeId",
]).partial();
