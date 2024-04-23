import { Body, Controller, Request, Path, Post, Query, Response, Route, Tags, } from "tsoa";
import { prisma, } from "../../../infrastructure/database/prisma.provider";
import { HttpError, HttpErrorBody, } from "../../../infrastructure/error/http.error";
import { Applicant, Employer, } from "@prisma/client";
import { UserRole, } from "../auth.dto";
import { injectable, } from "tsyringe";
import { PasswordResetService, } from "./password-reset.service";
import { AuthService, } from "../auth.service";
import { Request as ExpressRequest, } from "express";


@injectable()
@Route("api/v1/passwordResets",)
@Tags("Password Reset",)
export class PasswordResetController extends Controller {
  constructor(private readonly passwordResetService: PasswordResetService, private readonly authService: AuthService,) {
    super();
  }

  @Post()
  @Response<HttpErrorBody & {"error": "User not found"}>(404,)
  public async initiateReset(
    @Request() req: ExpressRequest,
    @Query() email: string,
    @Query() role: "APPLICANT" | "EMPLOYER",
  ): Promise<void> {
    let user: Applicant | Employer | null = null;
    if (role === UserRole.APPLICANT) user = await prisma.applicant.findUnique({ where: { email, }, },);
    if (role === UserRole.EMPLOYER) user = await prisma.employer.findUnique({ where: { email, }, },);

    if (!user) throw new HttpError(404, "User not found",);

    const code = this.passwordResetService.generateCode();
    try {
      await prisma.passwordResetRequest.delete({ where: { email, role, }, },);
    } catch (e) {}

    const passwordResetRequest = await prisma.passwordResetRequest.create({
      data: { email, role, code, },
    },);

    await this.passwordResetService.sendEmail(req.log, email, passwordResetRequest.code,);
  }

  @Post("{code}",)
  @Response<HttpErrorBody & {"error": "Invalid email or code"}>(404,)
  public async verifyCode(
    @Path() code: string,
    @Body() body: { email: string, password: string },
  ): Promise<void> {
    const where = {
      code,
      email: body.email,
    };

    if (!await prisma.passwordResetRequest.exists(where,)) throw new HttpError(404, "Invalid email or code",);

    const passwordResetRequest = await prisma.passwordResetRequest.delete({ where, },);
    const passwordHash = await this.authService.generatePasswordHash(body.password,);

    let userRoleWithId: { applicantId: string } | { employerId: string } | null = null;

    if (passwordResetRequest.role === UserRole.APPLICANT) {
      const applicant = await prisma.applicant.findUnique({
        where: { email: passwordResetRequest.email, },
        select: { id: true, },
      },);

      if (applicant) userRoleWithId = { applicantId: applicant.id, };
    }

    if (passwordResetRequest.role === UserRole.EMPLOYER) {
      const employer = await prisma.employer.findUnique({
        where: { email: passwordResetRequest.email, },
        select: { id: true, },
      },);

      if (employer) userRoleWithId = { employerId: employer.id, };
    }

    if (!userRoleWithId) throw new HttpError(404, "Invalid email or code",);

    await prisma.password.upsert({
      where: userRoleWithId,
      update: {
        hash: passwordHash,
      },
      create: {
        hash: passwordHash,
        ...userRoleWithId,
      },
    },);
  }
}
