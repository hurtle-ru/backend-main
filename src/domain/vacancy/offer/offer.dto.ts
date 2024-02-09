import { Offer } from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { BasicVacancyResponse } from "../response/response.dto"


export type BasicOffer = Omit<
  Offer,
  | "vacancy"
  | "vacancyResponse"
>;

export type GetOfferResponse = BasicOffer & {
  vacancy?: BasicVacancy;
  vacancyResponse?: BasicVacancyResponse;
}

export type CreateOfferRequest = Pick<
  Offer,
  | "message"
  | "salary"
  | "salaryCurrency"
  | "vacancyResponseId"
>

export type PutOfferRequest = CreateOfferRequest;