import { Job, Worker } from "bullmq";
import redis from "../../../infrastructure/mq/redis.provider";
import { injectable, singleton } from "tsyringe";
import { EmailService } from "../email.service";
import { EMAIL_QUEUE_NAME, EmailJobData } from "../email.dto";


@injectable()
@singleton()
export class EmailWorker extends Worker<EmailJobData> {
  constructor(private readonly emailService: EmailService) {
    super(EMAIL_QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        await this.emailService.sendEmail(job.data);
      },
      {
        autorun: false,
        connection: redis,
        lockDuration: 30000,
        limiter: {
          max: 5,
          duration: 1000,
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