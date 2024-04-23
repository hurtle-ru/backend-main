import { Job, Queue } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { JobsOptions } from "bullmq/dist/esm/types";
import { logger } from "../../../infrastructure/logger/logger";
import { injectable, singleton } from "tsyringe";
import {
  GetResumeOcrJobResponse,
  RESUME_OCR_JOB_NAME,
  RESUME_OCR_QUEUE_NAME,
  ResumeOcrJobData,
  ResumeOcrJobStatus,
} from "../resume-ocr.dto";


@injectable()
@singleton()
export class ResumeOcrQueue {
  private queue: Queue<ResumeOcrJobData>;

  constructor() {
    this.queue = new Queue(RESUME_OCR_QUEUE_NAME, {
        connection: redis,
      },
    );
  }

  async enqueueRecognizePdf(data: ResumeOcrJobData, opts?: JobsOptions): Promise<string> {
    const job = await this.queue.add(RESUME_OCR_JOB_NAME, data, opts);

    logger.info({ jobId: job.id }, "Enqueued resume-ocr job");

    return job.id!;
  }

  async getJob(jobId: string): Promise<GetResumeOcrJobResponse | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    return {
      status: await this.mapJobStatus(job),
      resume: job.returnvalue,
      createdAt: job.timestamp,
      finishedAt: job.finishedOn,
    }
  }

  async mapJobStatus(job: Job<ResumeOcrJobData>): Promise<ResumeOcrJobStatus> {
    if (await job.isFailed()) return ResumeOcrJobStatus.FAILED;
    if (await job.isCompleted()) return ResumeOcrJobStatus.SUCCESS;

    return ResumeOcrJobStatus.PROCESSING;
  }
}
