import { appConfig } from "../../../infrastructure/app.config";
import { injectable, singleton } from "tsyringe";
import { MailService } from "../../../external/mail/mail.service";


@injectable()
@singleton()
export class PasswordResetService {
  constructor(private readonly mailService: MailService) {}

  async sendEmail(email: string, code: string) {
    const link = appConfig.DOMAIN + "/auth/reset-password/" + code;

    await this.mailService.sendEmail(email, "Сброс пароля", {
      name: "reset-password",
      context: { link },
    });
  }
}