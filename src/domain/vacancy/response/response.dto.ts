import { VacancyResponse } from "@prisma/client";
import { BasicApplicant } from "../../applicant/applicant.dto";
import { BasicVacancy } from "../vacancy.dto";
import { BasicManager } from "../../manager/manager.dto";


export type BasicVacancyResponse = Omit<
  VacancyResponse,
  | "applicant"
  | "vacancy"
  | "suggestedBy"
>;

export type CreateVacancyResponseByManagerRequest = Pick<
  VacancyResponse,
  | "status"
  | "applicantId"
>;

export type GetVacancyResponseResponse = BasicVacancyResponse & {
  applicant: BasicApplicant,
  vacancy: BasicVacancy,
  suggestedBy?: BasicManager | null,
};

export type PatchVacancyResponseRequest = Partial<Pick<
  BasicVacancyResponse,
  | "status"
>>
