import * as  yup from 'yup'

import { PartnershipInquiry } from "@prisma/client";
import { PartnershipInquiryStatus } from "@prisma/client";
import { yupOneOfEnum } from '../../infrastructure/validation/requests/enum.yup';


export type BasicPartnershipInquiry = PartnershipInquiry;

export const BasicPartnershipInquirySchema: yup.ObjectSchema<BasicPartnershipInquiry> = yup.object({
  id: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  representativeName: yup.string().defined().min(1).max(255),
  companyName: yup.string().defined().min(1).max(255),
  contact: yup.string().defined().min(1).max(255),
  email: yup.string().defined().email().max(255),
  status: yupOneOfEnum(PartnershipInquiryStatus).defined(),
})


export type CreatePartnershipInquiryRequest = Pick<
  PartnershipInquiry,
  | "representativeName"
  | "companyName"
  | "contact"
  | "email"
  | "status"
>
export const CreatePartnershipInquiryRequestSchema: yup.ObjectSchema<CreatePartnershipInquiryRequest> = BasicPartnershipInquirySchema.pick([
  "representativeName",
  "companyName",
  "contact",
  "email",
  "status",
])

export type PatchByIdPartnershipInquiryStatusRequest = Partial<Pick<BasicPartnershipInquiry, "status">>

export const PatchByIdPartnershipInquiryStatusRequestSchema: yup.ObjectSchema<PatchByIdPartnershipInquiryStatusRequest> = BasicPartnershipInquirySchema.pick([
  "status",
]).partial()
