import * as yup from "yup"
import { ResumeLanguage } from "@prisma/client";


export type BasicResumeLanguage = Omit<
  ResumeLanguage,
  | "resume"
>;


const BasicResumeLanguageSchema = yup.object({
  name: yup.string().trim().min(3).max(20).optional(),
  level: yup.string().trim().min(3).max(20).optional(),
  resumeId: yup.string().length(36),
})

export class CreateResumeLanguageRequest {
  static schema = BasicResumeLanguageSchema.pick([
    "name",
    "level",
    "resumeId",
  ])

  constructor(
    public name: string,
    public level: string,
    public resumeId: string,
  ) {}
}

export class PutResumeLanguageRequest {
  static schema = BasicResumeLanguageSchema.pick([
    "name",
    "level",
  ])

  constructor(
    public name: string,
    public level: string,
  ) {}
}
