import * as yup from "yup"

import { GuestVacancyResponse, VacancyResponseStatus } from "@prisma/client";
import { BasicApplicant } from "../../applicant/applicant.dto";
import { BasicVacancy } from "../vacancy.dto";
import { BasicManager } from "../../manager/manager.dto";
import { APPLICANT, MANAGER, RequesterApplicantSchema, RequesterManager, RequesterManagerSchema } from "../../../infrastructure/controller/requester/requester.dto";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";


export type BasicGuestVacancyResponse = Omit<
  GuestVacancyResponse,
  | "vacancy"
  >;

const BasicGuestVacancyResponseSchema: yup.ObjectSchema<BasicGuestVacancyResponse> = yup.object({
  id: yup.string().max(36).defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  text: yup.string().trim().defined().max(3000),
  status: yupOneOfEnum(VacancyResponseStatus).defined(),
  isViewedByEmployer: yup.boolean().defined(),
  resume: yup.object().json().defined(),
  vacancyId: yup.string().defined().max(36),
})

export type CreateGuestVacancyResponseRequest = Pick<BasicGuestVacancyResponse,
  | "vacancyId"
  | "text"
  | "resume"
>


export const CreateGuestVacancyResponseRequestSchema: yup.ObjectSchema<CreateGuestVacancyResponseRequest> = BasicGuestVacancyResponseSchema.pick(
  ["vacancyId", "text", "resume"]
)

export type GetGuestVacancyResponseResponse = BasicGuestVacancyResponse & {
  vacancy?: BasicVacancy,
};
