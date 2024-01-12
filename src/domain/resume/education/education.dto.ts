import { ResumeEducation } from "@prisma/client";


export type BasicResumeEducation = Omit<
  ResumeEducation,
  | "resume"
>;

export type CreateResumeEducationRequest = Pick<
  ResumeEducation,
  | "name"
  | "description"
  | "degree"
  | "startYear"
  | "endYear"
  | "resumeId"
>;

export type PutResumeEducationRequest = Pick<
  ResumeEducation,
  | "name"
  | "description"
  | "degree"
  | "startYear"
  | "endYear"
>;