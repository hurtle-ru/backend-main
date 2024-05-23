import * as yup from "yup";

import {
  BasicResumeContactSchema,
  PatchResumeContactRequest,
} from "../resume/contact/contact.dto";
import { FullRequired } from "../../util/typescript.utils";
import { Resume, ResumeCertificate, ResumeContact, ResumeEducation, ResumeExperience, ResumeLanguage } from "@prisma/client";
import { BasicResumeLanguageSchema } from "../resume/language/language.dto";
import { BasicResumeExperienceSchema } from "../resume/experience/experience.dto";
import { BasicResumeEducationSchema } from "../resume/education/education.dto";
import { BasicResumeCertificateSchema } from "../resume/certificate/certificate.dto";
import { BasicResumeSchema } from "../resume/resume.dto";


export type CreateQueuedImportWithOcrResponse = {
  jobId: string
}

export type PatchImportResumeWithOcrQueuedRequest = {
  overwriteResumeFields?: {
    contacts?: FullRequired<
      Pick<
        PatchResumeContactRequest,
        | "type"
        | "name"
        | "preferred"
        | "value"
      >
    >[],
  }
};

export const PatchImportResumeWithOcrQueuedRequestSchema: yup.ObjectSchema<PatchImportResumeWithOcrQueuedRequest> = yup.object({
  overwriteResumeFields: yup.object({
    contacts: yup.array().of(BasicResumeContactSchema.pick([
      "type",
      "name",
      "preferred",
      "value",
    ])),
  }).partial(),
});


export const MetadataImportResumeWithOcrCallbackName = "import-with-ocr-applicant-resume";
type MetadataImportResumeWithOcrCallbackNameType = "import-with-ocr-applicant-resume"

export type MetadataImportResumeWithOcr = {
  callback: MetadataImportResumeWithOcrCallbackNameType
  applicantId: string,
  errorDuringImport: boolean | null,
} & PatchImportResumeWithOcrQueuedRequest;

export type OcrMappedResume = Omit<Resume & {
  contacts: Omit<
    ResumeContact,
    | "resumeId"
    | "id"
  >[];
  languages: Omit<
    ResumeLanguage,
    | "resumeId"
    | "id"
  >[];
  experience: Omit<
    ResumeExperience,
    | "resumeId"
    | "id"
  >[];
  education: Omit<
    ResumeEducation,
    | "resumeId"
    | "id"
    | "startYear"
  >[];
  certificates: Omit<
    ResumeCertificate,
    | "resumeId"
    | "id"
  >[];
},
  | "id"
  | "applicantId"
  | "isVisibleToEmployers"
>;

export const OcrMappedResumeSchema: yup.ObjectSchema<OcrMappedResume> = BasicResumeSchema.pick([
  "importedFrom",
  "importedId",
  "createdAt",
  "title",
  "city",
  "skills",
  "summary",
  "desiredSalaryCurrency",
  "desiredSalary",
]).shape(
  {
    contacts: yup.array().of(BasicResumeContactSchema.pick([
      "name",
      "type",
      "value",
      "preferred",
    ])).defined(),
    languages: yup.array().of(BasicResumeLanguageSchema.pick([
      "name",
      "level",
    ])).defined(),
    experience: yup.array().of(BasicResumeExperienceSchema.pick([
      "position",
      "company",
      "description",
      "startMonth",
      "startYear",
      "endMonth",
      "endYear",
    ])).defined(),
    education: yup.array().of(BasicResumeEducationSchema.pick([
      "name",
      "endYear",
      "description",
      "degree",
    ])).defined(),
    certificates: yup.array().of(BasicResumeCertificateSchema.pick([
      "name",
      "description",
      "year",
    ])).defined(),
  },
);
