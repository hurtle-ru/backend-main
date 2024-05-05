import { Currency, GuestVacancyResponseResume, Resume, ResumeImportExternalService } from "@prisma/client";
import * as yup from "yup";
import { yupOneOfEnum } from "../../infrastructure/validation/requests/enum.yup";
import { yupUint32 } from "../../infrastructure/validation/requests/int32.yup";
import { BasicGuestVacancyResponse } from "../vacancy/guest-response/guest-response.dto";
import { BasicGuestVacancyResponseResumeContact } from "./contact/contact.dto";

export type BasicGuestVacancyResponseResume = Pick<
  GuestVacancyResponseResume,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "importedFrom"
  | "importedId"
  | "title"
  | "firstName"
  | "lastName"
  | "middleName"
  | "isVisibleToEmployers"
  | "isReadyToRelocate"
  | "desiredSalary"
  | "desiredSalaryCurrency"
  | "responseId"
>;

export const BasicGuestVacancyResponseResumeSchema: yup.ObjectSchema<BasicGuestVacancyResponseResume> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  importedFrom: yupOneOfEnum(ResumeImportExternalService).defined().nullable(),
  importedId: yup.string().defined().nullable(),
  title: yup.string().defined().trim().min(0).max(255).nullable(),
  firstName: yup.string().defined().trim().min(2).max(50).nullable(),
  middleName: yup.string().defined().trim().min(1).max(50).nullable(),
  lastName: yup.string().defined().trim().min(2).max(50).nullable(),
  isVisibleToEmployers: yup.boolean().defined(),
  isReadyToRelocate: yup.boolean().defined().nullable(),
  desiredSalary: yupUint32().defined().nullable(),
  desiredSalaryCurrency: yupOneOfEnum(Currency).defined().nullable(),
  responseId: yup.string().defined(),
});

export type GetGuestVacancyResponseResumeResponse = BasicGuestVacancyResponseResume & {
  response: BasicGuestVacancyResponse,
  contacts: BasicGuestVacancyResponseResumeContact[],
}

export type PatchGuestVacancyResponseResumeRequest = Partial<
  Pick<
    BasicGuestVacancyResponseResume,
    | "title"
    | "firstName"
    | "middleName"
    | "lastName"
    | "isVisibleToEmployers"
    | "isReadyToRelocate"
    | "desiredSalary"
    | "desiredSalaryCurrency"
  >
>;

export const PatchGuestVacancyResponseResumeRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseResumeRequest> = BasicGuestVacancyResponseResumeSchema.pick([
  "title",
  "firstName",
  "middleName",
  "lastName",
  "isVisibleToEmployers",
  "isReadyToRelocate",
  "desiredSalary",
  "desiredSalaryCurrency",
]).partial();