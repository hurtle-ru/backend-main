import { Vacancy } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicApplicant } from "../applicant/applicant.dto";

export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "candidates"
  | "uniqueViewerApplicantIds"
>;

export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  candidates?: BasicApplicant[];
  viewersCount: number;
};

export type CreateVacancyRequest = Pick<
  Vacancy,
  | "name"
  | "teamRole"
  | "description"
  | "shortDescription"
  | "salary"
  | "salaryCurrency"
  | "experience"
  | "employmentType"
  | "city"
  | "reportingForm"
  | "workingHours"
  | "workplaceModel"
  | "keySkills"
>

export type PutVacancyRequest = CreateVacancyRequest;

export type setPriceRequest = Pick<
  Vacancy,
  | "price"
>
