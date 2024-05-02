import { ContactType, GuestVacancyResponseResumeContact } from "@prisma/client";
import * as yup from "yup";
import { yupOneOfEnum } from "../../../infrastructure/validation/requests/enum.yup";


export type BasicGuestVacancyResponseResumeContact = Pick<
  GuestVacancyResponseResumeContact,
  | "id"
  | "name"
  | "type"
  | "value"
  | "preferred"
  | "resumeId"
>;

export const BasicGuestVacancyResponseResumeContactSchema: yup.ObjectSchema<BasicGuestVacancyResponseResumeContact> = yup.object({
  id: yup.string().defined(),
  name: yup.string().defined().trim().min(0).max(255).nullable(),
  type: yupOneOfEnum(ContactType).defined(),
  value: yup.string().defined().trim().min(0).max(255),
  preferred: yup.boolean().defined(),
  resumeId: yup.string().defined(),
});

export type PatchGuestVacancyResponseResumeContactRequest = Partial<
  Pick<
    BasicGuestVacancyResponseResumeContact,
    | "name"
    | "type"
    | "value"
    | "preferred"
  >
>;

export const PatchGuestVacancyResponseResumeContactRequestSchema: yup.ObjectSchema<PatchGuestVacancyResponseResumeContactRequest> = BasicGuestVacancyResponseResumeContactSchema.pick([
  "name",
  "type",
  "value",
  "preferred",
]).partial();
