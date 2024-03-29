import { injectable } from "tsyringe";
import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import { HhAuthService } from "../../../external/hh/auth/auth.service";
import { HhAuthorizationCodeRequest } from "../../../external/hh/auth/auth.dto";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { HhApplicantService } from "../../../external/hh/applicant/applicant.service";
import { prisma } from "../../../infrastructure/database/prisma.provider";


@injectable()
@Route("api/v1/hh/auth")
@Tags("hh.ru Auth")
export class HhAuthController extends Controller {
  constructor(
    private readonly hhAuthService: HhAuthService,
    private readonly hhApplicantService: HhApplicantService,
  ) {
    super();
  }

  @Put("me/authorizationCode")
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error": "hh.ru user is not applicant"}>(403)
  @Response<HttpErrorBody & {"error": "Another user with this HH account already exists"}>(409)
  @Security("jwt", [UserRole.APPLICANT])
  public async putMeHhAuthorizationCode(
    @Request() req: JwtModel,
    @Body() body: HhAuthorizationCodeRequest,
  ): Promise<void> {
    const hhToken = await this.hhAuthService.createToken(body.authorizationCode);
    const hhApplicant = await this.hhApplicantService.getMeApplicant(hhToken.accessToken);

    const SameHhToken = await prisma.hhToken.findUnique({ where: {hhApplicantId: hhApplicant.id } })

    if (SameHhToken?.applicantId != req.user.id) {
      throw new HttpError(409, "Another user with this HH account already exists")
    }

    const applicant = await prisma.applicant.findUnique({ where: {id: req.user.id }, select: { hhToken: true } })
    if (applicant?.hhToken && SameHhToken?.applicantId != applicant?.hhToken.hhApplicantId) {
      throw new HttpError(409, "Can not change hh account.")
    }

    await prisma.hhToken.upsert({
      where: {
        applicantId: req.user.id,
      },
      create: {
        applicantId: req.user.id,
        hhApplicantId: hhApplicant.id,
        accessToken: hhToken.accessToken,
        refreshToken: hhToken.refreshToken,
        expiresIn: hhToken.expiresIn,
      },
      update: {
        hhApplicantId: hhApplicant.id,
        accessToken: hhToken.accessToken,
        refreshToken: hhToken.refreshToken,
        expiresIn: hhToken.expiresIn,
      },
    });
  }
}
