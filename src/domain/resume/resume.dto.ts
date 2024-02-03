import { Resume } from "@prisma/client";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicResumeCertificate } from "./certificate/certificate.dto";
import { BasicResumeContact } from "./contact/contact.dto";
import { BasicResumeLanguage } from "./language/language.dto";
import { BasicResumeExperience } from "./experience/experience.dto";
import { BasicResumeEducation } from "./education/education.dto";


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
  | "desiredSalary"
  | "desiredSalaryCurrency"
>;

export type GetResumeResponse = BasicResume & {
  applicant?: BasicApplicant;
  certificates?: BasicResumeCertificate[];
  contacts?: BasicResumeContact[];
  education?: BasicResumeEducation[];
  experience?: BasicResumeExperience[];
  languages?: BasicResumeLanguage[];
}
