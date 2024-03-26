import * as yup from "yup"

import { VacancyResponse, VacancyResponseStatus } from "@prisma/client";
import { BasicApplicant } from "../../applicant/applicant.dto";
import { BasicVacancy } from "../vacancy.dto";
import { BasicManager } from "../../manager/manager.dto";
import { APPLICANT, MANAGER, RequesterApplicant, RequesterManager } from "../../../infrastructure/controller/requester/requester.dto";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";


export type BasicVacancyResponse = Omit<
  VacancyResponse,
  | "applicant"
  | "vacancy"
  | "suggestedBy"
  >;

const BasicVacancyResponseSchema = yup.object({
  status: yupOneOfEnum(VacancyResponseStatus),
  isViewedByEmployer: yup.boolean(),
  candidateId: yup.string().length(36),
  vacancyId: yup.string().length(36),
})

export type GetVacancyResponseResponse = BasicVacancyResponse & {
  candidate?: BasicApplicant,
  vacancy?: BasicVacancy,
  candidateRecommendedBy?: BasicManager | null,
};

export class CreateVacancyResponseRequestFromApplicant {
  static schema = BasicVacancyResponseSchema.pick([
    "vacancyId",
  ]).concat(
    yup.object({
      _requester: yup.string(),
    })
  )

  constructor(
    public vacancyId: string,
    public _requester: APPLICANT
  ) {}
}

export class CreateVacancyResponseRequestFromManager {
  static schema = BasicVacancyResponseSchema.pick([
    "vacancyId",
    "candidateId",
  ]).concat(
    yup.object({
      _requester: yup.string(),
    })
  )

  constructor(
    public vacancyId: string,
    public candidateId: string,
    public _requester: MANAGER
  ) {}
}

export class PutVacancyResponseRequest {
  static schema = BasicVacancyResponseSchema.pick([
    "status",
    "isViewedByEmployer",
  ])

  constructor(
    public status: keyof typeof VacancyResponseStatus,
    public isViewedByEmployer: boolean,
  ) {}
}
