import * as yup from "yup";

import {
  GuestVacancyResponse,
  VacancyResponseModerationStatus,
  VacancyResponseStatus,
} from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";
import {
  BasicResumeContactSchema,
  PatchResumeContactRequest,
} from "../../resume/contact/contact.dto";
import { FullRequired } from "../../../util/typescript.utils";
import {
  RequesterEmployer, RequesterEmployerSchema, RequesterManager, RequesterManagerSchema,
  RequesterPublic, RequesterPublicSchema,
} from "../../../infrastructure/controller/requester/requester.dto";
import { BasicGuestVacancyResponseResume } from "../../guest-response-resume/guest-response-resume.dto";


export type BasicGuestVacancyResponse = Pick<
  GuestVacancyResponse,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "text"
  | "status"
  | "moderationStatus"
  | "isViewedByEmployer"
  | "vacancyId"
>;

const BasicGuestVacancyResponseSchema: yup.ObjectSchema<BasicGuestVacancyResponse> = yup.object({
  id: yup.string().max(36).defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  text: yup.string().defined().trim().max(3000).nullable(),
  status: yupOneOfEnum(VacancyResponseStatus).defined(),
  moderationStatus: yupOneOfEnum(VacancyResponseModerationStatus).defined(),
  isViewedByEmployer: yup.boolean().defined(),
  vacancyId: yup.string().defined().max(36),
});

export type GetGuestVacancyResponseResponse = BasicGuestVacancyResponse & {
  vacancy?: BasicVacancy,
  resume?: BasicGuestVacancyResponseResume | null,
};

export type PatchGuestVacancyResponseByPublicRequest = Partial<
  Pick<
    BasicGuestVacancyResponse,
    | "text"
  >
> & RequesterPublic;

export const PatchGuestVacancyResponseByPublicRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseByPublicRequest> = BasicGuestVacancyResponseSchema.pick([
  "text",
]).partial()
  .concat(RequesterPublicSchema);

export type PatchGuestVacancyResponseByEmployerRequest = Partial<
  Pick<
    BasicGuestVacancyResponse,
    | "status"
    | "isViewedByEmployer"
  >
> & RequesterEmployer;

export const PatchGuestVacancyResponseByEmployerRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseByEmployerRequest> = BasicGuestVacancyResponseSchema.pick([
  "status",
  "isViewedByEmployer",
]).partial()
  .concat(RequesterEmployerSchema);

export type PatchGuestVacancyResponseByManagerRequest = Partial<
  Pick<
    BasicGuestVacancyResponse,
    | "status"
    | "moderationStatus"
    | "isViewedByEmployer"
  >
> & RequesterManager;

export const PatchGuestVacancyResponseByManagerRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseByManagerRequest> = BasicGuestVacancyResponseSchema.pick([
  "status",
  "moderationStatus",
  "isViewedByEmployer",
]).partial()
  .concat(RequesterManagerSchema);

export type CreateQueuedWithOcrGuestVacancyResponseResponse = {
  jobId: string
}

export type PatchGuestVacancyResponseQueuedWithOcrRequest = {
  overwriteResumeFields?: {
    contacts?: FullRequired<
      Pick<
        PatchResumeContactRequest,
        | "type"
        | "name"
        | "preferred"
        | "value"
      >
    >[],
  }
};

export const PatchGuestVacancyResponseQueuedWithOcrRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseQueuedWithOcrRequest> = yup.object({
  overwriteResumeFields: yup.object({
    contacts: yup.array().of(BasicResumeContactSchema.pick([
      "type",
      "name",
      "preferred",
      "value",
    ])),
  }).partial(),
});

export type MetadataCreateGuestVacancyResponse = {
  callback: "create-guest-vacancy-response"
  vacancyId: string,
  guestResponseId: string | null,
  errorDuringCreation: boolean | null,
} & PatchGuestVacancyResponseQueuedWithOcrRequest;