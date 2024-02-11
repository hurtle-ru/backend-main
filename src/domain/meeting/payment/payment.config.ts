import { bool, cleanEnv, num, port, str } from "envalid";
import { int } from "../../../infrastructure/validation/int.envalid";
import { MeetingType } from "@prisma/client";

export const paymentConfig = {
  ...cleanEnv(
    process.env,
    {
      MEETING_PAYMENT_SUCCESS_URL_BASE: str(),
      MEETING_PAYMENT_FAIL_URL_BASE: str(),
      MEETING_PAYMENT_CONSULTATION_B2C_EXPERT_PRICE_IN_KOPECKS: int(),
    }
  ),
};

export const meetingPriceByType = {
  [MeetingType.CONSULTATION_B2C_EXPERT]: paymentConfig.MEETING_PAYMENT_CONSULTATION_B2C_EXPERT_PRICE_IN_KOPECKS,
}