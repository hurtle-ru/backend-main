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
>;

export type RequesterEmployer = { "_requester": "Employer" }
export type RequesterManager = { "_requester": "Manager" }

export type PutVacancyRequestFromEmployer = CreateVacancyRequest & RequesterEmployer
export type PutVacancyRequestFromManager = CreateVacancyRequest & Pick<Vacancy, "price"> & RequesterManager

export type PatchVacancyRequestFromEmployer = Partial<PutVacancyRequestFromEmployer> & RequesterEmployer
export type PatchVacancyRequestFromManager = Partial<PutVacancyRequestFromManager> & RequesterManager