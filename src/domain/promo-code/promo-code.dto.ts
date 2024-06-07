import {
  MeetingPayment, PromoCode,
} from "@prisma/client";
import * as yup from "yup";
import { yupInt32 } from "../../infrastructure/validation/requests/int32.yup";


export type BasicPromoCode = Pick<
  PromoCode,
  | "value"
  | "createdAt"
  | "updatedAt"
  | "discount"
  | "expirationDate"
  | "isActive"
  | "maxUses"
  | "successfulUses"
>;

const BasicPromoCodeSchema: yup.ObjectSchema<BasicPromoCode> = yup.object({
  value: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined().defined(),
  discount: yup.number().defined().min(1).max(99),
  expirationDate: yup.date().defined().min(new Date()).nullable(),
  isActive: yup.boolean().defined(),
  maxUses: yupInt32().defined().min(1).nullable(),
  successfulUses: yupInt32().defined(),
});

export type CreatePromoCodeRequest = Pick<
  BasicPromoCode,
  | "value"
  | "discount"
  | "expirationDate"
  | "isActive"
  | "maxUses"
>;

export const CreatePromoCodeRequestSchema: yup.ObjectSchema<CreatePromoCodeRequest> = BasicPromoCodeSchema.pick([
  "value",
  "discount",
  "expirationDate",
  "isActive",
  "maxUses",
]);

export type PatchByValuePromoCodeRequest = Partial<
  Pick<
    BasicPromoCode,
    | "value"
    | "discount"
    | "expirationDate"
    | "isActive"
    | "maxUses"
  >
>;

export const PatchByValuePromoCodeRequestSchema: yup.ObjectSchema<PatchByValuePromoCodeRequest> = BasicPromoCodeSchema.pick([
  "value",
  "discount",
  "expirationDate",
  "isActive",
  "maxUses",
]).partial();

export type GetPromoCodeResponse = Pick<
  BasicPromoCode,
  | "value"
  | "discount"
  | "isActive"
> & Partial<
  Pick<
    BasicPromoCode,
    | "createdAt"
    | "updatedAt"
    | "expirationDate"
    | "maxUses"
    | "successfulUses"
  >
> & {
  meetingPayments?: MeetingPayment[];
}

export type GetAllPromoCodeResponse = Pick<
  BasicPromoCode,
  "value"
  | "discount"
  | "expirationDate"
  | "isActive"
  | "createdAt"
  | "updatedAt"
  | "maxUses"
  | "successfulUses"
  >
