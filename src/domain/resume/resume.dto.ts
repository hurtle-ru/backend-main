import * as yup from "yup";
import { Resume, Currency, ResumeImportExternalService } from "@prisma/client";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicResumeCertificate } from "./certificate/certificate.dto";
import { BasicResumeContact } from "./contact/contact.dto";
import { BasicResumeLanguage } from "./language/language.dto";
import { BasicResumeExperience } from "./experience/experience.dto";
import { BasicResumeEducation } from "./education/education.dto";
import { yupUint32 } from "../../infrastructure/validation/requests/int32.yup";
import { yupOneOfEnum } from "../../infrastructure/validation/requests/enum.yup";
import { APPLICANT, APPLICANT_SCHEMA, MANAGER, MANAGER_SCHEMA } from "../../infrastructure/controller/requester/requester.dto";


export type BasicResume = Pick<
  Resume,
  | "id"
  | "createdAt"
  | "importedFrom"
  | "importedId"
  | "title"
  | "summary"
  | "city"
  | "skills"
  | "isVisibleToEmployers"
  | "desiredSalary"
  | "desiredSalaryCurrency"
  | "applicantId"
>;

export const BasicResumeSchema: yup.ObjectSchema<BasicResume> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  importedFrom: yupOneOfEnum(ResumeImportExternalService).defined().nullable(),
  importedId: yup.string().defined().nullable(),
  title: yup.string().defined().trim().min(0).max(255).nullable(),
  summary: yup.string().defined().trim().min(0).max(3000).nullable(),
  city: yup.string().defined().trim().min(0).max(255).nullable(),
  skills: yup.array().of(yup.string().defined().trim().min(0).max(50)).defined().max(70),
  isVisibleToEmployers: yup.boolean().defined(),
  desiredSalary: yupUint32().defined().nullable(),
  desiredSalaryCurrency: yupOneOfEnum(Currency).defined().nullable(),
  applicantId: yup.string().defined().length(36),
});

export type GetResumeResponse = BasicResume & {
  applicant?: BasicApplicant;
  certificates?: BasicResumeCertificate[];
  contacts?: BasicResumeContact[];
  education?: BasicResumeEducation[];
  experience?: BasicResumeExperience[];
  languages?: BasicResumeLanguage[];
}

export type CreateResumeByApplicantRequest = Pick<
  Resume,
  | "title"
> & { role: APPLICANT };

export const CreateResumeByApplicantRequestSchema: yup.ObjectSchema<CreateResumeByApplicantRequest> = BasicResumeSchema.pick([
  "title",
]).shape({ role: APPLICANT_SCHEMA });

export type CreateResumeByManagerRequest = Pick<
  Resume,
  | "title"
  | "applicantId"
> & { role: MANAGER };

export const CreateResumeByManagerRequestSchema: yup.ObjectSchema<CreateResumeByManagerRequest> = BasicResumeSchema.pick([
  "title",
  "applicantId",
]).shape({ role: MANAGER_SCHEMA });

export type PatchByIdResumeRequest = Partial<Pick<
  Resume,
  | "title"
  | "summary"
  | "city"
  | "skills"
  | "isVisibleToEmployers"
  | "desiredSalary"
  | "desiredSalaryCurrency"
>>

export const PatchByIdResumeRequestSchema: yup.ObjectSchema<PatchByIdResumeRequest> = BasicResumeSchema.pick([
  "title",
  "summary",
  "city",
  "skills",
  "isVisibleToEmployers",
  "desiredSalary",
  "desiredSalaryCurrency",
]).partial();

export type PatchResumeResponse = Pick<
  Resume,
  | "title"
  | "summary"
  | "city"
  | "skills"
  | "isVisibleToEmployers"
  | "desiredSalary"
  | "desiredSalaryCurrency"
>;