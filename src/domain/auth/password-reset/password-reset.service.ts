import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { MailService } from "../../../external/mail/mail.service";
import otpGenerator from "otp-generator";


@injectable()
@singleton()
export class PasswordResetService {
  constructor(private readonly mailService: MailService) {}

  generateCode(): string {
    return otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  }

  async sendEmail(email: string, code: string) {
    const link = appConfig.DOMAIN + `/auth/reset-password/?email=${email}&code=${code}`;

    await this.mailService.sendEmail(email, "Сброс пароля", {
      name: "reset_password",
      context: { link },
    });
  }
}