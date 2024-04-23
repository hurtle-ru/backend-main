import * as yup from "yup";

import { Currency, Offer, OfferStatus, } from "@prisma/client";
import { BasicVacancy, } from "../vacancy.dto";
import { BasicVacancyResponse, } from "../response/response.dto";
import { yupUint32, } from "../../../infrastructure/validation/requests/int32.yup";
import { yupOneOfEnum, } from "../../../infrastructure/validation/requests/enum.yup";


export type BasicOffer = Omit<
  Offer,
  | "vacancy"
  | "vacancyResponse"
>;

export type GetOfferResponse = BasicOffer & {
  vacancy?: BasicVacancy;
  vacancyResponse?: BasicVacancyResponse;
}

const BasicOfferSchema: yup.ObjectSchema<BasicOffer> = yup.object({
  id: yup.string().length(36,).defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined(),
  status: yupOneOfEnum(OfferStatus,).defined(),
  message: yup.string().defined().trim().min(10,).max(500,),
  salary: yupUint32().defined().max(100_000_000,),
  salaryCurrency: yupOneOfEnum(Currency,).defined(),
  vacancyResponseId: yup.string().defined().length(36,),
},);


export type CreateOfferRequest = Pick<BasicOffer,
  | "message"
  | "salary"
  | "salaryCurrency"
  | "vacancyResponseId"
>

export const CreateOfferRequestSchema: yup.ObjectSchema<CreateOfferRequest> = BasicOfferSchema.pick([
  "message",
  "salary",
  "salaryCurrency",
  "vacancyResponseId",
],);

export type PatchOfferRequest = Partial<Pick<BasicOffer,
  | "message"
  | "salary"
  | "salaryCurrency"
  | "vacancyResponseId"
>>

export const PatchOfferRequestSchema: yup.ObjectSchema<PatchOfferRequest> = BasicOfferSchema.pick([
  "message",
  "salary",
  "salaryCurrency",
  "vacancyResponseId",
],).partial();
