import { Queue } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { JobsOptions } from "bullmq/dist/esm/types";
import { logger } from "../../../infrastructure/logger/logger";
import { injectable, singleton } from "tsyringe";
import { TELEGRAM_JOB_NAME, TELEGRAM_QUEUE_NAME, TelegramAdminNotificationJobData } from "../telegram.dto";


@injectable()
@singleton()
export class TelegramQueue {
  private queue: Queue<TelegramAdminNotificationJobData>;

  constructor() {
    this.queue = new Queue(TELEGRAM_QUEUE_NAME, {
      connection: redis,
    });
  }

  public async enqueueAdminNotification(data: TelegramAdminNotificationJobData, opts?: JobsOptions) {
    const job = await this.queue.add(TELEGRAM_JOB_NAME, data, {
      attempts: 10,
      backoff: {
        type: "exponential",
        delay: 10000,
      },
      ...opts,
    });

    logger.info({ jobId: job.id }, "Enqueued Telegram Admin Notification job");
  }
}