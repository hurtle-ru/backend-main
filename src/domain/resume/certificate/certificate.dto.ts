import * as yup from "yup";
import { ResumeCertificate } from "@prisma/client";


export type BasicResumeCertificate = Omit<
  ResumeCertificate,
  | "resume"
>;

const BasicResumeCertificateSchema: yup.ObjectSchema<BasicResumeCertificate> = yup.object({
  id: yup.string().defined().length(36),
  name: yup.string().defined().trim().min(0).max(100),
  description: yup.string().defined().trim().min(0).max(255).nullable(),
  year: yup.number().defined().min(1930).max(new Date().getFullYear()).nullable(),
  resumeId: yup.string().defined().length(36),
})

export type CreateResumeCertificateRequest = Pick<BasicResumeCertificate,
  | "name"
  | "description"
  | "year"
  | "resumeId"
>

export const CreateResumeCertificateRequestSchema: yup.ObjectSchema<CreateResumeCertificateRequest> = BasicResumeCertificateSchema.pick([
  "name",
  "description",
  "year",
  "resumeId",
])

export type PatchResumeCertificateRequest = Partial<Pick<BasicResumeCertificate,
  | "name"
  | "description"
  | "year"
>>

export const PatchResumeCertificateRequestSchema: yup.ObjectSchema<PatchResumeCertificateRequest> = BasicResumeCertificateSchema.pick([
  "name",
  "description",
  "year",
]).partial()
