import { cleanEnv, str } from "envalid";
import { int } from "../../../infrastructure/validation/env/int.envalid";


export const paymentConfig = {
  ...cleanEnv(
    process.env,
    {
      MEETING_PAYMENT_EXPIRATION_MINUTES: int(),
      MEETING_PAYMENT_SUCCESS_URL_BASE: str(),
      MEETING_PAYMENT_FAIL_URL_BASE: str(),
      MEETING_PAYMENT_NOTIFICATION_URL: str(),
    },
  ),
};