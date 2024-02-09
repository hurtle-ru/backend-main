import { Vacancy } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicVacancyResponse } from "./response/response.dto"
import { RequesterEmployer, RequesterManager } from "../../infrastructure/controller/requester/requester.dto";

export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "vacancyResponses"
  | "uniqueViewerApplicantIds"
>;

export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  vacancyResponses?: BasicVacancyResponse[];
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
>;

export type PutVacancyRequestFromEmployer = CreateVacancyRequest & RequesterEmployer
export type PutVacancyRequestFromManager = CreateVacancyRequest & Pick<Vacancy, "price"> & RequesterManager

export type PatchVacancyRequestFromEmployer = Partial<PutVacancyRequestFromEmployer> & RequesterEmployer
export type PatchVacancyRequestFromManager = Partial<PutVacancyRequestFromManager> & RequesterManager