import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { MailService } from "../../../external/mail/mail.service";
import otpGenerator from "otp-generator";
import pino from "pino";


@injectable()
@singleton()
export class PasswordResetService {
  constructor(private readonly mailService: MailService) {}

  generateCode(): string {
    return otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  }

  async sendEmail(logger: pino.Logger, email: string, code: string) {
    const encodedEmail = encodeURIComponent(email);
    const link = appConfig.DOMAIN + `/auth/reset-password/${code}?email=${encodedEmail}`;

    await this.mailService.sendEmail(logger, email, "Сброс пароля", {
      name: "reset_password",
      context: { link },
    });
  }
}
