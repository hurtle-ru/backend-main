import { Offer } from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { BasicApplicant } from "../../applicant/applicant.dto";

export type BasicOffer = Omit<
  Offer,
  | "vacancy"
  | "candidate"
>;

export type GetOfferResponse = BasicOffer & {
  vacancy?: BasicVacancy;
  candidate?: BasicApplicant;
}

export type CreateOfferRequest = Pick<
  Offer,
  | "message"
  | "salary"
  | "salaryCurrency"
  | "status"
  | "vacancyId"
  | "candidateId"
>

export type PutOfferRequest = CreateOfferRequest;