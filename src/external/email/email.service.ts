import nodemailer, { Transporter } from "nodemailer";
import { emailConfig } from "./email.config";
import { injectable, singleton } from "tsyringe";
import { TemplateRendererService } from "../template-renderer/template-renderer.service";
import { logger } from "../../infrastructure/logger/logger";
import { EmailQueue } from "./mq/email.queue";
import { EmailJobData } from "./email.dto";
import { JobsOptions } from "bullmq/dist/esm/types";
import { Job } from "bullmq";


@injectable()
@singleton()
export class EmailService {
  private transporter: Transporter;

  constructor(
    private readonly queue: EmailQueue,
    private readonly templateRendererService: TemplateRendererService
  ) {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.MAIL_HOST,
      port: emailConfig.MAIL_PORT,
      secure: emailConfig.MAIL_SECURE,
      auth: {
        user: emailConfig.MAIL_AUTH_USER,
        pass: emailConfig.MAIL_AUTH_PASS,
      },
    });
  }

  async enqueueEmail(data: EmailJobData, opts?: JobsOptions) {
    await this.queue.enqueueEmail(data, opts);
  }

  async removeJob(jobId: string) {
    await this.queue.removeJob(jobId);
  }

  // TODO: refactor
  async findIncompleteJobsByEmailAndLink(email: string, link: string): Promise<Job<EmailJobData>[]> {
    return await this.queue.findIncompleteJobsByEmailAndLink(email, link);
  }

  async sendEmail({ to, subject, template }: EmailJobData): Promise<boolean> {
    try {
      const emailOptions = {
        to,
        subject,
        from: {
          name: "Хартл",
          address: "hello@hurtle.ru",
        },
        html: this.templateRendererService.renderTemplate(
          "email_templates",
          template.name,
          "html",
          template.context,
          true
        ),
      };

      const info = await this.transporter.sendMail(emailOptions);
      logger.info("Email sent: %s", info.messageId);

      return true;
    } catch (error) {
      logger.error("Error occurred during sending email: %s", error);
      throw error;
    }
  }
}
