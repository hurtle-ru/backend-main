import * as yup from "yup";
import { ResumeCertificate } from "@prisma/client";


export type BasicResumeCertificate = Omit<
  ResumeCertificate,
  | "resume"
>;

const BasicResumeCertificateSchema = yup.object({
  name: yup.string().trim().min(3).max(100),
  description: yup.string().trim().min(3).max(255).optional(),
  year: yup.number().min(1970).max(new Date().getFullYear()).optional(),
  resumeId: yup.string().length(36),
})


export class CreateResumeCertificateRequest {
  static schema = BasicResumeCertificateSchema.pick([
    "name",
    "description",
    "year",
    "resumeId",
  ])

  constructor (
    public name: string,
    public description: string,
    public year: number,
    public resumeId: string,
  ) {}
}

export class PutResumeCertificateRequest {
  static schema = BasicResumeCertificateSchema.pick([
    "name",
    "description",
    "year",
  ])

  constructor (
    public name: string,
    public description: string,
    public year: number,
  ) {}
}
