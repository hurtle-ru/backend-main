import { Controller, Path, Post, Request, Route, Security, Tags, Response } from "tsoa";
import { JwtModel, UserRole } from "../auth.dto";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { injectable } from "tsyringe";
import { EmailVerificationService } from "./email-verification.service";
import { Request as ExpressRequest } from "express";


@injectable()
@Route("api/v1/emailVerifications")
@Tags("Email Verification")
export class EmailVerificationController extends Controller {
  constructor(private readonly emailVerificationService: EmailVerificationService) {
    super();
  }

  @Post()
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER])
  public async createEmailVerification(
    @Request() req: ExpressRequest & JwtModel,
  ) {
    let code = this.emailVerificationService.generateCode();
    while (await prisma.emailVerification.findUnique({ where: { code } })) {
      code = this.emailVerificationService.generateCode();
    }

    await prisma.emailVerification.upsert({
      where: {
        userId_role: {
          userId: req.user.id,
          role: req.user.role,
        },
      },
      create: {
        userId: req.user.id,
        role: req.user.role,
        code: code,
      },
      update: {
        code: code,
      },
    });

    let user: { firstName: string, email: string } | null = null;
    if (req.user.role === UserRole.APPLICANT) user = await prisma.applicant.findUnique({ where: { id: req.user.id } });
    if (req.user.role === UserRole.EMPLOYER) user = await prisma.employer.findUnique({ where: { id: req.user.id } });

    await this.emailVerificationService.sendEmail(user!.firstName, user!.email, code);
  }

  @Post("{code}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER])
  @Response<HttpErrorBody & {"error": "Invalid code"}>(404)
  public async verifyEmail(
    @Request() req: JwtModel,
    @Path() code: string,
  ): Promise<void> {
    const whereEmailVerification = {
      userId: req.user.id,
      role: req.user.role,
      code: code,
    };

    if (!await prisma.emailVerification.findUnique({ where: whereEmailVerification })) throw new HttpError(404, "Invalid code");
    await prisma.emailVerification.delete({ where: whereEmailVerification });

    const updateQuery = {
      where: { id: req.user.id },
      data: { isEmailConfirmed: true },
    };

    if (req.user.role === UserRole.APPLICANT) await prisma.applicant.update(updateQuery);
    if (req.user.role === UserRole.EMPLOYER) await prisma.employer.update(updateQuery);
  }
}
