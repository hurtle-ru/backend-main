import { Job } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { injectable, singleton } from "tsyringe";
import { RESUME_OCR_QUEUE_NAME, ResumeOcrJobData } from "../resume-ocr.dto";
import { ResumeOcrService } from "../resume-ocr.service";
import { BaseWorker } from "../../../infrastructure/mq/base.worker";
import { ResumeOcrMapper } from "../resume-ocr.mapper";


@injectable()
@singleton()
export class ResumeOcrWorker extends BaseWorker<ResumeOcrJobData> {
  constructor(
    private readonly resumeOcrService: ResumeOcrService,
    private readonly resumeOcrMapper: ResumeOcrMapper,
  ) {
    super(
      RESUME_OCR_QUEUE_NAME,

      async (job: Job<ResumeOcrJobData>) => {
        const { data } = job;
        const recognizedResume = await this.resumeOcrService.recognizePdf(job.data);
        const mappedResume = this.resumeOcrMapper.mapResume(recognizedResume, job.id ?? null);

        await job.updateData({
          ...data,
          recognizedResume,
          mappedResume,
        })

        return mappedResume;
      },

      {
        autorun: false,
        connection: redis,
        lockDuration: 2 * 60 * 1000,
        stalledInterval: 2 * 60 * 1000,
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
      }
    );
  }
}