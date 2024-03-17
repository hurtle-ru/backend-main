import { Queue } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { JobsOptions } from "bullmq/dist/esm/types";
import { logger } from "../../../infrastructure/logger/logger";
import { EMAIL_QUEUE_NAME, EMAIL_JOB_NAME, EmailJobData } from "../email.dto";
import { injectable, singleton } from "tsyringe";


@injectable()
@singleton()
export class EmailQueue {
  private queue: Queue<EmailJobData>;

  constructor() {
    this.queue = new Queue(EMAIL_QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 10,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    });
  }

  public async enqueueEmail(data: EmailJobData, opts?: JobsOptions) {
    const job = await this.queue.add(EMAIL_JOB_NAME, data, opts);
    logger.info({ jobId: job.id }, "Enqueued email job");
  }
}