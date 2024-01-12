import { ResumeExperience } from "@prisma/client";


export type BasicResumeExperience = Omit<
  ResumeExperience,
  | "resume"
>;

export type CreateResumeExperienceRequest = Pick<
  ResumeExperience,
  | "company"
  | "position"
  | "startDate"
  | "endDate"
  | "description"
  | "resumeId"
>;

export type PutResumeExperienceRequest = Pick<
  ResumeExperience,
  | "company"
  | "position"
  | "startDate"
  | "endDate"
  | "description"
>;