import { ResumeCertificate } from "@prisma/client";


export type BasicResumeCertificate = Omit<
  ResumeCertificate,
  | "resume"
>;

export type CreateResumeCertificateRequest = Pick<
  ResumeCertificate,
  | "name"
  | "description"
  | "year"
  | "resumeId"
>;

export type PutResumeCertificateRequest = Pick<
  ResumeCertificate,
  | "name"
  | "description"
  | "year"
>;