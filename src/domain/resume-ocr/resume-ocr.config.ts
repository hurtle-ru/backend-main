import { bool, cleanEnv, port, str } from "envalid";


export const resumeOcrConfig = cleanEnv(process.env, {
  RESUME_OCR_ASSISTANT_ID: str(),
});