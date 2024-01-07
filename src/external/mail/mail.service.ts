import nodemailer, { Transporter } from "nodemailer";
import { mailConfig } from "./mail.config";
import * as fs from "fs";
import path from "path";
import { render as renderTemplate } from "squirrelly";
import { singleton } from "tsyringe";


@singleton()
export class MailService {
  private transporter: Transporter;

  constructor() {
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

  async sendEmail (email: string, subject: string, template: {
    name: string,
    context: object,
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: "hello@hurtle.ru",
        to: email,
        subject: subject,
        html: this.loadTemplate(template.name, template.context),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);

      return true;
    } catch (error) {
      console.log("Error occurred during sending email: %s", error);
      return false;
    }
  }

  loadTemplate(templateName: string, context: any): string {
    const templatePath = path.join(process.cwd(), `resources/email-templates/${templateName}.template.html`);
    const templateHtml = fs.readFileSync(templatePath, "utf8")
    return renderTemplate(templateHtml, context);
  }
}