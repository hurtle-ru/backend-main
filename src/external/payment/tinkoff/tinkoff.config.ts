import { bool, cleanEnv, num, port, str } from "envalid";

export const tinkoffConfig = {
  SLOT_PAYMENT_AMOUNT: 2000000,
  SLOT_PAYMENT_DESCRIPTION: "Some payment description",

  ...cleanEnv(
    process.env,
    {
      TERMINAL_ID: str(),
      TERMINAL_PASSWORD: str(),
    }
  )
};
