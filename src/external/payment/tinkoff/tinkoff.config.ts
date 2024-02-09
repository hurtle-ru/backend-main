import { bool, cleanEnv, num, port, str } from "envalid";

export const tinkoffConfig = {
  SLOT_PAYMENT_AMOUNT: 2000000,
  SLOT_PAYMENT_DESCRIPTION: "Some payment description",
  PAYMENT_INITIATOR_TYPE: 1,
  ONE_STEP_PAYMENT_TYPE: "O",
  TWO_STEPS_PAYMENT_TYPE: "T",

  ...cleanEnv(
    process.env,
    {
      TERMINAL_ID: str(),
      TERMINAL_PASSWORD: str(),
    }
  )
};
