import nodemailer, { Transporter } from "nodemailer";
import { mailConfig } from "./mail.config";
import * as fs from "fs";
import path from "path";
import { render as renderTemplate } from "squirrelly";
import { injectable, singleton } from "tsyringe";
import { TemplateRendererService } from "../template-renderer/template-renderer.service";
import pino from "pino";


@injectable()
@singleton()
export class MailService {
  private transporter: Transporter;

  constructor(readonly templateRendererService: TemplateRendererService) {
    this.transporter = nodemailer.createTransport({
      host: mailConfig.MAIL_HOST,
      port: mailConfig.MAIL_PORT,
      secure: mailConfig.MAIL_SECURE,
      auth: {
        user: mailConfig.MAIL_AUTH_USER,
        pass: mailConfig.MAIL_AUTH_PASS,
      },
    });
  }

  async sendEmail(logger: pino.Logger, email: string, subject: string, template: {
    name: string,
    context: object,
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: "hello@hurtle.ru",
        to: email,
        subject: subject,
        html: this.templateRendererService.renderTemplate(
          "email_templates",
          template.name,
          "html",
          template.context,
          true
        ),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent: %s", info.messageId);

      return true;
    } catch (error) {
      logger.error("Error occurred during sending email: %s", error);
      return false;
    }
  }
}
