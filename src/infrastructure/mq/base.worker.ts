import { Job, Worker, WorkerOptions } from "bullmq";
import redis from "./redis.provider";
import { logger } from "../logger/logger";

export class BaseWorker<DataType = any, ResultType = any, NameType extends string = string> extends Worker<DataType, ResultType, NameType> {
  constructor(
    queueName: string,
    processor: (job: Job<DataType, ResultType, NameType>) => Promise<ResultType>,
    opts?: WorkerOptions
  ) {
    super(queueName, processor, {
      ...opts,
      connection: redis,
    });

    this.on("failed", (job, err) => {-
      logger.error({
          err: { stack: err.stack },
          jobId: job?.id,
          queueName: queueName,
        }, `Job failed with error: ${err.message}`
      );
    });

    this.on("error", (err) => {
      logger.error({
          err: { stack: err.stack },
          queueName: queueName,
        }, `Unexpected error in worker: ${err.message}`
      );
    });
  }
}
