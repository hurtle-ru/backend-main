import { bool, cleanEnv, num, port, str } from "envalid";

export const tinkoffConfig = {
  ...cleanEnv(
    process.env,
    {
      TINKOFF_TERMINAL_ID: str(),
      TINKOFF_TERMINAL_PASSWORD: str(),
    },
  ),
};