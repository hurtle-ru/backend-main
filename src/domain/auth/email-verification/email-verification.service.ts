import otpGenerator from "otp-generator";
import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { MailService } from "../../../external/mail/mail.service";
import pino from "pino";


@injectable()
@singleton()
export class EmailVerificationService {
  constructor(private readonly mailService: MailService) {}

  generateCode(): string {
    return otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  }

  async sendEmail(logger: pino.Logger, name: string, email: string, code: string) {
    const encodedEmail = encodeURIComponent(email);
    const encodedCode = encodeURIComponent(code);

    const link = appConfig.DOMAIN + `/auth/verify-email?email=${encodedEmail}&code=${encodedCode}`;

    await this.mailService.sendEmail(logger, email, "Подтверждение почты", {
      name: "verify_email",
      context: { name, code, link },
    });
  }
}
