export const RESUME_OCR_JOB_NAME = "sendResumeOcr";
export const RESUME_OCR_QUEUE_NAME = "resumeOcr";

export interface ResumeOcrJobData {
    file: Express.Multer.File
}

export const enum ResumeOcrSimpleJobStatus {
    success = "SUCCESS",
    processing = "PROCESSING",
    failed = "FAILED",
}

export interface ResumeOcrJobInfo {
    status: ResumeOcrSimpleJobStatus,
    resume: any | null,
    createdAt: number,
    finishedAt: number | undefined,
}
