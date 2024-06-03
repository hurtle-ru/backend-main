import { PromoCode,
} from "@prisma/client";
import * as yup from "yup";


export type BasicPromoCode = Omit<
  PromoCode,
  | "meetingPayments"
>;

const BasicPromoCodeSchema: yup.ObjectSchema<BasicPromoCode> = yup.object({
  value: yup.string().defined(),
  createdAt: yup.date().defined(),
  updatedAt: yup.date().defined().defined(),
  discount: yup.number().defined().min(1).max(99),

});
