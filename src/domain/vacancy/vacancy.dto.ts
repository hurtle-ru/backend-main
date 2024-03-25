import * as yup from "yup";
import { Vacancy } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicVacancyResponse } from "./response/response.dto"
import { RequesterEmployer, RequesterManager } from "../../infrastructure/controller/requester/requester.dto";


export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "vacancyResponses"
  | "uniqueViewerApplicantIds"
  | "uniqueViewerIps"
>;

export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  vacancyResponses?: BasicVacancyResponse[];
  viewersCount: number;
};

export type GetAllVacancyCitiesResponse = { cities: string[], total: number };

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
  | "isHidden"
>;

export type PutVacancyRequestFromEmployer = CreateVacancyRequest & RequesterEmployer
export type PutVacancyRequestFromManager = CreateVacancyRequest & RequesterManager & Pick<
  Vacancy,
  | "price"
  | "status"
>

export type PatchVacancyRequestFromEmployer = Partial<PutVacancyRequestFromEmployer> & RequesterEmployer
export type PatchVacancyRequestFromManager = Partial<PutVacancyRequestFromManager> & RequesterManager