import * as yup from "yup"

import { Currency, Offer } from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { BasicVacancyResponse } from "../response/response.dto"
import { uint32 } from '../../../infrastructure/validation/requests/int32.yup';
import { yupEnum } from '../../../infrastructure/validation/requests/enum.yup';


export type BasicOffer = Omit<
  Offer,
  | "vacancy"
  | "vacancyResponse"
>;

export type GetOfferResponse = BasicOffer & {
  vacancy?: BasicVacancy;
  vacancyResponse?: BasicVacancyResponse;
}

const BasicOfferScheme = yup.object({
  message: yup.string().trim().min(10).max(500),
  salary: uint32().max(100_000_000),
  salaryCurrency: yupEnum(Currency),
  vacancyResponseId: yup.string().length(36),
})

export class CreateOfferRequest {
  static scheme = BasicOfferScheme.pick([
    "message",
    "salary",
    "salaryCurrency",
    "vacancyResponseId",
  ])

  constructor(
    public message: string,
    public salary: number,
    public salaryCurrency: keyof typeof Currency,
    public vacancyResponseId: string,
  ) {}
}

export class PutOfferRequest {
  static scheme = BasicOfferScheme.pick([
    "message",
    "salary",
    "salaryCurrency",
    "vacancyResponseId",
  ])

  constructor(
    public message: string,
    public salary: number,
    public salaryCurrency: keyof typeof Currency,
    public vacancyResponseId: string,
  ) {}
}