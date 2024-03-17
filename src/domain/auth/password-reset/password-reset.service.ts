import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { EmailService } from "../../../external/email/email.service";
import otpGenerator from "otp-generator";
import pino from "pino";


@injectable()
@singleton()
export class PasswordResetService {
  constructor(private readonly emailService: EmailService) {}

  generateCode(): string {
    return otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  }

  async sendEmail(logger: pino.Logger, email: string, code: string) {
    const encodedEmail = encodeURIComponent(email);
    const link = appConfig.DOMAIN + `/auth/reset-password/${code}?email=${encodedEmail}`;

    await this.emailService.enqueueEmail({
      to: email,
      subject: "Сброс пароля",
      template: {
        name: "reset_password",
        context: { link },
      },
    });
  }
}
