import { ResumeExperience } from "@prisma/client";


export type BasicResumeExperience = Omit<
  ResumeExperience,
  | "resume"
>;

export type CreateResumeExperienceRequest = Pick<
  ResumeExperience,
  | "company"
  | "position"
  | "startMonth"
  | "startYear"
  | "endMonth"
  | "endYear"
  | "description"
  | "resumeId"
>;

export type PutResumeExperienceRequest = Pick<
  ResumeExperience,
  | "company"
  | "position"
  | "startMonth"
  | "startYear"
  | "endMonth"
  | "endYear"
  | "description"
>;