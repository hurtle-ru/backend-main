import otpGenerator from "otp-generator";
import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { EmailService } from "../../../external/email/email.service";


@injectable()
@singleton()
export class EmailVerificationService {
  constructor(private readonly emailService: EmailService) {}

  generateCode(): string {
    return otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  }

  async sendEmail(name: string, email: string, code: string) {
    const encodedEmail = encodeURIComponent(email);
    const encodedCode = encodeURIComponent(code);

    const link = appConfig.DOMAIN + `/auth/verify-email?email=${encodedEmail}&code=${encodedCode}`;

    await this.emailService.enqueueEmail({
      to: email,
      subject: "Подтверждение почты",
      template: {
        name: "verify_email",
        context: { name, code, link },
      },
    });
  }
}
