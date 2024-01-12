import { ResumeLanguage } from "@prisma/client";


export type BasicResumeLanguage = Omit<
  ResumeLanguage,
  | "resume"
>;

export type CreateResumeLanguageRequest = Pick<
  ResumeLanguage,
  | "name"
  | "level"
  | "resumeId"
>;

export type PutResumeLanguageRequest = Pick<
  ResumeLanguage,
  | "name"
  | "level"
>;