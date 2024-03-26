import * as yup from "yup";

import { Resume, Currency } from "@prisma/client";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicResumeCertificate } from "./certificate/certificate.dto";
import { BasicResumeContact } from "./contact/contact.dto";
import { BasicResumeLanguage } from "./language/language.dto";
import { BasicResumeExperience } from "./experience/experience.dto";
import { BasicResumeEducation } from "./education/education.dto";

import { yupUint32 } from "../../infrastructure/validation/requests/int32.yup"
import { yupOneOfEnum } from "../../infrastructure/validation/requests/enum.yup";


export type BasicResume = Omit<
  Resume,
  | "applicant"
  | "certificates"
  | "contacts"
  | "education"
  | "experience"
  | "languages"
>;

const BasicResumeSchema = yup.object({
  title: yup.string().trim().min(3).max(50),
  summary: yup.string().trim().min(30).max(3000).optional(),
  city: yup.string().trim().min(3).max(255).optional(),
  skills: yup.array().of(yup.string().trim().min(3).max(50)).max(30),
  isVisibleToEmployers: yup.boolean(),
  desiredSalary: yupUint32().optional(),
  desiredSalaryCurrency: yupOneOfEnum(Currency).optional(),
})

export class CreateResumeRequest {
  static schema = BasicResumeSchema.pick( [ "title" ] )

  constructor(
    public title: string,
  ) {}
}

export class PutResumeRequest {
  static schema = BasicResumeSchema.pick([
    "title",
    "summary",
    "city",
    "skills",
    "isVisibleToEmployers",
    "desiredSalary",
    "desiredSalaryCurrency",
  ])

  constructor(
    public title: string,
    public summary: string,
    public city: string,
    public skills: string[],
    public isVisibleToEmployers: boolean,
    public desiredSalary: number,
    public desiredSalaryCurrency: keyof typeof Currency,
  ) {}
}

export type PutResumeResponse = Pick<
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
