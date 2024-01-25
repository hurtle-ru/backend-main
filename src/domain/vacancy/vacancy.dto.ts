import { Vacancy } from "@prisma/client";
import { BasicEmployer } from "../employer/employer.dto";
import { BasicApplicant } from "../applicant/applicant.dto";
import { BasicCandidate } from "./candidate/candidate.dto"

export type BasicVacancy = Omit<
  Vacancy,
  | "employer"
  | "candidates"
  | "uniqueViewerApplicantIds"
>;

export type GetVacancyResponse = BasicVacancy & {
  employer?: BasicEmployer;
  candidates?: BasicCandidate[];
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

export class PutVacancyRequestFromEmployer {
  constructor(vacancyData: CreateVacancyRequest) { Object.assign(this, vacancyData); }
}

export class PutVacancyRequestFromManager {
  constructor(vacancyData: PutVacancyRequestFromEmployer & Pick<
    Vacancy,
    "price"
  >) { Object.assign(this, vacancyData); }
}