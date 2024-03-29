import jwt from "jsonwebtoken";
import {
  JwtModel,
  RegisterApplicantRequest,
  RegisterApplicantWithGoogleRequest,
  RegisterApplicantWithHhRequest,
  RegisterEmployerRequest,
  registerApplicantHhToken,
} from "./auth.dto";
import { authConfig } from "./auth.config";
import * as bcrypt from "bcryptjs";
import { singleton } from "tsyringe";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { TokenPayload } from "google-auth-library/build/src/auth/loginticket";

@singleton()
export class AuthService {
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
    await prisma.applicant.create({
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
      },
    });
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

  async registerApplicantWithGoogle(body: RegisterApplicantWithGoogleRequest, googleToken: TokenPayload) {
    return await prisma.applicant.create({
      data: {
        login: googleToken.email!,
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        contact: body.contact,
        email: googleToken.email!,
        birthDate: body.birthDate,
        googleTokenSub: googleToken.sub,
      },
    });
  }

  async registerApplicantWithHh(body: RegisterApplicantWithHhRequest, hhToken: registerApplicantHhToken) {
    const applicant = await prisma.applicant.create({
      data: {
        login: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        contact: body.contact,
        email: body.email,
        birthDate: body.birthDate,
      },
    });

    await prisma.hhToken.create({
      data: {
        ...hhToken,
        applicant: { connect: { id: applicant.id } },
      }
    })

    return applicant
  }
}
