import { str, cleanEnv } from "envalid";

export const chatGPTConfig = {
  ...cleanEnv(process.env, {
    CHATGPT_API_KEY: str(),
    CHATGPT_MODEL: str(),
  }),
};
