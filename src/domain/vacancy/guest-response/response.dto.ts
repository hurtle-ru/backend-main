import * as yup from "yup"

import { GuestVacancyResponse, Resume, VacancyResponseStatus } from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";
import { BasicResumeSchema } from "../../resume/resume.dto";
import { BasicResumeCertificate, BasicResumeCertificateSchema } from "../../resume/certificate/certificate.dto";
import { BasicResumeContact, BasicResumeContactSchema } from "../../resume/contact/contact.dto";
import { BasicResumeEducation, BasicResumeEducationSchema } from "../../resume/education/education.dto";
import { BasicResumeExperience, BasicResumeExperienceSchema } from "../../resume/experience/experience.dto";
import { BasicResumeLanguage, BasicResumeLanguageSchema } from "../../resume/language/language.dto";


export type BasicGuestVacancyResponse = Omit<
  GuestVacancyResponse,
  | "vacancy"
>;

export type CreateGuestVacancyResponseRequestResume = Pick<Resume,
  | "title"
  | "summary"
  | "city"
  | "skills"
  | "desiredSalary"
  | "desiredSalaryCurrency"
> & {
  certificates: Pick<
    BasicResumeCertificate,
    | "name"
    | "description"
    | "year"
    >[];
  contacts: Pick<
    BasicResumeContact,
    | "name"
    | "type"
    | "value"
    | "preferred"
  >[];
  education: Pick<
    BasicResumeEducation,
    | "name"
    | "description"
    | "degree"
    | "startYear"
    | "endYear"
  >[];
  experience: Pick<BasicResumeExperience,
    | "description"
    | "company"
    | "position"
    | "startYear"
    | "startMonth"
    | "endYear"
    | "endMonth"
  >[];
  languages: Pick<BasicResumeLanguage,
    | "name"
    | "level"
  >[];
}

const CreateGuestVacancyResponseRequestResumeSchema: yup.ObjectSchema<CreateGuestVacancyResponseRequestResume> = BasicResumeSchema.pick([
  "title",
  "summary",
  "city",
  "skills",
  "desiredSalary",
  "desiredSalaryCurrency",
]).shape({
  certificates: yup.array().of(BasicResumeCertificateSchema.pick([
    "name",
    "description",
    "year",
  ])).defined(),
  contacts: yup.array().of(BasicResumeContactSchema.pick([
    "name",
    "type",
    "value",
    "preferred",
  ])).defined(),
  education: yup.array().of(BasicResumeEducationSchema.pick([
    "name",
    "description",
    "degree",
    "startYear",
    "endYear",
  ])).defined(),
  experience: yup.array().of(BasicResumeExperienceSchema.pick([
    "description",
    "company",
    "position",
    "startYear",
    "startMonth",
    "endYear",
    "endMonth",
  ])).defined(),
  languages: yup.array().of(BasicResumeLanguageSchema.pick([
    "name",
    "level",
  ])).defined(),
})

const BasicGuestVacancyResponseSchema: yup.ObjectSchema<BasicGuestVacancyResponse> = yup.object({
  id: yup.string().max(36).defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  text: yup.string().defined().trim().max(3000).nullable(),
  status: yupOneOfEnum(VacancyResponseStatus).defined(),
  isViewedByEmployer: yup.boolean().defined(),
  resume: CreateGuestVacancyResponseRequestResumeSchema,
  vacancyId: yup.string().defined().max(36),
})

export type CreateGuestVacancyResponseRequest = Pick<
  BasicGuestVacancyResponse,
  | "vacancyId"
  | "text"
> & { resume: CreateGuestVacancyResponseRequestResume }

export const CreateGuestVacancyResponseRequestSchema: yup.ObjectSchema<CreateGuestVacancyResponseRequest> = BasicGuestVacancyResponseSchema.pick(
  ["vacancyId", "text"]
).shape({ resume: CreateGuestVacancyResponseRequestResumeSchema })

export type GetGuestVacancyResponseResponse = BasicGuestVacancyResponse & {
  vacancy?: BasicVacancy,
};
