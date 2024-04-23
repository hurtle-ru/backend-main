import { Job, Queue, } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { JobsOptions, } from "bullmq/dist/esm/types";
import { logger, } from "../../../infrastructure/logger/logger";
import { EMAIL_QUEUE_NAME, EMAIL_JOB_NAME, EmailJobData, } from "../email.dto";
import { injectable, singleton, } from "tsyringe";


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
    },);
  }

  public async enqueueEmail(data: EmailJobData, opts?: JobsOptions,) {
    const job = await this.queue.add(EMAIL_JOB_NAME, data, opts,);
    logger.info({ jobId: job.id, }, "Enqueued email job",);
  }

  public async removeJob(jobId: string,) {
    await this.queue.remove(jobId,);
  }

  public async findIncompleteJobsByEmailAndLink(email: string, link: string,): Promise<Job<EmailJobData>[]> {
    const jobs = await this.queue.getJobs(
      ["failed", "delayed", "prioritized", "waiting", "waiting-children", "paused", "repeat", "wait",],
    );
    return jobs.filter((job,) => job.data.to === email && job.data.template.context.link === link,);
  }
}