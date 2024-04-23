import { Job, Queue, Worker, } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { injectable, singleton, } from "tsyringe";
import { TelegramService, } from "../telegram.service";
import { TELEGRAM_QUEUE_NAME, TelegramAdminNotificationJobData, } from "../telegram.dto";


@injectable()
@singleton()
export class TelegramWorker extends Worker<TelegramAdminNotificationJobData> {
  constructor(private readonly telegramService: TelegramService,) {
    super(TELEGRAM_QUEUE_NAME,
      async (job: Job<TelegramAdminNotificationJobData>,) => {
        try {
          await this.telegramService.sendMessage(job.data.text, job.data.options,);
        } catch (e: any) {
          if (e.message?.includes("429",)) {
            if (e.response?.headers?.["retry-after"]) {
              const duration = parseInt(e.response.headers["retry-after"],) * 1000;
              await this.rateLimit(duration,);
            } else {
              await this.rateLimit(60 * 1000,);
            }

            throw Worker.RateLimitError();
          }
        }
      },
      {
        autorun: false,
        connection: redis,
        lockDuration: 30000,
        limiter: {
          max: 19,
          duration: 60000,
        },
        removeOnFail: {
          count: 1000,
        },
        removeOnComplete: {
          count: 1000,
        },
      },
    );
  }
}