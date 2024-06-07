import * as yup from "yup";

import { VacancyResponse, VacancyResponseStatus } from "@prisma/client";
import { BasicApplicant } from "../../applicant/applicant.dto";
import { BasicVacancy } from "../vacancy.dto";
import { BasicManager } from "../../manager/manager.dto";
import {
  APPLICANT,
  MANAGER,
  RequesterApplicantSchema,
  RequesterManagerSchema,
} from "../../../infrastructure/controller/requester/requester.dto";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";


export type BasicVacancyResponse = Omit<
  VacancyResponse,
  | "applicant"
  | "vacancy"
  | "suggestedBy"
  >;

const BasicVacancyResponseSchema: yup.ObjectSchema<BasicVacancyResponse> = yup.object({
  id: yup.string().length(36).defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  candidateRecommendedByManagerId: yup.string().length(36).defined(),
  status: yupOneOfEnum(VacancyResponseStatus).defined(),
  isViewedByEmployer: yup.boolean().defined(),
  candidateId: yup.string().defined().length(36),
  vacancyId: yup.string().defined().length(36),
});

export type CreateVacancyResponseRequestFromApplicant = Pick<BasicVacancyResponse,
  | "vacancyId"
  > & {_requester: APPLICANT}

export const CreateVacancyResponseRequestFromApplicantSchema: yup.ObjectSchema<CreateVacancyResponseRequestFromApplicant> = BasicVacancyResponseSchema.pick(
  ["vacancyId"],
).concat(RequesterApplicantSchema);

export type CreateVacancyResponseRequestFromManager = Pick<BasicVacancyResponse,
  | "vacancyId"
  | "candidateId"
> & {_requester: MANAGER}

export const CreateVacancyResponseRequestFromManagerSchema: yup.ObjectSchema<CreateVacancyResponseRequestFromManager> = BasicVacancyResponseSchema.pick(
  ["vacancyId", "candidateId"],
).concat(RequesterManagerSchema);

export type PatchVacancyResponseRequest = Partial<Pick<BasicVacancyResponse,
  | "status"
  | "isViewedByEmployer"
>>

export const PatchVacancyResponseRequestSchema: yup.ObjectSchema<PatchVacancyResponseRequest> = BasicVacancyResponseSchema.pick(
  ["status", "isViewedByEmployer"],
).partial();

export type GetVacancyResponseResponse = BasicVacancyResponse & {
  candidate?: BasicApplicant,
  vacancy?: BasicVacancy,
  candidateRecommendedBy?: BasicManager | null,
};

export type GetVacancyResponsesCountResponse = {
  id: string,
  _count: {
    responses: number,
  }
}[]
