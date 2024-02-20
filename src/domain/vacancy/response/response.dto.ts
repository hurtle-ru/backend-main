import { VacancyResponse } from "@prisma/client";
import { BasicApplicant } from "../../applicant/applicant.dto";
import { BasicVacancy } from "../vacancy.dto";
import { BasicManager } from "../../manager/manager.dto";
import { RequesterApplicant, RequesterManager } from "../../../infrastructure/controller/requester/requester.dto";


export type BasicVacancyResponse = Omit<
  VacancyResponse,
  | "applicant"
  | "vacancy"
  | "suggestedBy"
>;

export type GetVacancyResponseResponse = BasicVacancyResponse & {
  candidate: BasicApplicant,
  vacancy: BasicVacancy,
  candidateRecommendedBy?: BasicManager | null,
};

export type PutVacancyResponseRequest = Pick<
  BasicVacancyResponse,
  | "status"
  | "isViewedByEmployer"
>;

export type CreateVacancyResponseRequestFromApplicant = RequesterApplicant & Pick<VacancyResponse,
  | "vacancyId"
>;

export type CreateVacancyResponseRequestFromManager = RequesterManager & Pick<VacancyResponse,
  | "vacancyId"
  | "candidateId"
>;