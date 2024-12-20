import * as yup from "yup";
import { ResumeCertificate } from "@prisma/client";
import { yupUint32 } from "../../../infrastructure/validation/requests/int32.yup";


export type BasicResumeCertificate = Omit<
  ResumeCertificate,
  | "resume"
>;

export const BasicResumeCertificateSchema: yup.ObjectSchema<BasicResumeCertificate> = yup.object({
  id: yup.string().defined().length(36),
  name: yup.string().defined().trim().min(0).max(255),
  description: yup.string().defined().trim().min(0).max(255).nullable(),
  year: yupUint32().max(9999).defined().nullable(),
  resumeId: yup.string().defined().length(36),
});

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
]);

export type PatchResumeCertificateRequest = Partial<Pick<BasicResumeCertificate,
  | "name"
  | "description"
  | "year"
>>

export const PatchResumeCertificateRequestSchema: yup.ObjectSchema<PatchResumeCertificateRequest> = BasicResumeCertificateSchema.pick([
  "name",
  "description",
  "year",
]).partial();
