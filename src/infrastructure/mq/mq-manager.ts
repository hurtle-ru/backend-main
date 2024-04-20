import { logger } from "../logger/logger";
import { container } from "tsyringe";
import { Job, Worker, Queue } from "bullmq";
import { EmailWorker } from "../../external/email/mq/email.worker";
import redis from "./redis.provider";
import { TelegramWorker } from "../../external/telegram/mq/telegram.worker";
import { ResumeOcrWorker } from "../../domain/resume-ocr/mq/resume-ocr.worker";


export class MqManager {
  private workers: Worker[] = [];

  // The workers initialization is put in the run method because the initialization of them requires a redis connection, which may cause an error
  constructor() {}

  public run() {
    this.workers = [
      container.resolve(EmailWorker),
      container.resolve(TelegramWorker),
      container.resolve(ResumeOcrWorker),
    ];

    for (const worker of this.workers) {
      worker.on("completed", (job: Job, returnValue: "DONE" | null) => {
        logger.debug({ name: job.name, id: job.id, queueName: job.queueName, returnValue }, "Job completed");
      });

      worker.on("active", (job: Job<unknown>) => {
        logger.debug({ name: job.name, id: job.id, queueName: job.queueName }, "Active job");
      });

      worker.on("failed", (job: Job<unknown> | undefined, error: Error, prev: string) => {
        logger.error({ name: job?.name, id: job?.id, queueName: job?.queueName, error, prev }, "Job failed");
      });

      worker.on("error", (failedReason: Error) => {
        if(failedReason.message.startsWith("WRONGPASS")) {
          logger.error({ err: { stack: failedReason.stack } }, "Redis connection error");
          return;
        }

        logger.error(failedReason, "Redis connection error");
      });

      worker.run();
      logger.info(`Starting MQ worker ${worker.name}`);
    }
  }

  // Queues do not need to be closed, because they are closed automatically when the redis connection is closed
  public async close() {
    for (const worker of this.workers) {
      await worker.close();
    }

    await redis.quit();
  }
}