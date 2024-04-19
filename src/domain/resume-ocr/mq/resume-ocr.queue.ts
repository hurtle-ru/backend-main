import { Job, Queue } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { JobsOptions } from "bullmq/dist/esm/types";
import { logger } from "../../../infrastructure/logger/logger";
import { injectable, singleton } from "tsyringe";
import { RESUME_OCR_JOB_NAME, RESUME_OCR_QUEUE_NAME, ResumeOcrJobData, ResumeOcrJobInfo, ResumeOcrSimpleJobStatus } from "../resume-ocr.dto";


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

  async enqueueResumeOcr(data: ResumeOcrJobData, opts?: JobsOptions): Promise<string> {
    const job = await this.queue.add(RESUME_OCR_JOB_NAME, data, opts);

    logger.info({ jobId: job.id }, "Enqueued email job");

    return job.id!
  }

  async getJobInfo(jobId: string): Promise<ResumeOcrJobInfo | undefined> {
    const job = await this.queue.getJob(jobId)

    if (!job) return

    this.getSimpleJobStatus(job)

    return {
      status: await this.getSimpleJobStatus(job),
      resume: job.returnvalue,
      createdAt: job.timestamp,
      finishedAt: job.finishedOn,
    }
  }

  async getSimpleJobStatus(job: Job<ResumeOcrJobData>): Promise<ResumeOcrSimpleJobStatus> {
    if (await job.isFailed()) return ResumeOcrSimpleJobStatus.failed
    if (await job.isCompleted()) return ResumeOcrSimpleJobStatus.success

    return ResumeOcrSimpleJobStatus.processing
  }
}
