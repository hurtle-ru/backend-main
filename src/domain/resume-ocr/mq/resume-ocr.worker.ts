import { Job, Queue, Worker, } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { injectable, singleton, } from "tsyringe";
import { RESUME_OCR_QUEUE_NAME, ResumeOcrJobData, } from "../resume-ocr.dto";
import { ResumeOcrService, } from "../resume-ocr.service";


@injectable()
@singleton()
export class ResumeOcrWorker extends Worker<ResumeOcrJobData> {
  constructor(private readonly resumeOcrService: ResumeOcrService,) {
    super(
      RESUME_OCR_QUEUE_NAME,

      async (job: Job<ResumeOcrJobData>,) => {
        return await this.resumeOcrService.recognizePdf(job.data,);
      },

      {
        autorun: false,
        connection: redis,
        lockDuration: 2 * 60 * 1000,
        limiter: {
          max: 490,
          duration: 60,
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