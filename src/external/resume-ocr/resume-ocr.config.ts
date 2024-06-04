import { cleanEnv, str } from "envalid";


export const resumeOcrConfig = cleanEnv(process.env, {
  RESUME_OCR_ASSISTANT_ID: str(),
});