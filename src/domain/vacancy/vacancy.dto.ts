import { Vacancy } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicApplicant } from "../applicant/applicant.dto";

export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "candidates"
>;

export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  candidates?: BasicApplicant[];
};

export type CreateVacancyRequest = Pick<
  Vacancy,
  | "name"
  | "teamRole"
  | "description"
  | "salary"
  | "salaryCurrency"
  | "experience"
  | "employmentType"
  | "price"
  | "city"
  | "reportingForm"
  | "workingHours"
  | "workplaceModel"
  | "keySkills"
>

export type PutVacancyRequest = CreateVacancyRequest;