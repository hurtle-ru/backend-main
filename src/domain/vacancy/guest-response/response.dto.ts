import * as yup from "yup"

import { GuestVacancyResponse, Resume, VacancyResponseStatus } from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";
import { BasicResumeSchema } from "../../resume/resume.dto";


export type BasicGuestVacancyResponse = Omit<
  GuestVacancyResponse,
  | "vacancy"
>;

export type CreateGuestVacancyResponseRequestResume = Pick<Resume,
  | "title"
  | "summary"
  | "city"
  | "skills"
  | "desiredSalary"
  | "desiredSalaryCurrency"
>

const CreateGuestVacancyResponseRequestResumeSchema: yup.ObjectSchema<CreateGuestVacancyResponseRequestResume> = BasicResumeSchema.pick([
  "title",
  "summary",
  "city",
  "skills",
  "desiredSalary",
  "desiredSalaryCurrency",
])

const BasicGuestVacancyResponseSchema: yup.ObjectSchema<BasicGuestVacancyResponse> = yup.object({
  id: yup.string().max(36).defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  text: yup.string().trim().defined().max(3000),
  status: yupOneOfEnum(VacancyResponseStatus).defined(),
  isViewedByEmployer: yup.boolean().defined(),
  resume: CreateGuestVacancyResponseRequestResumeSchema,
  vacancyId: yup.string().defined().max(36),
})

export type CreateGuestVacancyResponseRequest = Pick<BasicGuestVacancyResponse,
  | "vacancyId"
  | "text"
> & {resume: CreateGuestVacancyResponseRequestResume}

export const CreateGuestVacancyResponseRequestSchema: yup.ObjectSchema<CreateGuestVacancyResponseRequest> = BasicGuestVacancyResponseSchema.pick(
  ["vacancyId", "text"]
).shape({ resume: CreateGuestVacancyResponseRequestResumeSchema })

export type GetGuestVacancyResponseResponse = BasicGuestVacancyResponse & {
  vacancy?: BasicVacancy,
};
