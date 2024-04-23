import { DeepPartial, Nullable } from "tsdef";
import { Currency } from "@prisma/client";
import { ContactType } from ".prisma/client";

export const RESUME_OCR_JOB_NAME = "recognizePdfWithResumeOcr";
export const RESUME_OCR_QUEUE_NAME = "resumeOcr";

export interface ResumeOcrJobData {
  fileName: string,
  recognizedResume?: string,
  mappedResume?: GetRecognizedResumeResponse,
}

export const enum ResumeOcrJobStatus {
  SUCCESS = "SUCCESS",
  PROCESSING = "PROCESSING",
  FAILED = "FAILED",
}

export type UnknownDeepRawRecognizedResume = RawRecognizedResume | DeepNestedRawRecognizedResume;

interface DeepNestedRawRecognizedResume {
  [key: string]: UnknownDeepRawRecognizedResume;
}

export type RawRecognizedResume = DeepPartial<
  DeepNullable<
    Omit<
      GetRecognizedResumeResponse,
      | "createdAt"
      | "importedFrom"
      | "importedId"
      | "birthDate" // ignore birthDate
    >
  >
>;

export type GetRecognizedResumeResponse = {
  createdAt: Date,
  importedFrom: "PDF_USING_GPT",
  importedId: string | null,
  firstName: string,
  middleName: string | null,
  lastName: string,
  birthDate: Date | null,
  title: string,
  summary: string | null,
  city: string | null,
  country: string | null,
  isReadyToRelocate: boolean | null,
  skills: string[],
  desiredSalary: number | null,
  desiredSalaryCurrency: Currency | null,
  certificates: {
    name: string,
    description: string | null,
    year: number | null,
  }[],
  contacts: {
    name: string | null,
    type: ContactType,
    value: string,
    preferred: boolean,
  }[],
  education: {
    name: string,
    description: string | null,
    degree: string | null,
    startYear: number | null,
    endYear: number | null,
  }[],
  experience: {
    company: string | null,
    position: string,
    startMonth: number | null,
    startYear: number | null,
    endMonth: number | null,
    endYear: number | null,
    description: string | null,
  }[],
  languages: {
    name: string,
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "L1" | string | null,
  }[],
};

export type GetResumeOcrJobResponse = {
  status: ResumeOcrJobStatus,
  resume: GetRecognizedResumeResponse | null,
  createdAt: number,
  finishedAt: number | undefined,
}
