import { Job, Queue } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { logger } from "../../../infrastructure/logger/logger";
import { injectable, singleton } from "tsyringe";
import {
  GetResumeOcrJobResponse,
  RESUME_OCR_JOB_NAME,
  RESUME_OCR_QUEUE_NAME,
  ResumeOcrJobData,
  ResumeOcrJobStatus,
} from "../resume-ocr.dto";
import { randomUUID } from "crypto";


@injectable()
@singleton()
export class ResumeOcrQueue {
  private readonly queue: Queue<ResumeOcrJobData>;

  constructor() {
    this.queue = new Queue(RESUME_OCR_QUEUE_NAME, {
      connection: redis,
    });
  }

  async enqueueRecognizePdf(data: ResumeOcrJobData): Promise<Job<ResumeOcrJobData>> {
    const jobId = randomUUID();
    const job = await this.queue.add(RESUME_OCR_JOB_NAME, data, { jobId });

    logger.info({ jobId: job.id }, "Enqueued resume-ocr job");

    return job;
  }

  async getJob(jobId: string): Promise<GetResumeOcrJobResponse | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    return {
      id: jobId,
      status: await this.mapJobStatus(job),
      createdAt: job.timestamp,
      finishedAt: job.finishedOn,
      data: {
        metadata: job.data.metadata,
        mappedResume: job.data.mappedResume ?? null,
      },
    };
  }

  async patchJobData(jobId: string, newFields: Partial<ResumeOcrJobData>) {
    const job = await Job.fromId<ResumeOcrJobData, any, any>(this.queue, jobId);

    if (job) {
      const data = job?.data;

      await job?.updateData({
        ...data,
        ...newFields,
      });
    }
  }

  async mapJobStatus(job: Job<ResumeOcrJobData>): Promise<ResumeOcrJobStatus> {
    if (await job.isFailed()) return ResumeOcrJobStatus.FAILED;
    if (await job.isCompleted()) return ResumeOcrJobStatus.SUCCESS;

    return ResumeOcrJobStatus.PROCESSING;
  }
}
