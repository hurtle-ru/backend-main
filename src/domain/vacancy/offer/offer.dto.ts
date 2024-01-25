import { Offer } from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { BasicCandidate } from "../candidate/candidate.dto"


export type BasicOffer = Omit<
  Offer,
  | "vacancy"
  | "candidate"
>;

export type GetOfferResponse = BasicOffer & {
  vacancy?: BasicVacancy;
  candidate?: BasicCandidate;
}

export type CreateOfferRequest = Pick<
  Offer,
  | "message"
  | "salary"
  | "salaryCurrency"
  | "vacancyId"
  | "candidateId"
>

export type PutOfferRequest = CreateOfferRequest;