import { Resume } from "@prisma/client";


export type BasicResume = Omit<
  Resume,
  | "applicant"
  | "certificates"
  | "contacts"
  | "education"
  | "experience"
  | "languages"
>;

export type CreateResumeRequest = Pick<
  Resume,
  | "title"
>;

export type PutResumeRequest = Pick<
  Resume,
  | "title"
  | "summary"
  | "city"
  | "skills"
  | "isVisibleToEmployers"
>;

// type GetResumeResponse = BasicResume & {
//
// }

export type GetReadyToImportResumesResponse = {
  resumes: {
    id: string;
    title?: string | null;
    createdAt: Date;
  }[]
}