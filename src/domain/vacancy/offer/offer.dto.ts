import * as yup from "yup"

import { Currency, Offer } from "@prisma/client";
import { BasicVacancy } from "../vacancy.dto";
import { BasicVacancyResponse } from "../response/response.dto"
import { yupUint32 } from '../../../infrastructure/validation/requests/int32.yup';
import { yupOneOfEnum } from '../../../infrastructure/validation/requests/enum.yup';


export type BasicOffer = Omit<
  Offer,
  | "vacancy"
  | "vacancyResponse"
>;

export type GetOfferResponse = BasicOffer & {
  vacancy?: BasicVacancy;
  vacancyResponse?: BasicVacancyResponse;
}

const BasicOfferSchema = yup.object({
  message: yup.string().trim().min(10).max(500),
  salary: yupUint32().max(100_000_000),
  salaryCurrency: yupOneOfEnum(Currency),
  vacancyResponseId: yup.string().length(36),
})

export class CreateOfferRequest {
  static schema = BasicOfferSchema.pick([
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
  static schema = BasicOfferSchema.pick([
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