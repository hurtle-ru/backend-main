import * as yup from 'yup'
import { BasicResumeSchema } from '../../resume/resume.dto';
import { BasicResumeContactSchema } from '../../resume/contact/contact.dto';
import { BasicResumeEducationSchema } from '../../resume/education/education.dto';
import { BasicResumeLanguageSchema } from '../../resume/language/language.dto';
import { BasicResumeExperienceSchema } from '../../resume/experience/experience.dto';
import { BasicResumeCertificateSchema } from '../../resume/certificate/certificate.dto';
import {
  Resume,
  ResumeCertificate,
  ResumeContact,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
} from "@prisma/client";


export type GetHhResumeSummaryResponse = {
  id: string;
  title?: string | null;
  createdAt: Date;
}

export type HhMappedResume = Omit<Resume & {
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
  | "importedFrom"
  | "importedId"
>;

export const ImportedFromHhResumeSchema: yup.ObjectSchema<HhMappedResume> = BasicResumeSchema.pick([
  "createdAt",
  "title",
  "city",
  "skills",
  "summary",
  "desiredSalaryCurrency",
  "desiredSalary",
  "isVisibleToEmployers",
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
  }
)
