import { ResumeContact } from "@prisma/client";


export type BasicResumeContact = Omit<
  ResumeContact,
  | "resume"
>;

export type CreateResumeContactRequest = Pick<
  ResumeContact,
  | "name"
  | "type"
  | "value"
  | "preferred"
  | "resumeId"
>;

export type PutResumeContactRequest = Pick<
  ResumeContact,
  | "name"
  | "type"
  | "value"
  | "preferred"
>;