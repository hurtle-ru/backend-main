import * as yup from "yup";

import { GuestVacancyResponse, Resume, VacancyResponseModerationStatus, VacancyResponseStatus } from "@prisma/client";
import { BasicVacancy, CreateVacancyRequest, CreateVacancyRequestSchema } from "../vacancy.dto";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";
import { BasicResumeSchema } from "../../resume/resume.dto";
import { BasicResumeCertificate, BasicResumeCertificateSchema } from "../../resume/certificate/certificate.dto";
import {
  BasicResumeContact,
  BasicResumeContactSchema,
  PatchResumeContactRequest, PatchResumeContactRequestSchema,
} from "../../resume/contact/contact.dto";
import { BasicResumeEducation, BasicResumeEducationSchema } from "../../resume/education/education.dto";
import { BasicResumeExperience, BasicResumeExperienceSchema } from "../../resume/experience/experience.dto";
import { BasicResumeLanguage, BasicResumeLanguageSchema } from "../../resume/language/language.dto";
import { FullRequired } from "../../../util/typescript.utils";


export type BasicGuestVacancyResponse = Omit<
  GuestVacancyResponse,
  | "vacancy"
>;

export type CreateGuestVacancyResponseRequestResume = Pick<
  Resume,
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
};

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
});

const BasicGuestVacancyResponseSchema: yup.ObjectSchema<BasicGuestVacancyResponse> = yup.object({
  id: yup.string().max(36).defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  text: yup.string().defined().trim().max(3000).nullable(),
  status: yupOneOfEnum(VacancyResponseStatus).defined(),
  moderationStatus: yupOneOfEnum(VacancyResponseModerationStatus).defined(),
  isViewedByEmployer: yup.boolean().defined(),
  resume: CreateGuestVacancyResponseRequestResumeSchema.nullable(),
  vacancyId: yup.string().defined().max(36),
  firstName: yup.string().defined().nullable(),
  lastName: yup.string().defined().nullable(),
  middleName: yup.string().defined().nullable(),
  isReadyToRelocate: yup.boolean().defined().nullable(),
});

export type CreateGuestVacancyResponseRequest = Pick<
  BasicGuestVacancyResponse,
  | "vacancyId"
  | "text"
  | "firstName"
  | "lastName"
  | "middleName"
  | "isReadyToRelocate"
> & {
  resume: CreateGuestVacancyResponseRequestResume,
}

export const CreateGuestVacancyResponseRequestSchema: yup.ObjectSchema<CreateGuestVacancyResponseRequest> = BasicGuestVacancyResponseSchema.pick([
  "vacancyId",
  "text",
  "firstName",
  "lastName",
  "middleName",
  "isReadyToRelocate",
]).shape({
  resume: CreateGuestVacancyResponseRequestResumeSchema,
});

export type GetGuestVacancyResponseResponse = BasicGuestVacancyResponse & {
  vacancy?: BasicVacancy,
};

export type PatchGuestVacancyResponseRequest = Partial<Pick<
  BasicGuestVacancyResponse,
  | "status"
  | "isViewedByEmployer"
>>;

export const PatchGuestVacancyResponseRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseRequest> = BasicGuestVacancyResponseSchema.pick([
  "status",
  "isViewedByEmployer",
]).partial();

export type CreateQueuedWithOcrGuestVacancyResponseResponse = {
  jobId: string
}

export type PatchGuestVacancyResponseQueuedWithOcrRequest = {
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

export const PatchGuestVacancyResponseQueuedWithOcrRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseQueuedWithOcrRequest> = yup.object({
  overwriteResumeFields: yup.object({
    contacts: yup.array().of(BasicResumeContactSchema.pick([
      "type",
      "name",
      "preferred",
      "value",
    ])),
  }).partial(),
});

export type MetadataCreateGuestVacancyResponse = {
  callback: "create-guest-vacancy-response"
  vacancyId: string,
  guestResponseId: string | null,
  errorDuringCreation: boolean | null,
} & PatchGuestVacancyResponseQueuedWithOcrRequest;