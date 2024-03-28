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
import { HHAuthorizationCodeRequest } from "../../../external/hh/auth/auth.dto";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import { HttpErrorBody } from "../../../infrastructure/error/http.error";
import { HhApplicantService } from "../../../external/hh/applicant/applicant.service";
import { prisma } from "../../../infrastructure/database/prisma.provider";


@injectable()
@Route("api/v1/hh/auth")
@Tags("hh.ru Auth")
export class HhAuthController extends Controller {
  constructor(private readonly hhAuthService: HhAuthService,
              private readonly hhApplicantService: HhApplicantService,
              ) {
    super();
  }

  @Get("authorizeUrl")
  @Example<string>("https://hh.ru/oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI")
  @Security("jwt", [UserRole.APPLICANT])
  async getAuthorizeUrl(): Promise<string> {
    return this.hhAuthService.getAuthorizeUrl();
  }

  @Put("me/authorizationCode")
  @Response<HttpErrorBody & {"error": "Code is invalid"}>(401)
  @Response<HttpErrorBody & {"error": "hh.ru user is not applicant"}>(403)
  @Security("jwt", [UserRole.APPLICANT])
  public async putMeHhAuthorizationCode(
    @Request() req: JwtModel,
    @Body() body: HHAuthorizationCodeRequest,
  ): Promise<void> {
    const hhToken = await this.hhAuthService.createToken(body.authorizationCode);
    const hhApplicant = await this.hhApplicantService.getMeApplicant(hhToken.accessToken);

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