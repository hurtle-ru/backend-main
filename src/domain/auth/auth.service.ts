import jwt from "jsonwebtoken";
import {
  JwtModel,
  RegisterApplicantRequest,
  RegisterApplicantWithGoogleRequest,
  RegisterEmployerRequest,
  RegisterApplicantHhToken,
  RegisterApplicantWithHhRequest,
  RegisterApplicantWithGazpromBaseRequest,
} from "./auth.dto";
import { authConfig } from "./auth.config";
import * as bcrypt from "bcryptjs";
import { singleton } from "tsyringe";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { TokenPayload } from "google-auth-library/build/src/auth/loginticket";
import { APPLICANT, EMPLOYER } from "../../infrastructure/controller/requester/requester.dto";
import otpGenerator from "otp-generator";
import { EmailService } from "../../external/email/email.service";
import { appConfig } from "../../infrastructure/app.config";
import { Prisma } from "@prisma/client";
import { BasicGazpromToken } from "../../external/gazprom/gazprom.dto";



@singleton()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  createToken(payload: Omit<JwtModel["user"], "iat">): string {
    return jwt.sign({
      ...payload,
      iat: Date.now(),
    }, authConfig.JWT_SECRET_KEY);
  }

  async generatePasswordHash(password: string) {
    return await bcrypt.hash(password, 12);
  }

  async comparePasswords(password: string, passwordHash: string) {
    return await bcrypt.compare(password, passwordHash);
  }

  async registerApplicant(body: RegisterApplicantRequest) {
    await prisma.applicant.create(
      {
        data: {
          login: body.email,
          password: {
            create: {
              hash: await this.generatePasswordHash(body.password),
            },
          },
          firstName: body.firstName,
          lastName: body.lastName,
          middleName: body.middleName,
          contact: body.contact,
          email: body.email,
          birthDate: body.birthDate,
          resume: {
            create: {},
          },
        },
      },
    );
  }

  async registerEmployer(body: RegisterEmployerRequest) {
    await prisma.employer.create({
      data: {
        email: body.email,
        contact: body.contact,
        password: {
          create: {
            hash: await this.generatePasswordHash(body.password),
          },
        },
        lastName: body.lastName,
        firstName: body.firstName,
        middleName: body.middleName,
        login: body.email,
        name: body.name,
      },
    });
  }

  /**
  * @param {string | undefined} email inputted by user email for not email verified google accounts
  */
  async registerApplicantWithGoogle(body: RegisterApplicantWithGoogleRequest, googleToken: TokenPayload, email?: string | undefined) {
    return await prisma.applicant.create(
      {
        data: {
          login: ((googleToken.email && googleToken.email_verified) ? googleToken.email : body.email)!,
          firstName: body.firstName,
          lastName: body.lastName,
          middleName: body.middleName,
          contact: body.contact,
          email: ((googleToken.email && googleToken.email_verified) ? googleToken.email : body.email)!,
          birthDate: body.birthDate,
          googleTokenSub: googleToken.sub,
          resume: {
            create: {},
          },
        },
      },
    );
  }

  async registerApplicantWithHh(body: RegisterApplicantWithHhRequest, hhToken: RegisterApplicantHhToken) {
    const applicant = await prisma.applicant.create(
      {
        data: {
          login: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          middleName: body.middleName,
          contact: body.contact,
          email: body.email,
          birthDate: body.birthDate,
          resume: {
            create: {},
          },
        },
      },
    );

    await prisma.hhToken.create({
      data: {
        ...hhToken,
        applicant: { connect: { id: applicant.id } },
      },
    });

    return applicant;
  }

  async registerApplicantWithGazprom(body: RegisterApplicantWithGazpromBaseRequest & { openid: string }, gazpromToken: BasicGazpromToken) {
    const { openid, ...bodyRest } = body

    const applicant = await prisma.applicant.create(
      {
        data: {
          ...bodyRest,
          login: bodyRest.email,
          resume: {
            create: {},
          },
        },
      },
    );

    await prisma.gazpromToken.create({
      data: {
        ...gazpromToken,
        gazpromUserId: openid,
        applicant: { connect: { id: applicant.id } },
      },
    });

    return applicant;
  }

  async sendAuthByEmailCodeRequest(role: APPLICANT | EMPLOYER, email: string, name: string) {
    const authByEmailCodeRequest = await prisma.authByEmailCode.upsert({
      where: { email_role: { role, email } },
      create: {
        role,
        email,
        code: this.generateCode(),
      },
      update: {
        code: this.generateCode(),
      },
    });

    await this.sendAuthByEmailCodeEmail(role, email, name, authByEmailCodeRequest.code);
  }

  private generateCode(): string {
    return otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  }

  private async sendAuthByEmailCodeEmail(role: APPLICANT | EMPLOYER, email: string, name: string, code: string) {
    const encodedEmail = encodeURIComponent(email);
    const encodedCode = encodeURIComponent(code);

    const link = appConfig.DOMAIN + `/auth/byEmail?role=${role}&email=${encodedEmail}&code=${encodedCode}`;

    await this.emailService.enqueueEmail({
      to: email,
      subject: "Вход Хартл",
      template: {
        name: "auth_by_email_code",
        context: { name, code, link },
      },
    });
  }
}
