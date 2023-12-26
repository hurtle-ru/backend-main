import { PartnershipInquiry } from "@prisma/client";

export type BasicPartnershipInquiry = PartnershipInquiry;

export type CreatePartnershipInquiryRequest = Pick<
  PartnershipInquiry,
  | "representativeName"
  | "companyName"
  | "contact"
  | "email"
  | "status"
>