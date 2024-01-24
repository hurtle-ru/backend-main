import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { MailService } from "../../../external/mail/mail.service";
import otpGenerator from "otp-generator";


@injectable()
@singleton()
export class PasswordResetService {
  constructor(private readonly mailService: MailService) {}

  generateCode(): string {
    return otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  }

  async sendEmail(email: string, code: string) {
    await this.mailService.sendEmail(email, "Сброс пароля", {
      name: "reset-password",
      context: { code },
    });
  }
}