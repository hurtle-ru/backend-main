import otpGenerator from "otp-generator";
import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { MailService } from "../../../external/mail/mail.service";


@injectable()
@singleton()
export class EmailVerificationService {
  constructor(private readonly mailService: MailService) {}

  generateCode(): string {
    return otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  }
  async sendEmail(email: string, code: string) {
    const link = appConfig.DOMAIN + "/auth/verify-email/" + code;

    await this.mailService.sendEmail(email, "Подтверждение почты", {
      name: "verify-email",
      context: { link, code },
    });
  }
}